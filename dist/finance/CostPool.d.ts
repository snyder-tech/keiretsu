/**
 * Cost pools and their period balances.
 *
 * A pool gathers one kind of cost for one entity in that entity's currency.
 * Its period balance is a book fact with evidence; supporting layers (payroll
 * registers, cloud invoices) reconcile to it and are never added on top.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const CostPoolId: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
/** @since 0.1.0 @category models */
export type CostPoolId = typeof CostPoolId.Type;
/**
 * What the pool holds. Open list: adopters may add `x-` kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostPoolKind: Schema.Union<readonly [Schema.Literals<readonly ["payroll", "burden", "benefits", "contractor", "cloud-ai", "tooling", "facilities", "overhead"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type CostPoolKind = typeof CostPoolKind.Type;
/**
 * How the pool's cost moves with activity.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBehaviour: Schema.Literals<readonly ["variable", "fixed", "mixed"]>;
/** @since 0.1.0 @category models */
export type CostBehaviour = typeof CostBehaviour.Type;
/**
 * A cost pool of one entity in one currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostPool: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly name: Schema.NonEmptyString;
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["payroll", "burden", "benefits", "contractor", "cloud-ai", "tooling", "facilities", "overhead"]>, Schema.String]>;
    readonly behaviour: Schema.Literals<readonly ["variable", "fixed", "mixed"]>;
    readonly recovery: Schema.Literals<readonly ["direct", "allocated", "capitalizable-candidate"]>;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
}>;
/** @since 0.1.0 @category models */
export type CostPool = typeof CostPool.Type;
/**
 * The booked amount of a pool for a period, with evidence.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PoolBalance: Schema.Struct<{
    readonly poolId: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type PoolBalance = typeof PoolBalance.Type;
//# sourceMappingURL=CostPool.d.ts.map