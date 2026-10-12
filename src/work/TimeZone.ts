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

const ZONE_PATTERN = /^(?:UTC|[A-Z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)+)$/;

const isKnownZone = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

/**
 * An IANA time zone name the runtime recognises, such as `Asia/Kolkata` or `America/New_York`.
 * Offsets (`+05:30`) and abbreviations (`IST`) are rejected: they do not carry daylight rules.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IanaTimeZone = Schema.String.check(
  Schema.isPattern(ZONE_PATTERN),
  Schema.makeFilter((zone: string) => (isKnownZone(zone) ? undefined : `${zone} is not a known IANA time zone`)),
).pipe(Schema.brand('keiretsu/IanaTimeZone'));
/** @since 0.1.0 @category models */
export type IanaTimeZone = typeof IanaTimeZone.Type;

const part = (parts: ReadonlyArray<Intl.DateTimeFormatPart>, type: Intl.DateTimeFormatPartTypes): string => parts.find((entry) => entry.type === type)?.value ?? '';

/**
 * The civil date of an RFC 3339 UTC instant in a time zone.
 *
 * @since 0.1.0
 * @category conversions
 */
export const civilDate = (instant: string, timeZone: IanaTimeZone): IsoDate => {
  const millis = Date.parse(instant.replace(/(\.\d{3})\d+Z$/, '$1Z'));
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(millis));
  return Schema.decodeSync(IsoDate)(`${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`);
};

/**
 * Weekday names, Monday first (ISO 8601 order).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Weekday = Schema.Literals(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
/** @since 0.1.0 @category models */
export type Weekday = typeof Weekday.Type;

const WEEKDAYS: ReadonlyArray<Weekday> = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * The weekday of a calendar date.
 *
 * @since 0.1.0
 * @category accessors
 */
export const weekdayOf = (date: string): Weekday => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? 'monday';

/**
 * The calendar date `days` after `date` (negative moves back).
 *
 * @since 0.1.0
 * @category math
 */
export const addDays = (date: string, days: number): IsoDate => {
  const moved = new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000);
  return Schema.decodeSync(IsoDate)(moved.toISOString().slice(0, 10));
};
