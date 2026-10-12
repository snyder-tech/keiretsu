/**
 * Candidate pools: for one regime and taxable year, per claimant, the
 * candidate minutes and wage-derived cost base by category, each with the
 * inputs it was derived from. Only attributions with no blocking issue enter a
 * pool. Status is always `candidate`; no credit, deduction or filing amount is
 * computed, and base-period years that are missing stay `unknown`.
 *
 * Wage bases are allocated to categories by recorded minutes (largest
 * remainder, so the parts always sum to the person's base); the remainder that
 * no eligible slice covers stays outside the pool.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type CanonicalJsonError } from '../core/CanonicalJson.ts';
import type { ValidationReport } from '../core/Issue.ts';
import type { IncentiveSet } from './IncentiveSet.ts';
import { type ScreenOptions } from './Screen.ts';
/**
 * Function name recorded on every pool (derivation-style).
 *
 * @since 0.1.0
 * @category constants
 */
export declare const FUNCTION = "@snyder-tech/keiretsu/tax-incentives/CandidatePool#candidatePools";
/** @since 0.1.0 @category constants */
export declare const FUNCTION_VERSION = "0.1.0";
/**
 * One category line of a pool.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CandidateCategory: Schema.Struct<{
    readonly category: Schema.NonEmptyString;
    readonly basis: Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder"]>;
    readonly minutes: Schema.Number;
    readonly wageBase: Schema.TaggedUnion<{
        readonly unknown: Schema.TaggedStruct<"unknown", {
            readonly reason: Schema.NonEmptyString;
        }>;
        readonly amount: Schema.TaggedStruct<"amount", {
            readonly money: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
        }>;
        readonly "not-applicable": Schema.TaggedStruct<"not-applicable", {
            readonly reason: Schema.NonEmptyString;
        }>;
    }>;
    readonly inputs: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type CandidateCategory = typeof CandidateCategory.Type;
/**
 * A claimant's candidate pool for one regime and taxable year.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CandidatePool: Schema.Struct<{
    readonly status: Schema.Literal<"candidate">;
    readonly regimeId: Schema.brand<Schema.String, "keiretsu/RegimeId">;
    readonly regimeCode: Schema.NonEmptyString;
    readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
    readonly claimant: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly categories: Schema.$Array<Schema.Struct<{
        readonly category: Schema.NonEmptyString;
        readonly basis: Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder"]>;
        readonly minutes: Schema.Number;
        readonly wageBase: Schema.TaggedUnion<{
            readonly unknown: Schema.TaggedStruct<"unknown", {
                readonly reason: Schema.NonEmptyString;
            }>;
            readonly amount: Schema.TaggedStruct<"amount", {
                readonly money: Schema.Struct<{
                    readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
                }>;
            }>;
            readonly "not-applicable": Schema.TaggedStruct<"not-applicable", {
                readonly reason: Schema.NonEmptyString;
            }>;
        }>;
        readonly inputs: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly id: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly basePeriods: Schema.$Array<Schema.Struct<{
        readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
        readonly status: Schema.Literals<readonly ["known", "unknown", "attested-none"]>;
    }>>;
    readonly function: Schema.NonEmptyString;
    readonly functionVersion: Schema.NonEmptyString;
    readonly inputs: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly rules: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type CandidatePool = typeof CandidatePool.Type;
/**
 * Pools plus the issues raised while building them.
 *
 * @since 0.1.0
 * @category models
 */
export interface CandidatePoolResult {
    readonly pools: ReadonlyArray<CandidatePool>;
    readonly report: ValidationReport;
}
/**
 * Build candidate pools for one regime and taxable-year label.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const candidatePools: (set: IncentiveSet, regimeId: string, taxYear: string, options?: ScreenOptions) => Effect.Effect<CandidatePoolResult, CanonicalJsonError>;
//# sourceMappingURL=CandidatePool.d.ts.map