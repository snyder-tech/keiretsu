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
import { type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { WorkOrderId } from '../core/Ids.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
/**
 * Hold lifecycle states. `held` is the only non-terminal state.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacityHoldState: Schema.Literals<readonly ["held", "converted", "released", "lapsed"]>;
/** @since 0.1.0 @category models */
export type CapacityHoldState = typeof CapacityHoldState.Type;
/**
 * Adjacency map of legal transitions.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const CAPACITY_HOLD_TRANSITIONS: {
    readonly [S in CapacityHoldState]: ReadonlyArray<CapacityHoldState>;
};
/**
 * Whether a hold may move from one state to another.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const canTransitionCapacityHold: (from: CapacityHoldState, to: CapacityHoldState) => boolean;
/**
 * The agreement term a hold is placed under: an agreement id and the key of its `hold-right` term.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HoldRightRef: Schema.Struct<{
    readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
    readonly key: Schema.String;
}>;
/** @since 0.1.0 @category models */
export type HoldRightRef = typeof HoldRightRef.Type;
/**
 * What the hold is for: a commercial proposal (a work object in the holder's
 * system) or an existing work order.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HoldLink: Schema.TaggedUnion<{
    readonly proposal: Schema.TaggedStruct<"proposal", {
        readonly proposal: Schema.Struct<{
            readonly system: Schema.String;
            readonly owner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
            readonly recordId: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>;
    }>;
    readonly "work-order": Schema.TaggedStruct<"work-order", {
        readonly workOrderId: Schema.brand<Schema.String, "keiretsu/WorkOrderId">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type HoldLink = typeof HoldLink.Type;
/**
 * A half-open civil-date window `[start, end)`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacityWindow: Schema.Struct<{
    readonly start: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly end: Schema.brand<Schema.String, "keiretsu/IsoDate">;
}>;
/** @since 0.1.0 @category models */
export type CapacityWindow = typeof CapacityWindow.Type;
/**
 * A capacity hold.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacityHold: Schema.Struct<{
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    /** The party reserving capacity. */
    readonly holder: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    /** The employer whose capacity is reserved. */
    readonly provider: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly heldBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly subject: Schema.TaggedUnion<{
        readonly role: Schema.TaggedStruct<"role", {
            readonly roleKey: Schema.String;
        }>;
        readonly person: Schema.TaggedStruct<"person", {
            readonly person: Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>;
            readonly roleKey: Schema.optional<Schema.String>;
        }>;
    }>;
    readonly window: Schema.Struct<{
        readonly start: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly end: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    }>;
    readonly minutes: Schema.Number;
    /** The civil date the hold was booked; lead time runs from here to `window.start`. */
    readonly bookedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    /** Lead-time price class claimed for the reserved capacity (checked against the agreement). */
    readonly leadTimeClass: Schema.String;
    readonly holdRight: Schema.Struct<{
        readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
        readonly key: Schema.String;
    }>;
    readonly link: Schema.TaggedUnion<{
        readonly proposal: Schema.TaggedStruct<"proposal", {
            readonly proposal: Schema.Struct<{
                readonly system: Schema.String;
                readonly owner: Schema.TaggedUnion<{
                    readonly entity: Schema.TaggedStruct<"entity", {
                        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                    }>;
                    readonly counterparty: Schema.TaggedStruct<"counterparty", {
                        readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                    }>;
                }>;
                readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
                readonly recordId: Schema.NonEmptyString;
                readonly label: Schema.optional<Schema.NonEmptyString>;
            }>;
        }>;
        readonly "work-order": Schema.TaggedStruct<"work-order", {
            readonly workOrderId: Schema.brand<Schema.String, "keiretsu/WorkOrderId">;
        }>;
    }>;
    readonly expiresAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly state: Schema.Literals<readonly ["held", "converted", "released", "lapsed"]>;
    readonly closedAt: Schema.optional<Schema.brand<Schema.String, "keiretsu/Instant">>;
    readonly closedBy: Schema.optional<Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>>;
    readonly convertedTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/WorkOrderId">>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/CapacityHoldId">;
}>;
/** @since 0.1.0 @category models */
export type CapacityHold = typeof CapacityHold.Type;
/**
 * Whether a hold still reserves capacity.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isOutstanding: (hold: CapacityHold) => boolean;
/**
 * The terms that never change after revision 1, as a stable comparison key.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const holdTermsKey: (hold: CapacityHold) => string;
/**
 * Keep the highest revision of each hold.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const latestHolds: (holds: ReadonlyArray<CapacityHold>) => ReadonlyArray<CapacityHold>;
declare const CapacityHoldTransitionDenied_base: Schema.Class<CapacityHoldTransitionDenied, Schema.TaggedStruct<"CapacityHoldTransitionDenied", {
    readonly holdId: Schema.String;
    readonly from: Schema.Literals<readonly ["held", "converted", "released", "lapsed"]>;
    readonly to: Schema.Literals<readonly ["held", "converted", "released", "lapsed"]>;
    readonly reason: Schema.Literals<readonly ["illegal-transition", "expired", "not-expired"]>;
}>, import("effect/Cause").YieldableError>;
/**
 * Why a hold cannot move to the requested state.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class CapacityHoldTransitionDenied extends CapacityHoldTransitionDenied_base {
}
/**
 * The outcome of a transition: the target state, and the work order for a conversion.
 *
 * @since 0.1.0
 * @category models
 */
export type HoldOutcome = {
    readonly to: 'converted';
    readonly workOrderId: WorkOrderId;
} | {
    readonly to: 'released' | 'lapsed';
};
/**
 * Close a hold: the next revision, superseding the digest of the current one.
 * Conversion names the work order; release and lapse name none.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const closeHold: (options: {
    readonly hold: CapacityHold;
    readonly outcome: HoldOutcome;
    readonly by: Actor;
    readonly at: Instant;
}) => Effect.Effect<CapacityHold, CapacityHoldTransitionDenied | CanonicalJsonError | Schema.SchemaError>;
export {};
//# sourceMappingURL=CapacityHold.d.ts.map