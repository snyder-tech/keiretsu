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
import { CurrencyCode } from "../core/Currency.js";
import { IsoDate } from "../core/Temporal.js";
import { WEEKDAYS, weekdayOf } from "./internal/Dates.js";
const CODE = /^(?:x-)?[a-z0-9]+(?:-[a-z0-9]+)*$/;
/**
 * Series id, e.g. `fbil-reference-usd-inr`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FxSeriesId = Schema.String.check(Schema.isPattern(CODE)).pipe(Schema.brand('keiretsu/FxSeriesId'));
/**
 * Publication calendar id, e.g. `fbil-mumbai`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CalendarId = Schema.String.check(Schema.isPattern(CODE)).pipe(Schema.brand('keiretsu/FxCalendarId'));
/** @since 0.1.0 @category schemas */
export const Weekday = Schema.Literals(WEEKDAYS);
/**
 * Published measure. Known values: `reference`, `weighted-average`, `tt-buying`,
 * `tt-selling`, `noon-buying`, `spot`, `contract`. Open for `x-` extensions.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FxMeasure = Schema.String.check(Schema.isPattern(CODE));
/**
 * Whether a data-pack entry has been checked against the publisher's primary
 * material. Packages ship `needs-verification`; only an adopter's review sets `verified`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Verification = Schema.Literals(['needs-verification', 'verified']);
/**
 * Where a definition comes from.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Citation = Schema.Struct({ title: Schema.NonEmptyString, url: Schema.optional(Schema.String) });
/**
 * Days the publisher does (not) publish: closed weekdays plus dated closures.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PublicationCalendar = Schema.Struct({
    id: CalendarId,
    closedWeekdays: Schema.Array(Weekday),
    closures: Schema.Array(IsoDate),
    /** Dates up to which `closures` is maintained; beyond it publication days are unknown. */
    maintainedThrough: Schema.optional(IsoDate),
    verification: Verification,
    citation: Citation,
});
/**
 * A rate series definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FxSeries = Schema.Struct({
    id: FxSeriesId,
    publisher: Schema.String.check(Schema.isPattern(CODE)),
    measure: FxMeasure,
    base: CurrencyCode,
    quote: CurrencyCode,
    /** Units of `base` the published rate refers to (e.g. 100 for a per-100-JPY quote). */
    unit: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    publishedDecimals: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 12 })),
    calendar: CalendarId,
    /** Calendar days between the rate date and the day the rate is normally published. */
    publicationLagDays: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
    verification: Verification,
    citation: Citation,
}).check(Schema.makeFilter((series) => (series.base === series.quote ? 'base and quote must differ' : undefined)));
/**
 * Whether the publisher is expected to publish on `date`. `undefined` when the
 * date lies beyond the calendar's maintained range (unknown is not "closed").
 *
 * @since 0.1.0
 * @category predicates
 */
export const isPublicationDay = (calendar, date) => {
    if (calendar.closedWeekdays.includes(weekdayOf(date)))
        return false;
    if (calendar.closures.includes(date))
        return false;
    if (calendar.maintainedThrough !== undefined && date > calendar.maintainedThrough)
        return undefined;
    return true;
};
//# sourceMappingURL=FxSeries.js.map