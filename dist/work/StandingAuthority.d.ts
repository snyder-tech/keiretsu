/**
 * Standing authority: a human grants advance approval for work orders inside a
 * scope, below an auto-approve threshold and within a per-period cap, until it
 * expires (`validTo`). The grantor is recorded as the authority for every
 * order authorised under it. Authorisation only; no prices.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from '../core/Actor.ts';
import { type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { type Instant, type IsoDate } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
import { type WorkOrder } from './WorkOrder.ts';
/**
 * What a standing authority covers. Omitted fields are unconstrained.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AuthorityScope: Schema.Struct<{
    readonly requestingParty: Schema.optional<Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>>;
    readonly performer: Schema.optional<Schema.brand<Schema.String, "keiretsu/EntityId">>;
    readonly workObjectKind: Schema.optional<Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>>;
    readonly workObject: Schema.optional<Schema.Struct<{
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
    }>>;
}>;
/** @since 0.1.0 @category models */
export type AuthorityScope = typeof AuthorityScope.Type;
/**
 * A standing authority.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const StandingAuthority: Schema.Struct<{
    readonly grantor: Schema.TaggedUnion<{
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
    readonly grantingEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly scope: Schema.Struct<{
        readonly requestingParty: Schema.optional<Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>>;
        readonly performer: Schema.optional<Schema.brand<Schema.String, "keiretsu/EntityId">>;
        readonly workObjectKind: Schema.optional<Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>>;
        readonly workObject: Schema.optional<Schema.Struct<{
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
        }>>;
    }>;
    readonly period: Schema.Literals<readonly ["week", "month"]>;
    readonly capMinutes: Schema.Number;
    readonly autoApproveBelowMinutes: Schema.Number;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/StandingAuthorityId">;
}>;
/** @since 0.1.0 @category models */
export type StandingAuthority = typeof StandingAuthority.Type;
declare const StandingAuthorityDenied_base: Schema.Class<StandingAuthorityDenied, Schema.TaggedStruct<"StandingAuthorityDenied", {
    readonly reason: Schema.Literals<readonly ["inactive", "out-of-scope", "over-threshold", "over-cap", "already-authorized"]>;
    readonly workOrderId: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Why a standing authority does not cover an order.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class StandingAuthorityDenied extends StandingAuthorityDenied_base {
}
/**
 * Whether an order falls inside an authority's scope.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const covers: (scope: AuthorityScope, order: WorkOrder) => boolean;
/**
 * Authorise a pending order under a standing authority. `consumedMinutes` is the
 * budget already authorised under it in the current period (the caller's store
 * sums it). `appliedBy` may be a system job: the human authority is the grantor.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const authorizeUnderStanding: (options: {
    readonly order: WorkOrder;
    readonly authority: StandingAuthority;
    readonly usage: {
        readonly on: IsoDate;
        readonly consumedMinutes: number;
    };
    readonly applied: {
        readonly by: Actor;
        readonly at: Instant;
    };
}) => Effect.Effect<WorkOrder, StandingAuthorityDenied | CanonicalJsonError>;
export {};
//# sourceMappingURL=StandingAuthority.d.ts.map