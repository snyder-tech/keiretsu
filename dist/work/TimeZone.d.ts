/**
 * IANA time zones and civil dates.
 *
 * A work date is the civil date in the performer's IANA zone at the start of
 * work, never the UTC date. Periods derive from the work date.
 *
 * @since 0.1.0
 * @module
 */
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';
/**
 * An IANA time zone name the runtime recognises, such as `Asia/Kolkata` or `America/New_York`.
 * Offsets (`+05:30`) and abbreviations (`IST`) are rejected: they do not carry daylight rules.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IanaTimeZone: Schema.brand<Schema.String, "keiretsu/IanaTimeZone">;
/** @since 0.1.0 @category models */
export type IanaTimeZone = typeof IanaTimeZone.Type;
/**
 * The civil date of an RFC 3339 UTC instant in a time zone.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const civilDate: (instant: string, timeZone: IanaTimeZone) => IsoDate;
/**
 * Weekday names, Monday first (ISO 8601 order).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Weekday: Schema.Literals<readonly ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>;
/** @since 0.1.0 @category models */
export type Weekday = typeof Weekday.Type;
/**
 * The weekday of a calendar date.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const weekdayOf: (date: string) => Weekday;
/**
 * The calendar date `days` after `date` (negative moves back).
 *
 * @since 0.1.0
 * @category math
 */
export declare const addDays: (date: string, days: number) => IsoDate;
//# sourceMappingURL=TimeZone.d.ts.map