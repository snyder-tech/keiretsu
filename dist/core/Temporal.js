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
/** UTC instant spelling with bounded time and fraction fields. @since 0.44.12 @category patterns */
export const INSTANT_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?Z$/;
/**
 * RFC 3339 UTC instant with `Z` offset.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Instant = Schema.String.check(Schema.isPattern(INSTANT_PATTERN), Schema.makeFilter((value) => (isCalendarDate(value.slice(0, 10)) ? undefined : 'instant must name a Gregorian calendar date'))).pipe(Schema.brand('keiretsu/Instant'));
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
}).check(Schema.makeFilter((stamp) => (stamp.validTo === undefined || stamp.validFrom < stamp.validTo ? undefined : 'validTo must follow validFrom')));
/**
 * The accounting period containing a date.
 *
 * @since 0.1.0
 * @category constructors
 */
export const periodOf = (date) => Schema.decodeSync(Period)(date.slice(0, 7));
/**
 * Nanoseconds since the Unix epoch. UTC seconds are 00–59; leap-second text
 * is rejected. Received fraction spelling is preserved by the Instant codec.
 * Throws a schema error on invalid text, including impossible calendar dates.
 * @since 0.44.12 @category conversions
 */
export const toEpochNanoseconds = (value) => {
    const instant = Schema.decodeSync(Instant)(value);
    const seconds = BigInt(Date.parse(`${instant.slice(0, 19)}Z`)) / 1000n;
    const fraction = instant.slice(19, -1);
    return seconds * 1000000000n + BigInt(fraction === '' ? '0' : fraction.slice(1).padEnd(9, '0'));
};
/** Compare instants by time, independent of fractional spelling. @since 0.44.12 @category ordering */
export const compareInstants = (left, right) => {
    const a = toEpochNanoseconds(left);
    const b = toEpochNanoseconds(right);
    return a < b ? -1 : a > b ? 1 : 0;
};
//# sourceMappingURL=Temporal.js.map