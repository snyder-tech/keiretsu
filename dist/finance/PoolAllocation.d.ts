/**
 * Exact pool allocation to cost objects.
 *
 * {@link allocatePool} splits a pool balance across the targets of the single
 * approved rule in effect, by driver quantity, using core largest-remainder
 * allocation so the lines sum to the balance in minor units. When no rule
 * applies, the rule is ambiguous or driver data is missing, the whole balance
 * stays on an explicit `unallocated` line with a hold. There is no balancing
 * plug and no fallback rule.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type AllocationRule } from './AllocationRule.ts';
import { type CostPool, type PoolBalance } from './CostPool.ts';
/**
 * A measured driver quantity for one cost object in a period.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DriverMeasurement: Schema.Struct<{
    readonly driverTag: Schema.NonEmptyString;
    readonly costObjectId: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type DriverMeasurement = typeof DriverMeasurement.Type;
/**
 * One allocation output line.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AllocationLine: Schema.TaggedUnion<{
    readonly allocated: Schema.TaggedStruct<"allocated", {
        readonly costObjectId: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly ruleId: Schema.brand<Schema.String, "keiretsu/RuleId">;
        readonly ruleRevision: Schema.Number;
    }>;
    readonly unallocated: Schema.TaggedStruct<"unallocated", {
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly reasonCode: Schema.NonEmptyString;
    }>;
}>;
/** @since 0.1.0 @category models */
export type AllocationLine = typeof AllocationLine.Type;
/**
 * Allocation of one pool balance for one period.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PoolAllocation: Schema.Struct<{
    readonly poolId: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly total: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly lines: Schema.NonEmptyArray<Schema.TaggedUnion<{
        readonly allocated: Schema.TaggedStruct<"allocated", {
            readonly costObjectId: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly ruleId: Schema.brand<Schema.String, "keiretsu/RuleId">;
            readonly ruleRevision: Schema.Number;
        }>;
        readonly unallocated: Schema.TaggedStruct<"unallocated", {
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly reasonCode: Schema.NonEmptyString;
        }>;
    }>>;
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type PoolAllocation = typeof PoolAllocation.Type;
/**
 * Allocate a pool balance exactly. The first day of the balance's period selects the rule version.
 *
 * Hold codes on the `unallocated` line: `allocation.currency`, `allocation.no-rule`,
 * `allocation.ambiguous-rule`, `allocation.entity-mismatch`, `allocation.measurement-missing`,
 * `allocation.zero-driver`.
 *
 * @since 0.1.0
 * @category allocation
 */
export declare const allocatePool: (options: {
    readonly pool: CostPool;
    readonly balance: PoolBalance;
    readonly rules: ReadonlyArray<AllocationRule>;
    readonly measurements: ReadonlyArray<DriverMeasurement>;
}) => Effect.Effect<PoolAllocation>;
/**
 * Sum of an allocation's lines (equals `total` by construction).
 *
 * @since 0.1.0
 * @category math
 */
export declare const allocatedTotal: (allocation: PoolAllocation) => bigint;
//# sourceMappingURL=PoolAllocation.d.ts.map