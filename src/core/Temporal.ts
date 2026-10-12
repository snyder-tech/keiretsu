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
export const ISO_DATE_PATTERN: RegExp = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const isCalendarDate = (value: string): boolean => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/**
 * ISO 8601 calendar date `YYYY-MM-DD` that exists on the proleptic Gregorian calendar.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IsoDate = Schema.String.check(
  Schema.isPattern(ISO_DATE_PATTERN),
  Schema.makeFilter((value: string) => (isCalendarDate(value) ? undefined : `${value} is not a calendar date`)),
).pipe(Schema.brand('keiretsu/IsoDate'));
/** @since 0.1.0 @category models */
export type IsoDate = typeof IsoDate.Type;

/**
 * RFC 3339 UTC instant with `Z` offset.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Instant = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/)).pipe(Schema.brand('keiretsu/Instant'));
/** @since 0.1.0 @category models */
export type Instant = typeof Instant.Type;

/**
 * Accounting month `YYYY-MM`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Period = Schema.String.check(Schema.isPattern(/^\d{4}-(0[1-9]|1[0-2])$/)).pipe(Schema.brand('keiretsu/Period'));
/** @since 0.1.0 @category models */
export type Period = typeof Period.Type;

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
/** @since 0.1.0 @category models */
export type Interval = typeof Interval.Type;

/**
 * Whether `date` falls inside a half-open interval.
 *
 * @since 0.1.0
 * @category predicates
 */
export const contains = (interval: { readonly validFrom: string; readonly validTo?: string | undefined }, date: string): boolean =>
  date >= interval.validFrom && (interval.validTo === undefined || date < interval.validTo);

/**
 * Whether two half-open intervals share at least one day.
 *
 * @since 0.1.0
 * @category predicates
 */
export const overlaps = (
  left: { readonly validFrom: string; readonly validTo?: string | undefined },
  right: { readonly validFrom: string; readonly validTo?: string | undefined },
): boolean => (left.validTo === undefined || right.validFrom < left.validTo) && (right.validTo === undefined || left.validFrom < right.validTo);

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
/** @since 0.1.0 @category models */
export type Bitemporal = typeof Bitemporal.Type;

/**
 * The accounting period containing a date.
 *
 * @since 0.1.0
 * @category constructors
 */
export const periodOf = (date: IsoDate): Period => Schema.decodeSync(Period)(date.slice(0, 7));
