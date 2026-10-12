/**
 * Transfer allocations: minutes of one attested labour event moved along one
 * route under one binding.
 *
 * Allocations are revisioned (event id + event revision, allocation revision).
 * Re-routing reverses an allocation and creates a replacement that names it;
 * attested time is never touched. Conservation: active minutes allocated from
 * an event revision never exceed the event's minutes.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import type { ValidationIssue } from '../core/Issue.ts';
/**
 * Allocation invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const allocationRules: {
    readonly positive: import("./Invariant.ts").Rule<{
        readonly minutes: number;
    }>;
    readonly reversalSelf: import("./Invariant.ts").Rule<{
        readonly id: string;
        readonly reversesAllocationId?: string | undefined;
    }>;
};
/**
 * An allocation.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TransferAllocation: Schema.Struct<{
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
    readonly eventRevision: Schema.Number;
    readonly eventDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly routeId: Schema.brand<Schema.String, "keiretsu/RouteId">;
    readonly routeRevision: Schema.Number;
    readonly bindingId: Schema.brand<Schema.String, "keiretsu/RouteBindingId">;
    readonly minutes: Schema.Number;
    readonly state: Schema.Literals<readonly ["active", "reversed"]>;
    /** Set on a replacement: the allocation it replaces, which must be reversed. */
    readonly reversesAllocationId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AllocationId">>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/AllocationId">;
}>;
/** @since 0.1.0 @category models */
export type TransferAllocation = typeof TransferAllocation.Type;
/**
 * Port: the labour event an allocation draws from (supplied by `@snyder-tech/keiretsu/work`).
 *
 * @since 0.1.0
 * @category models
 */
export interface LabourEventRef {
    readonly id: string;
    readonly revision: number;
    readonly minutes: number;
}
/**
 * Keep the highest revision of each allocation id, independent of input order.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const latestAllocations: (allocations: ReadonlyArray<TransferAllocation>) => ReadonlyArray<TransferAllocation>;
/**
 * Cross-record checks: conservation, reversal chains and stale event revisions.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateAllocations: (options: {
    readonly allocations: ReadonlyArray<TransferAllocation>;
    readonly events: ReadonlyArray<LabourEventRef>;
}) => ReadonlyArray<ValidationIssue>;
/**
 * Active minutes allocated for a set of allocation ids (latest revisions).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const activeMinutes: (allocations: ReadonlyArray<TransferAllocation>, ids: ReadonlyArray<string>) => number;
//# sourceMappingURL=TransferAllocation.d.ts.map