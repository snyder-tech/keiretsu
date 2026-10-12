/**
 * Rate series and publication calendars as data.
 *
 * A series names exactly one published measure (an FBIL reference rate is not
 * an SBI TT buying rate, and neither is a bank's applied remittance rate). Ids,
 * publishers and measures are open kebab-case codes (`x-` prefixed for
 * adopter extensions), so a new series never breaks the wire; which series an
 * adopter accepts is policy, checked after decode.
 *
 * Quotation convention: an observation's `rate` is the number of `quote`
 * currency units for `unit` units of `base`, exactly as published.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { IsoDate } from '../core/Temporal.ts';
/**
 * Series id, e.g. `fbil-reference-usd-inr`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FxSeriesId: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
/** @since 0.1.0 @category models */
export type FxSeriesId = typeof FxSeriesId.Type;
/**
 * Publication calendar id, e.g. `fbil-mumbai`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CalendarId: Schema.brand<Schema.String, "keiretsu/FxCalendarId">;
/** @since 0.1.0 @category models */
export type CalendarId = typeof CalendarId.Type;
/** @since 0.1.0 @category schemas */
export declare const Weekday: Schema.Literals<readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>;
/** @since 0.1.0 @category models */
export type Weekday = typeof Weekday.Type;
/**
 * Published measure. Known values: `reference`, `weighted-average`, `tt-buying`,
 * `tt-selling`, `noon-buying`, `spot`, `contract`. Open for `x-` extensions.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FxMeasure: Schema.String;
/** @since 0.1.0 @category models */
export type FxMeasure = typeof FxMeasure.Type;
/**
 * Whether a data-pack entry has been checked against the publisher's primary
 * material. Packages ship `needs-verification`; only an adopter's review sets `verified`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Verification: Schema.Literals<readonly ["needs-verification", "verified"]>;
/** @since 0.1.0 @category models */
export type Verification = typeof Verification.Type;
/**
 * Where a definition comes from.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Citation: Schema.Struct<{
    readonly title: Schema.NonEmptyString;
    readonly url: Schema.optional<Schema.String>;
}>;
/** @since 0.1.0 @category models */
export type Citation = typeof Citation.Type;
/**
 * Days the publisher does (not) publish: closed weekdays plus dated closures.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PublicationCalendar: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/FxCalendarId">;
    readonly closedWeekdays: Schema.$Array<Schema.Literals<readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>>;
    readonly closures: Schema.$Array<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    /** Dates up to which `closures` is maintained; beyond it publication days are unknown. */
    readonly maintainedThrough: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly verification: Schema.Literals<readonly ["needs-verification", "verified"]>;
    readonly citation: Schema.Struct<{
        readonly title: Schema.NonEmptyString;
        readonly url: Schema.optional<Schema.String>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type PublicationCalendar = typeof PublicationCalendar.Type;
/**
 * A rate series definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FxSeries: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
    readonly publisher: Schema.String;
    readonly measure: Schema.String;
    readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    /** Units of `base` the published rate refers to (e.g. 100 for a per-100-JPY quote). */
    readonly unit: Schema.Number;
    readonly publishedDecimals: Schema.Number;
    readonly calendar: Schema.brand<Schema.String, "keiretsu/FxCalendarId">;
    /** Calendar days between the rate date and the day the rate is normally published. */
    readonly publicationLagDays: Schema.Number;
    readonly verification: Schema.Literals<readonly ["needs-verification", "verified"]>;
    readonly citation: Schema.Struct<{
        readonly title: Schema.NonEmptyString;
        readonly url: Schema.optional<Schema.String>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type FxSeries = typeof FxSeries.Type;
/**
 * Whether the publisher is expected to publish on `date`. `undefined` when the
 * date lies beyond the calendar's maintained range (unknown is not "closed").
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isPublicationDay: (calendar: PublicationCalendar, date: IsoDate) => boolean | undefined;
//# sourceMappingURL=FxSeries.d.ts.map