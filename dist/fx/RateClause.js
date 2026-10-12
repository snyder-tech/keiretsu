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
import { digestValue } from "../core/CanonicalJson.js";
import { CurrencyCode } from "../core/Currency.js";
import { Decimal, toScaled } from "../core/Decimal.js";
import { RoundingMode } from "../core/Rounding.js";
import { IsoDate } from "../core/Temporal.js";
import { FxSeriesId, Weekday } from "./FxSeries.js";
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
export const DateRule = Schema.TaggedUnion({
    TransactionDate: {},
    WeekEnding: { weekEndsOn: Weekday },
    PeriodEnd: {},
    PeriodAverage: {},
    InvoiceDate: {},
    SettlementDate: {},
    FixedDate: { date: IsoDate },
});
const LookbackDays = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 31 }));
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
export const Fallback = Schema.TaggedUnion({
    PreviousPublished: { maxLookbackDays: LookbackDays },
    ProvisionalThenTrueUp: { maxLookbackDays: LookbackDays },
    Hold: {},
});
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
export const RateRoute = Schema.TaggedUnion({
    Direct: { series: FxSeriesId },
    Triangulated: { pivot: CurrencyCode, fromLeg: FxSeriesId, toLeg: FxSeriesId },
    Fixed: {
        base: CurrencyCode,
        quote: CurrencyCode,
        rate: Decimal.check(Schema.makeFilter((rate) => (toScaled(rate) > 0n ? undefined : 'fixed rate must be positive'))),
    },
});
/**
 * Open purpose code. Known values: `book`, `tax`, `contract`, `customs`, `statistical`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ClausePurpose = Schema.String.check(Schema.isPattern(/^(?:x-)?[a-z0-9]+(?:-[a-z0-9]+)*$/));
/**
 * A complete rate clause.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateClause = Schema.Struct({
    purpose: ClausePurpose,
    route: RateRoute,
    dateRule: DateRule,
    fallback: Fallback,
    /** Rounding applied once, when a converted amount is reduced to minor units. */
    rounding: RoundingMode,
});
/**
 * SHA-256 over the clause's canonical JSON; snapshots cite it.
 *
 * @since 0.1.0
 * @category digests
 */
export const clauseDigest = (clause) => Effect.orDie(digestValue(Schema.encodeSync(RateClause)(clause)));
//# sourceMappingURL=RateClause.js.map