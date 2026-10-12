/**
 * Rate clauses: which series, which date, what to do when nothing is published.
 *
 * A clause is agreement or accounting-policy data. Book, tax and contract
 * clauses are kept apart (`purpose`) because tax rules often prescribe a
 * different rate (India Income-tax Rule 115, IRC §989(b)) from the book rate.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type Sha256 } from '../core/CanonicalJson.ts';
/**
 * How the rate date follows from the transaction.
 *
 * - `TransactionDate`, `InvoiceDate`, `SettlementDate`: that date from the request.
 * - `WeekEnding`: the first `weekEndsOn` on or after the transaction date.
 * - `PeriodEnd`: last calendar day of the request's period.
 * - `PeriodAverage`: arithmetic mean of the final observations dated in the period.
 * - `FixedDate`: one stated date regardless of the transaction.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DateRule: Schema.TaggedUnion<{
    readonly TransactionDate: Schema.TaggedStruct<"TransactionDate", {}>;
    readonly WeekEnding: Schema.TaggedStruct<"WeekEnding", {
        readonly weekEndsOn: Schema.Literals<readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>;
    }>;
    readonly PeriodEnd: Schema.TaggedStruct<"PeriodEnd", {}>;
    readonly PeriodAverage: Schema.TaggedStruct<"PeriodAverage", {}>;
    readonly InvoiceDate: Schema.TaggedStruct<"InvoiceDate", {}>;
    readonly SettlementDate: Schema.TaggedStruct<"SettlementDate", {}>;
    readonly FixedDate: Schema.TaggedStruct<"FixedDate", {
        readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type DateRule = typeof DateRule.Type;
/**
 * What to do when the rate date has no observation.
 *
 * - `PreviousPublished`: latest earlier observation within `maxLookbackDays` (final status).
 * - `ProvisionalThenTrueUp`: same lookup, but the snapshot is `provisional` and must be trued up
 *   once the rate for the requested date is published.
 * - `Hold`: fail with `RateHeld`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Fallback: Schema.TaggedUnion<{
    readonly PreviousPublished: Schema.TaggedStruct<"PreviousPublished", {
        readonly maxLookbackDays: Schema.Number;
    }>;
    readonly ProvisionalThenTrueUp: Schema.TaggedStruct<"ProvisionalThenTrueUp", {
        readonly maxLookbackDays: Schema.Number;
    }>;
    readonly Hold: Schema.TaggedStruct<"Hold", {}>;
}>;
/** @since 0.1.0 @category models */
export type Fallback = typeof Fallback.Type;
/**
 * Where the rate comes from.
 *
 * - `Direct`: one series connecting the two currencies (either orientation; inverses are exact).
 * - `Triangulated`: two series through a declared `pivot` (e.g. PKR→USD→INR); the cross is never rounded.
 * - `Fixed`: a contract-fixed rate, `quote` per 1 `base`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateRoute: Schema.TaggedUnion<{
    readonly Direct: Schema.TaggedStruct<"Direct", {
        readonly series: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
    }>;
    readonly Triangulated: Schema.TaggedStruct<"Triangulated", {
        readonly pivot: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly fromLeg: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
        readonly toLeg: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
    }>;
    readonly Fixed: Schema.TaggedStruct<"Fixed", {
        readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type RateRoute = typeof RateRoute.Type;
/**
 * Open purpose code. Known values: `book`, `tax`, `contract`, `customs`, `statistical`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ClausePurpose: Schema.String;
/**
 * A complete rate clause.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateClause: Schema.Struct<{
    readonly purpose: Schema.String;
    readonly route: Schema.TaggedUnion<{
        readonly Direct: Schema.TaggedStruct<"Direct", {
            readonly series: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
        }>;
        readonly Triangulated: Schema.TaggedStruct<"Triangulated", {
            readonly pivot: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly fromLeg: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
            readonly toLeg: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
        }>;
        readonly Fixed: Schema.TaggedStruct<"Fixed", {
            readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        }>;
    }>;
    readonly dateRule: Schema.TaggedUnion<{
        readonly TransactionDate: Schema.TaggedStruct<"TransactionDate", {}>;
        readonly WeekEnding: Schema.TaggedStruct<"WeekEnding", {
            readonly weekEndsOn: Schema.Literals<readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>;
        }>;
        readonly PeriodEnd: Schema.TaggedStruct<"PeriodEnd", {}>;
        readonly PeriodAverage: Schema.TaggedStruct<"PeriodAverage", {}>;
        readonly InvoiceDate: Schema.TaggedStruct<"InvoiceDate", {}>;
        readonly SettlementDate: Schema.TaggedStruct<"SettlementDate", {}>;
        readonly FixedDate: Schema.TaggedStruct<"FixedDate", {
            readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        }>;
    }>;
    readonly fallback: Schema.TaggedUnion<{
        readonly PreviousPublished: Schema.TaggedStruct<"PreviousPublished", {
            readonly maxLookbackDays: Schema.Number;
        }>;
        readonly ProvisionalThenTrueUp: Schema.TaggedStruct<"ProvisionalThenTrueUp", {
            readonly maxLookbackDays: Schema.Number;
        }>;
        readonly Hold: Schema.TaggedStruct<"Hold", {}>;
    }>;
    /** Rounding applied once, when a converted amount is reduced to minor units. */
    readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
}>;
/** @since 0.1.0 @category models */
export type RateClause = typeof RateClause.Type;
/**
 * SHA-256 over the clause's canonical JSON; snapshots cite it.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const clauseDigest: (clause: RateClause) => Effect.Effect<Sha256>;
//# sourceMappingURL=RateClause.d.ts.map