/**
 * Dates, instants, accounting periods, half-open intervals and bitemporal stamps.
 *
 * Intervals are half-open `[from, to)`: `to` is the first day *not* covered, so
 * consecutive intervals share a boundary without overlapping.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category patterns */
export const ISO_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const isCalendarDate = (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
/**
 * ISO 8601 calendar date `YYYY-MM-DD` that exists on the proleptic Gregorian calendar.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IsoDate = Schema.String.check(Schema.isPattern(ISO_DATE_PATTERN), Schema.makeFilter((value) => (isCalendarDate(value) ? undefined : `${value} is not a calendar date`))).pipe(Schema.brand('keiretsu/IsoDate'));
/**
 * RFC 3339 UTC instant with `Z` offset.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Instant = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/)).pipe(Schema.brand('keiretsu/Instant'));
/**
 * Accounting month `YYYY-MM`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Period = Schema.String.check(Schema.isPattern(/^\d{4}-(0[1-9]|1[0-2])$/)).pipe(Schema.brand('keiretsu/Period'));
/**
 * Half-open validity interval `[validFrom, validTo)`. Omitted `validTo` is open-ended.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Interval = Schema.Struct({
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
}).check(Schema.makeFilter((interval) => (interval.validTo === undefined || interval.validFrom < interval.validTo ? undefined : 'validTo must follow validFrom')));
/**
 * Whether `date` falls inside a half-open interval.
 *
 * @since 0.1.0
 * @category predicates
 */
export const contains = (interval, date) => date >= interval.validFrom && (interval.validTo === undefined || date < interval.validTo);
/**
 * Whether two half-open intervals share at least one day.
 *
 * @since 0.1.0
 * @category predicates
 */
export const overlaps = (left, right) => (left.validTo === undefined || right.validFrom < left.validTo) && (right.validTo === undefined || left.validFrom < right.validTo);
/**
 * Bitemporal stamp: when the fact is true (valid time) and when this system
 * learned it (recorded time). Restatements change recorded time, never history.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Bitemporal = Schema.Struct({
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    recordedAt: Instant,
});
/**
 * The accounting period containing a date.
 *
 * @since 0.1.0
 * @category constructors
 */
export const periodOf = (date) => Schema.decodeSync(Period)(date.slice(0, 7));
//# sourceMappingURL=Temporal.js.map