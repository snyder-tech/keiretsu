/**
 * Deliverable acceptance: a human on the receiving side accepts, rejects or
 * accepts with deviations, or records a deemed acceptance under a contract
 * clause. Every acceptance cites the acceptance-criteria digest and the
 * economic events that produced the deliverable. Outcome-billed units and
 * AI-produced work are billable only through an acceptance.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, type HumanActor, type HumanRequired, requireHuman } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { EvidenceRef, RevisionFields, revisionChain } from '../core/Envelope.ts';
import { EventId, WorkOrderId } from '../core/Ids.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';

import { ValueQuantity } from './EconomicEvent.ts';
import { PartyRef } from './PartyRef.ts';
import { WorkObjectRef } from './WorkObject.ts';
import { AcceptanceId } from './WorkIds.ts';

/**
 * The acceptance outcome. `deemed` records acceptance by operation of a
 * contract clause (e.g. silence past a review window); the package records it,
 * it does not compute it.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AcceptanceOutcome = Schema.TaggedUnion({
  accepted: {},
  rejected: { reasons: Schema.NonEmptyArray(Schema.NonEmptyString) },
  'accepted-with-deviations': { deviations: Schema.NonEmptyArray(Schema.NonEmptyString) },
  deemed: { clauseRef: Schema.NonEmptyString, deemedOn: IsoDate },
});
/** @since 0.1.0 @category models */
export type AcceptanceOutcome = typeof AcceptanceOutcome.Type;

/**
 * An acceptance record.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Acceptance = Schema.Struct({
  id: AcceptanceId,
  ...RevisionFields,
  recordedAt: Instant,
  workOrderId: Schema.optional(WorkOrderId),
  deliverable: WorkObjectRef,
  acceptingParty: PartyRef,
  criteriaDigest: Sha256,
  outcome: AcceptanceOutcome,
  eventIds: Schema.NonEmptyArray(EventId),
  valueUnits: Schema.Array(ValueQuantity),
  decidedBy: Actor,
  decidedAt: Instant,
  evidence: Schema.Array(EvidenceRef),
}).check(
  revisionChain,
  Schema.makeFilter((acceptance) => (acceptance.decidedBy._tag === 'human' ? undefined : 'acceptance is decided or recorded by a human')),
  Schema.makeFilter((acceptance) => (acceptance.outcome._tag === 'rejected' && acceptance.valueUnits.length > 0 ? 'a rejection accepts no units' : undefined)),
  Schema.makeFilter((acceptance) => (new Set(acceptance.eventIds).size === acceptance.eventIds.length ? undefined : 'cited events are distinct')),
);
/** @since 0.1.0 @category models */
export type Acceptance = typeof Acceptance.Type;

/**
 * Acceptance fields other than the decider.
 *
 * @since 0.1.0
 * @category models
 */
export type AcceptanceDraft = Omit<typeof Acceptance.Encoded, 'decidedBy'>;

/**
 * A human decides an acceptance. Agents and systems cannot.
 *
 * @since 0.1.0
 * @category transitions
 */
export const accept = (options: { readonly draft: AcceptanceDraft; readonly by: HumanActor }): Effect.Effect<Acceptance, HumanRequired | Schema.SchemaError> =>
  Effect.gen(function* () {
    const human = yield* requireHuman(options.by, 'decide-acceptance');
    return yield* Schema.decodeUnknownEffect(Acceptance)({ ...options.draft, decidedBy: human });
  });
