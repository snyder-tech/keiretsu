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
export declare const ISO_DATE_PATTERN: RegExp;
/**
 * ISO 8601 calendar date `YYYY-MM-DD` that exists on the proleptic Gregorian calendar.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IsoDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
/** @since 0.1.0 @category models */
export type IsoDate = typeof IsoDate.Type;
/**
 * RFC 3339 UTC instant with `Z` offset.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Instant: Schema.brand<Schema.String, "keiretsu/Instant">;
/** @since 0.1.0 @category models */
export type Instant = typeof Instant.Type;
/**
 * Accounting month `YYYY-MM`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Period: Schema.brand<Schema.String, "keiretsu/Period">;
/** @since 0.1.0 @category models */
export type Period = typeof Period.Type;
/**
 * Half-open validity interval `[validFrom, validTo)`. Omitted `validTo` is open-ended.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Interval: Schema.Struct<{
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type Interval = typeof Interval.Type;
/**
 * Whether `date` falls inside a half-open interval.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const contains: (interval: {
    readonly validFrom: string;
    readonly validTo?: string | undefined;
}, date: string) => boolean;
/**
 * Whether two half-open intervals share at least one day.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const overlaps: (left: {
    readonly validFrom: string;
    readonly validTo?: string | undefined;
}, right: {
    readonly validFrom: string;
    readonly validTo?: string | undefined;
}) => boolean;
/**
 * Bitemporal stamp: when the fact is true (valid time) and when this system
 * learned it (recorded time). Restatements change recorded time, never history.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Bitemporal: Schema.Struct<{
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type Bitemporal = typeof Bitemporal.Type;
/**
 * The accounting period containing a date.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const periodOf: (date: IsoDate) => Period;
//# sourceMappingURL=Temporal.d.ts.map