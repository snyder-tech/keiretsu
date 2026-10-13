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
import { Actor } from "../core/Actor.js";
import { digestValueSync } from "../core/CanonicalJson.js";
import { RevisionFields, revisionChain } from "../core/Envelope.js";
import { AgreementId, EntityId, WorkOrderId } from "../core/Ids.js";
import { compareInstants, Instant, IsoDate } from "../core/Temporal.js";
import { Effect, Schema } from 'effect';
import { CapacitySubject } from "./CapacityOffer.js";
import { OpenCode } from "./Code.js";
import { PartyRef } from "./PartyRef.js";
import { BudgetMinutes } from "./WorkOrder.js";
import { WorkObjectRef } from "./WorkObject.js";
import { CapacityHoldId } from "./WorkIds.js";
/**
 * Hold lifecycle states. `held` is the only non-terminal state.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityHoldState = Schema.Literals(['held', 'converted', 'released', 'lapsed']);
/**
 * Adjacency map of legal transitions.
 *
 * @since 0.1.0
 * @category constants
 */
export const CAPACITY_HOLD_TRANSITIONS = {
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
export const canTransitionCapacityHold = (from, to) => CAPACITY_HOLD_TRANSITIONS[from].includes(to);
/**
 * The agreement term a hold is placed under: an agreement id and the key of its `hold-right` term.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HoldRightRef = Schema.Struct({ agreementId: AgreementId, key: OpenCode });
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
/**
 * A half-open civil-date window `[start, end)`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityWindow = Schema.Struct({ start: IsoDate, end: IsoDate }).check(Schema.makeFilter((window) => (window.start < window.end ? undefined : 'the window ends after it starts')));
const closedFieldsMatchState = (hold) => (hold.state === 'held') === (hold.closedAt === undefined && hold.closedBy === undefined) ? undefined : 'closedAt and closedBy are present exactly when the hold is no longer held';
const conversionTarget = (hold) => {
    if ((hold.state === 'converted') !== (hold.convertedTo !== undefined))
        return 'convertedTo is present exactly when the hold is converted';
    return hold.link._tag === 'work-order' && hold.convertedTo !== undefined && hold.convertedTo !== hold.link.workOrderId ? 'a hold linked to a work order converts into that order' : undefined;
};
const closingTime = (hold) => {
    if (hold.closedAt === undefined)
        return undefined;
    if (hold.state === 'lapsed')
        return compareInstants(hold.closedAt, hold.expiresAt) >= 0 ? undefined : 'a hold lapses only at or after its expiry';
    return compareInstants(hold.closedAt, hold.expiresAt) < 0 ? undefined : 'an expired hold lapses; it can no longer be converted or released';
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
}).check(revisionChain, Schema.makeFilter((hold) => (hold.holder._tag === 'entity' && hold.holder.entityId === hold.provider ? 'a hold reserves another party’s capacity' : undefined)), Schema.makeFilter((hold) => (hold.bookedOn <= hold.window.start ? undefined : 'a hold is booked on or before its window starts')), Schema.makeFilter((hold) => (compareInstants(hold.expiresAt, hold.recordedAt) > 0 || hold.revision > 1 ? undefined : 'a hold expires after it is recorded')), Schema.makeFilter((hold) => (hold.revision > 1 || hold.state === 'held' ? undefined : 'revision 1 of a hold is held')), Schema.makeFilter(closedFieldsMatchState), Schema.makeFilter(conversionTarget), Schema.makeFilter(closingTime));
/**
 * Whether a hold still reserves capacity.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isOutstanding = (hold) => hold.state === 'held';
/**
 * The terms that never change after revision 1, as a stable comparison key.
 *
 * @since 0.1.0
 * @category accessors
 */
export const holdTermsKey = (hold) => JSON.stringify([hold.holder, hold.provider, hold.subject, hold.window, hold.minutes, hold.bookedOn, hold.leadTimeClass, hold.holdRight, hold.link, hold.expiresAt]);
/**
 * Keep the highest revision of each hold.
 *
 * @since 0.1.0
 * @category combinators
 */
export const latestHolds = (holds) => {
    const latest = new Map();
    for (const hold of holds) {
        const current = latest.get(hold.id);
        if (current === undefined || hold.revision > current.revision)
            latest.set(hold.id, hold);
    }
    return [...latest.values()];
};
/**
 * Why a hold cannot move to the requested state.
 *
 * @since 0.1.0
 * @category errors
 */
export class CapacityHoldTransitionDenied extends Schema.TaggedError()('CapacityHoldTransitionDenied', {
    holdId: Schema.String,
    from: CapacityHoldState,
    to: CapacityHoldState,
    reason: Schema.Literals(['illegal-transition', 'expired', 'not-expired']),
}) {
}
const denial = (hold, to, at) => {
    if (!canTransitionCapacityHold(hold.state, to))
        return 'illegal-transition';
    if (to === 'lapsed')
        return compareInstants(at, hold.expiresAt) >= 0 ? undefined : 'not-expired';
    return compareInstants(at, hold.expiresAt) < 0 ? undefined : 'expired';
};
/**
 * Close a hold: the next revision, superseding the digest of the current one.
 * Conversion names the work order; release and lapse name none.
 *
 * @since 0.1.0
 * @category transitions
 */
export const closeHold = (options) => Effect.gen(function* () {
    const { hold, outcome } = options;
    const reason = denial(hold, outcome.to, options.at);
    if (reason !== undefined)
        return yield* Effect.fail(new CapacityHoldTransitionDenied({ holdId: hold.id, from: hold.state, to: outcome.to, reason }));
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
//# sourceMappingURL=CapacityHold.js.map