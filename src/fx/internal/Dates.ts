/**
 * Calendar arithmetic on ISO dates (UTC, proleptic Gregorian). Internal.
 *
 * @since 0.1.0
 * @module
 */
import type { IsoDate, Period } from '../../core/Temporal.ts';

const DAY_MS = 86_400_000;

/** Weekday names, Monday first. @since 0.1.0 @category constants */
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** @since 0.1.0 @category models */
export type WeekdayName = (typeof WEEKDAYS)[number];

const toMillis = (date: string): number => Date.parse(`${date}T00:00:00Z`);

const fromMillis = (millis: number): IsoDate =>
  // SAFETY: Date#toISOString on a finite UTC midnight renders a valid calendar date YYYY-MM-DD in its first 10 characters.
  new Date(millis).toISOString().slice(0, 10) as IsoDate;

/** @since 0.1.0 @category math */
export const addDays = (date: IsoDate, days: number): IsoDate => fromMillis(toMillis(date) + days * DAY_MS);

/** Whole days from `from` to `to` (negative when `to` is earlier). @since 0.1.0 @category math */
export const daysBetween = (from: IsoDate, to: IsoDate): number => Math.round((toMillis(to) - toMillis(from)) / DAY_MS);

/** @since 0.1.0 @category accessors */
export const weekdayOf = (date: IsoDate): WeekdayName => WEEKDAYS[(new Date(toMillis(date)).getUTCDay() + 6) % 7] ?? 'mon';

/** @since 0.1.0 @category accessors */
export const firstDayOf = (period: Period): IsoDate => fromMillis(toMillis(`${period}-01`));

/** @since 0.1.0 @category accessors */
export const lastDayOf = (period: Period): IsoDate => {
  const first = new Date(toMillis(`${period}-01`));
  return fromMillis(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1) - DAY_MS);
};

/** The first date on or after `date` that falls on `weekday`. @since 0.1.0 @category math */
export const onOrAfter = (date: IsoDate, weekday: WeekdayName): IsoDate => {
  const offset = (WEEKDAYS.indexOf(weekday) - WEEKDAYS.indexOf(weekdayOf(date)) + 7) % 7;
  return addDays(date, offset);
};
