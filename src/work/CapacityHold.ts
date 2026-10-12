/**
 * Capacity holds: a time-boxed reservation one party places on another
 * company's capacity (a pseudonymous person or a role) for a window, ahead of
 * a proposal or work order. A hold is not a commitment: only the employer
 * commits its staff, and a hold that is neither converted nor released lapses
 * at its expiry.
 *
 * A hold is valid only under a `hold-right` term of an executed agreement
 * (`@snyder-tech/keiretsu/commerce/CapacityHoldCheck` checks that), cited here
 * by agreement id and term key.
 *
 * Naming: the lifecycle field is `state`, not `status`, so a capacity hold's
 * `held` state is never read as a charge line's `held` status (an invoicing
 * block with a `holdReasonCode`) or as a core `Hold` (a block awaiting a human
 * decision). Lifecycle: `held → converted | released | lapsed`; the three
 * outcomes are terminal. Each transition is a new revision that names the
 * digest it supersedes; the commercial terms never change after revision 1.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from '../core/Actor.ts';
import { type CanonicalJsonError, digestValueSync } from '../core/CanonicalJson.ts';
import { RevisionFields, revisionChain } from '../core/Envelope.ts';
import { AgreementId, EntityId, WorkOrderId } from '../core/Ids.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';

import { CapacitySubject } from './CapacityOffer.ts';
import { OpenCode } from './Code.ts';
import { PartyRef } from './PartyRef.ts';
import { BudgetMinutes } from './WorkOrder.ts';
import { WorkObjectRef } from './WorkObject.ts';
import { CapacityHoldId } from './WorkIds.ts';

/**
 * Hold lifecycle states. `held` is the only non-terminal state.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityHoldState = Schema.Literals(['held', 'converted', 'released', 'lapsed']);
/** @since 0.1.0 @category models */
export type CapacityHoldState = typeof CapacityHoldState.Type;

/**
 * Adjacency map of legal transitions.
 *
 * @since 0.1.0
 * @category constants
 */
export const CAPACITY_HOLD_TRANSITIONS: { readonly [S in CapacityHoldState]: ReadonlyArray<CapacityHoldState> } = {
  held: ['converted', 'released', 'lapsed'],
  converted: [],
  released: [],
  lapsed: [],
};

/**
 * Whether a hold may move from one state to another.
 *
 * @since 0.1.0
 * @category predicates
 */
export const canTransitionCapacityHold = (from: CapacityHoldState, to: CapacityHoldState): boolean => CAPACITY_HOLD_TRANSITIONS[from].includes(to);

/**
 * The agreement term a hold is placed under: an agreement id and the key of its `hold-right` term.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HoldRightRef = Schema.Struct({ agreementId: AgreementId, key: OpenCode });
/** @since 0.1.0 @category models */
export type HoldRightRef = typeof HoldRightRef.Type;

/**
 * What the hold is for: a commercial proposal (a work object in the holder's
 * system) or an existing work order.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HoldLink = Schema.TaggedUnion({
  proposal: { proposal: WorkObjectRef },
  'work-order': { workOrderId: WorkOrderId },
});
/** @since 0.1.0 @category models */
export type HoldLink = typeof HoldLink.Type;

/**
 * A half-open civil-date window `[start, end)`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityWindow = Schema.Struct({ start: IsoDate, end: IsoDate }).check(Schema.makeFilter((window) => (window.start < window.end ? undefined : 'the window ends after it starts')));
/** @since 0.1.0 @category models */
export type CapacityWindow = typeof CapacityWindow.Type;

interface HoldShape {
  readonly revision: number;
  readonly recordedAt: string;
  readonly holder: PartyRef;
  readonly provider: string;
  readonly window: CapacityWindow;
  readonly bookedOn: string;
  readonly link: HoldLink;
  readonly expiresAt: string;
  readonly state: CapacityHoldState;
  readonly closedAt?: string | undefined;
  readonly closedBy?: Actor | undefined;
  readonly convertedTo?: string | undefined;
}

const closedFieldsMatchState = (hold: HoldShape): string | undefined =>
  (hold.state === 'held') === (hold.closedAt === undefined && hold.closedBy === undefined) ? undefined : 'closedAt and closedBy are present exactly when the hold is no longer held';

const conversionTarget = (hold: HoldShape): string | undefined => {
  if ((hold.state === 'converted') !== (hold.convertedTo !== undefined)) return 'convertedTo is present exactly when the hold is converted';
  return hold.link._tag === 'work-order' && hold.convertedTo !== undefined && hold.convertedTo !== hold.link.workOrderId ? 'a hold linked to a work order converts into that order' : undefined;
};

const closingTime = (hold: HoldShape): string | undefined => {
  if (hold.closedAt === undefined) return undefined;
  if (hold.state === 'lapsed') return hold.closedAt >= hold.expiresAt ? undefined : 'a hold lapses only at or after its expiry';
  return hold.closedAt < hold.expiresAt ? undefined : 'an expired hold lapses; it can no longer be converted or released';
};

/**
 * A capacity hold.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityHold = Schema.Struct({
  id: CapacityHoldId,
  ...RevisionFields,
  recordedAt: Instant,
  /** The party reserving capacity. */
  holder: PartyRef,
  /** The employer whose capacity is reserved. */
  provider: EntityId,
  heldBy: Actor,
  subject: CapacitySubject,
  window: CapacityWindow,
  minutes: BudgetMinutes.check(Schema.isGreaterThanOrEqualTo(1)),
  /** The civil date the hold was booked; lead time runs from here to `window.start`. */
  bookedOn: IsoDate,
  /** Lead-time price class claimed for the reserved capacity (checked against the agreement). */
  leadTimeClass: OpenCode,
  holdRight: HoldRightRef,
  link: HoldLink,
  expiresAt: Instant,
  state: CapacityHoldState,
  closedAt: Schema.optional(Instant),
  closedBy: Schema.optional(Actor),
  convertedTo: Schema.optional(WorkOrderId),
}).check(
  revisionChain,
  Schema.makeFilter((hold) => (hold.holder._tag === 'entity' && hold.holder.entityId === hold.provider ? 'a hold reserves another party’s capacity' : undefined)),
  Schema.makeFilter((hold) => (hold.bookedOn <= hold.window.start ? undefined : 'a hold is booked on or before its window starts')),
  Schema.makeFilter((hold) => (hold.expiresAt > hold.recordedAt || hold.revision > 1 ? undefined : 'a hold expires after it is recorded')),
  Schema.makeFilter((hold) => (hold.revision > 1 || hold.state === 'held' ? undefined : 'revision 1 of a hold is held')),
  Schema.makeFilter(closedFieldsMatchState),
  Schema.makeFilter(conversionTarget),
  Schema.makeFilter(closingTime),
);
/** @since 0.1.0 @category models */
export type CapacityHold = typeof CapacityHold.Type;

/**
 * Whether a hold still reserves capacity.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isOutstanding = (hold: CapacityHold): boolean => hold.state === 'held';

/**
 * The terms that never change after revision 1, as a stable comparison key.
 *
 * @since 0.1.0
 * @category accessors
 */
export const holdTermsKey = (hold: CapacityHold): string =>
  JSON.stringify([hold.holder, hold.provider, hold.subject, hold.window, hold.minutes, hold.bookedOn, hold.leadTimeClass, hold.holdRight, hold.link, hold.expiresAt]);

/**
 * Keep the highest revision of each hold.
 *
 * @since 0.1.0
 * @category combinators
 */
export const latestHolds = (holds: ReadonlyArray<CapacityHold>): ReadonlyArray<CapacityHold> => {
  const latest = new Map<string, CapacityHold>();
  for (const hold of holds) {
    const current = latest.get(hold.id);
    if (current === undefined || hold.revision > current.revision) latest.set(hold.id, hold);
  }
  return [...latest.values()];
};

/**
 * Why a hold cannot move to the requested state.
 *
 * @since 0.1.0
 * @category errors
 */
export class CapacityHoldTransitionDenied extends Schema.TaggedError<CapacityHoldTransitionDenied>()('CapacityHoldTransitionDenied', {
  holdId: Schema.String,
  from: CapacityHoldState,
  to: CapacityHoldState,
  reason: Schema.Literals(['illegal-transition', 'expired', 'not-expired']),
}) {}

const denial = (hold: CapacityHold, to: CapacityHoldState, at: Instant) => {
  if (!canTransitionCapacityHold(hold.state, to)) return 'illegal-transition' as const;
  if (to === 'lapsed') return at >= hold.expiresAt ? undefined : ('not-expired' as const);
  return at < hold.expiresAt ? undefined : ('expired' as const);
};

/**
 * The outcome of a transition: the target state, and the work order for a conversion.
 *
 * @since 0.1.0
 * @category models
 */
export type HoldOutcome = { readonly to: 'converted'; readonly workOrderId: WorkOrderId } | { readonly to: 'released' | 'lapsed' };

/**
 * Close a hold: the next revision, superseding the digest of the current one.
 * Conversion names the work order; release and lapse name none.
 *
 * @since 0.1.0
 * @category transitions
 */
export const closeHold = (options: {
  readonly hold: CapacityHold;
  readonly outcome: HoldOutcome;
  readonly by: Actor;
  readonly at: Instant;
}): Effect.Effect<CapacityHold, CapacityHoldTransitionDenied | CanonicalJsonError | Schema.SchemaError> =>
  Effect.gen(function* () {
    const { hold, outcome } = options;
    const reason = denial(hold, outcome.to, options.at);
    if (reason !== undefined) return yield* Effect.fail(new CapacityHoldTransitionDenied({ holdId: hold.id, from: hold.state, to: outcome.to, reason }));
    const encoded = yield* Schema.encodeEffect(CapacityHold)(hold);
    const supersedesDigest = yield* digestValueSync(encoded);
    return yield* Schema.decodeUnknownEffect(CapacityHold)({
      ...encoded,
      revision: hold.revision + 1,
      supersedesDigest,
      recordedAt: options.at,
      state: outcome.to,
      closedAt: options.at,
      closedBy: options.by,
      ...(outcome.to === 'converted' ? { convertedTo: outcome.workOrderId } : {}),
    });
  });
