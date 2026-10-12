/**
 * Cost-plus true-up candidates.
 *
 * {@link trueUp} compares the cost-plus amount due on the period's actual
 * cost base with what was billed, and proposes a debit or credit note. Every
 * billed charge must cite the same cost-base digest as the measurement. An
 * adjustment that lowers taxable income in a jurisdiction whose data pack
 * bars downward adjustments (e.g. India, Income-tax Act 1961 s.92(3)) is
 * flagged and held, never booked. A jurisdiction with no rule data is held
 * too: unknown is not permission.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { CountryCode } from '../core/Country.ts';
import type { CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import type * as Decimal from '../core/Decimal.ts';
import { type EntityId } from '../core/Ids.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { Period } from '../core/Temporal.ts';
import { type CostBaseMeasurement } from './CostBaseDefinition.ts';
/**
 * Data-pack row: whether a jurisdiction bars adjustments that reduce its taxable income.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DownwardAdjustmentRule: Schema.Struct<{
    readonly jurisdiction: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly downwardBarred: Schema.Boolean;
    readonly citation: Schema.NonEmptyString;
    readonly status: Schema.Literals<readonly ["needs-verification", "verified"]>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type DownwardAdjustmentRule = typeof DownwardAdjustmentRule.Type;
/**
 * Illustrative public pack rows. Status is `needs-verification`; adopters verify in private config.
 *
 * @since 0.1.0
 * @category data
 */
export declare const exampleDownwardAdjustmentPack: () => ReadonlyArray<DownwardAdjustmentRule>;
/**
 * A charge billed in the period under a cost-plus schedule.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BilledCharge: Schema.Struct<{
    readonly chargeId: Schema.brand<Schema.String, "keiretsu/ChargeId">;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly costBaseDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
/** @since 0.1.0 @category models */
export type BilledCharge = typeof BilledCharge.Type;
/**
 * A party to the schedule and the jurisdiction whose income it reports.
 *
 * @since 0.1.0
 * @category models
 */
export interface TpParty {
    readonly entityId: EntityId;
    readonly jurisdiction: CountryCode;
}
/**
 * Candidate true-up. `line` is a proposal for a human to approve and book.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TrueUpCandidate: Schema.Struct<{
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly costBaseDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly target: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly billed: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly line: Schema.TaggedUnion<{
        readonly none: Schema.TaggedStruct<"none", {}>;
        readonly "debit-note": Schema.TaggedStruct<"debit-note", {
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly chargeIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
        }>;
        readonly "credit-note": Schema.TaggedStruct<"credit-note", {
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly chargeIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
        }>;
    }>;
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type TrueUpCandidate = typeof TrueUpCandidate.Type;
/**
 * Propose a true-up for a period.
 *
 * Codes: `true-up.measurement-held` (hold), `true-up.cost-base-mismatch` (error), `true-up.currency` (error),
 * `true-up.downward-barred` (hold), `true-up.rule-missing` (hold).
 *
 * @since 0.1.0
 * @category true-up
 */
export declare const trueUp: (options: {
    readonly period: Period;
    readonly actualCostBase: CostBaseMeasurement;
    readonly markup: Decimal.Decimal;
    readonly billedCharges: ReadonlyArray<BilledCharge>;
    readonly parties: {
        readonly provider: TpParty;
        readonly recipient: TpParty;
        readonly rules: ReadonlyArray<DownwardAdjustmentRule>;
    };
    readonly table: CurrencyTableShape;
    readonly rounding: RoundingMode;
}) => Effect.Effect<TrueUpCandidate, UnknownCurrency>;
//# sourceMappingURL=TrueUp.d.ts.map