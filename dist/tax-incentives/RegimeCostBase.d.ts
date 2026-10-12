/**
 * Regime cost bases built from payroll wage facts.
 *
 * Each regime names the wage kinds its base may include; everything else is
 * listed as excluded with a reason. A loaded cost rate is never a base. Wages
 * paid by an entity other than the claimant are excluded (a transfer leg does
 * not make the payer the wage payer). No facts means `unknown`, not zero.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { PersonId } from '../core/Actor.ts';
import type { EntityTaxProfile } from './EntityTaxProfile.ts';
import type { IncentiveRegime } from './IncentiveRegime.ts';
import { type TaxYear } from './TaxYear.ts';
import { type WageFact } from './WageFact.ts';
/** @since 0.1.0 @category schemas */
export declare const ExclusionReason: Schema.Literals<readonly ["excluded-by-regime", "loaded-cost-never-a-wage-base", "payer-is-not-claimant", "currency-not-functional"]>;
/** @since 0.1.0 @category models */
export type ExclusionReason = typeof ExclusionReason.Type;
/**
 * One person's cost base for one regime, claimant and taxable year.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RegimeCostBase: Schema.Struct<{
    readonly regimeId: Schema.brand<Schema.String, "keiretsu/RegimeId">;
    readonly claimant: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
    readonly included: Schema.$Array<Schema.NonEmptyString>;
    readonly excluded: Schema.$Array<Schema.Struct<{
        readonly ref: Schema.NonEmptyString;
        readonly reason: Schema.Literals<readonly ["excluded-by-regime", "loaded-cost-never-a-wage-base", "payer-is-not-claimant", "currency-not-functional"]>;
    }>>;
    readonly amount: Schema.TaggedUnion<{
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
    readonly source: Schema.NonEmptyString;
}>;
/** @since 0.1.0 @category models */
export type RegimeCostBase = typeof RegimeCostBase.Type;
/**
 * Build one person's regime cost base from wage facts.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const regimeCostBase: (options: {
    readonly regime: IncentiveRegime;
    readonly claimant: EntityTaxProfile;
    readonly personId: PersonId;
    readonly taxYear: TaxYear;
    readonly wages: ReadonlyArray<WageFact>;
}) => RegimeCostBase;
//# sourceMappingURL=RegimeCostBase.d.ts.map