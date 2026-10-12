/**
 * The second rung of the trust ladder: time an agent or system proposes from
 * journals, hooks, work orders or capture, which only its owner can promote
 * into an attested labour event.
 *
 * `promote` takes a {@link HumanActor} so agent code fails to compile, and
 * re-checks at runtime with `requireHuman` for wire-decoded actors.
 * Proposals are owner-only and never cross companies; only the promoted
 * labour event does, carrying the proposal's id and digest as lineage.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, type HumanActor, type HumanRequired, requireHuman } from '../core/Actor.ts';
import { type CanonicalJsonError, type Sha256, digestValue } from '../core/CanonicalJson.ts';
import { type Situs } from '../core/Country.ts';
import { type EvidenceRef } from '../core/Envelope.ts';
import { type EngagementId, type EntityId, type EventId, JournalEntryId, PersonId, type WorkOrderId } from '../core/Ids.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';

import { OpenCode, openVocabulary } from './Code.ts';
import { type BillableIntent, DayMinutes, EconomicEvent, type LabourEvent, type LocationEvidence, type Relationship } from './EconomicEvent.ts';
import { NotOwner } from './NotOwner.ts';
import { identified } from './PersonRef.ts';
import { addDays, IanaTimeZone } from './TimeZone.ts';
import { WorkObjectRef } from './WorkObject.ts';
import { TimeProposalId } from './WorkIds.ts';

/**
 * Where a proposal came from.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ProposalSource = openVocabulary(['journal', 'agent-hook', 'work-order', 'quickfill', 'capture']);

/**
 * How minutes were attributed to the work object.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AttributionMethod = openVocabulary(['explicit-link', 'journal-inference', 'calendar', 'commit-history', 'work-order-plan']);

/**
 * Attribution method and confidence in basis points (0–10,000).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Attribution = Schema.Struct({
  method: AttributionMethod,
  confidenceBps: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10_000 })),
});
/** @since 0.1.0 @category models */
export type Attribution = typeof Attribution.Type;

/**
 * A proposed block of minutes for one owner, work date and work object.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TimeProposal = Schema.Struct({
  id: TimeProposalId,
  owner: PersonId,
  proposedBy: Actor,
  proposedAt: Instant,
  source: ProposalSource,
  journalIds: Schema.Array(JournalEntryId),
  workDate: IsoDate,
  timeZone: IanaTimeZone,
  minutes: DayMinutes,
  workObject: WorkObjectRef,
  activity: OpenCode,
  attribution: Attribution,
  state: Schema.Literals(['pending', 'promoted', 'dismissed']),
}).check(
  Schema.makeFilter((proposal) => (proposal.proposedBy._tag === 'human' ? 'a proposal is drafted by an agent or system; people record time directly' : undefined)),
  Schema.makeFilter((proposal) => (proposal.proposedBy._tag === 'agent' && proposal.journalIds.length === 0 ? 'an agent proposal cites at least one journal entry' : undefined)),
);
/** @since 0.1.0 @category models */
export type TimeProposal = typeof TimeProposal.Type;

/**
 * The proposal was already promoted or dismissed.
 *
 * @since 0.1.0
 * @category errors
 */
export class ProposalNotPending extends Schema.TaggedError<ProposalNotPending>()('ProposalNotPending', { proposalId: Schema.String, state: Schema.String }) {}

/**
 * Facts the owner supplies when attesting: the engagement and where the work was done.
 *
 * @since 0.1.0
 * @category models
 */
export interface PromotionFacts {
  readonly eventId: typeof EventId.Type;
  readonly engagementId: typeof EngagementId.Type;
  readonly employer: typeof EntityId.Type;
  readonly relationship: typeof Relationship.Type;
  readonly situs: Situs;
  readonly locationEvidence: typeof LocationEvidence.Type;
  readonly billableIntent: typeof BillableIntent.Type;
  readonly evidence?: ReadonlyArray<EvidenceRef>;
  readonly evidenceDigests?: ReadonlyArray<Sha256>;
  readonly startedAt?: Instant;
  readonly workOrderId?: typeof WorkOrderId.Type;
  /** The owner may correct the proposed minutes when attesting. */
  readonly minutes?: number;
}

/**
 * Promoted labour event plus the proposal marked `promoted`.
 *
 * @since 0.1.0
 * @category models
 */
export interface Promotion {
  readonly event: LabourEvent;
  readonly proposal: TimeProposal;
}

const ensureOwnerPending = (proposal: TimeProposal, human: HumanActor, action: string): Effect.Effect<void, NotOwner | ProposalNotPending> => {
  if (human.personId !== proposal.owner) return Effect.fail(new NotOwner({ action, owner: proposal.owner, actor: human.personId }));
  return proposal.state === 'pending' ? Effect.void : Effect.fail(new ProposalNotPending({ proposalId: proposal.id, state: proposal.state }));
};

const narrowLabour = (event: EconomicEvent): Effect.Effect<LabourEvent> =>
  event._tag === 'labour' ? Effect.succeed(event) : Effect.die(new Error('decoding a labour candidate produced another event kind'));

/**
 * The owner promotes a pending proposal into an attested labour event.
 *
 * @since 0.1.0
 * @category transitions
 */
export const promote = (options: {
  readonly proposal: TimeProposal;
  readonly owner: HumanActor;
  readonly facts: PromotionFacts;
  readonly at: Instant;
}): Effect.Effect<Promotion, HumanRequired | NotOwner | ProposalNotPending | CanonicalJsonError | Schema.SchemaError> =>
  Effect.gen(function* () {
    // Re-check at runtime: wire-decoded actors can reach here without the compile-time guarantee.
    const human = yield* requireHuman(options.owner, 'promote-time-proposal');
    const { proposal, facts } = options;
    yield* ensureOwnerPending(proposal, human, 'promote-time-proposal');
    const proposalDigest = yield* Schema.encodeEffect(TimeProposal)(proposal).pipe(Effect.orDie, Effect.flatMap(digestValue));
    const candidate = {
      _tag: 'labour',
      assistedBy: [],
      id: facts.eventId,
      revision: 1,
      validFrom: proposal.workDate,
      validTo: addDays(proposal.workDate, 1),
      recordedAt: options.at,
      evidence: facts.evidence ?? [],
      assurance: 'asserted',
      workObject: proposal.workObject,
      person: identified(human.personId),
      engagementId: facts.engagementId,
      employer: facts.employer,
      relationship: facts.relationship,
      situs: facts.situs,
      locationEvidence: facts.locationEvidence,
      workDate: proposal.workDate,
      timeZone: proposal.timeZone,
      ...(facts.startedAt === undefined ? {} : { startedAt: facts.startedAt }),
      minutes: facts.minutes ?? proposal.minutes,
      activity: proposal.activity,
      billableIntent: facts.billableIntent,
      origin: { _tag: 'agent-proposal', proposalId: proposal.id, proposalDigest, promotedBy: human, promotedAt: options.at },
      attestedBy: human,
      attestedAt: options.at,
      evidenceDigests: facts.evidenceDigests ?? [],
      ...(facts.workOrderId === undefined ? {} : { workOrderId: facts.workOrderId }),
    };
    const event = yield* Schema.decodeUnknownEffect(EconomicEvent)(candidate).pipe(Effect.flatMap(narrowLabour));
    return { event, proposal: { ...proposal, state: 'promoted' } };
  });

/**
 * The owner dismisses a pending proposal.
 *
 * @since 0.1.0
 * @category transitions
 */
export const dismiss = (options: { readonly proposal: TimeProposal; readonly owner: HumanActor }): Effect.Effect<TimeProposal, HumanRequired | NotOwner | ProposalNotPending> =>
  Effect.gen(function* () {
    const human = yield* requireHuman(options.owner, 'dismiss-time-proposal');
    yield* ensureOwnerPending(options.proposal, human, 'dismiss-time-proposal');
    return { ...options.proposal, state: 'dismissed' };
  });
