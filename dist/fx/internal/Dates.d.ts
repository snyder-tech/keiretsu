/**
 * Calendar arithmetic on ISO dates (UTC, proleptic Gregorian). Internal.
 *
 * @since 0.1.0
 * @module
 */
import type { IsoDate, Period } from '../../core/Temporal.ts';
/** Weekday names, Monday first. @since 0.1.0 @category constants */
export declare const WEEKDAYS: readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
/** @since 0.1.0 @category models */
export type WeekdayName = (typeof WEEKDAYS)[number];
/** @since 0.1.0 @category math */
export declare const addDays: (date: IsoDate, days: number) => IsoDate;
/** Whole days from `from` to `to` (negative when `to` is earlier). @since 0.1.0 @category math */
export declare const daysBetween: (from: IsoDate, to: IsoDate) => number;
/** @since 0.1.0 @category accessors */
export declare const weekdayOf: (date: IsoDate) => WeekdayName;
/** @since 0.1.0 @category accessors */
export declare const firstDayOf: (period: Period) => IsoDate;
/** @since 0.1.0 @category accessors */
export declare const lastDayOf: (period: Period) => IsoDate;
/** The first date on or after `date` that falls on `weekday`. @since 0.1.0 @category math */
export declare const onOrAfter: (date: IsoDate, weekday: WeekdayName) => IsoDate;
//# sourceMappingURL=Dates.d.ts.map