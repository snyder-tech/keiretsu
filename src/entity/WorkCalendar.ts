/**
 * Work calendars: workweeks, holiday packs and leave.
 *
 * Weekend days are data per calendar (CLDR `weekData` style), never a
 * hard-coded Monday–Friday. Holiday packs are versioned data with
 * `provisional` entries (e.g. moon-sighted dates) and `restricted` entries
 * (elective holidays a person may choose). Leave arrives through a port and is
 * seen by partners only as unavailability.
 *
 * @since 0.1.0
 * @module
 */
import { EngagementId, PersonId } from '../core/Ids.ts';
import { Situs } from '../core/Country.ts';
import { validInterval } from '../core/Envelope.ts';
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

/**
 * CLDR weekday identifiers.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Weekday = Schema.Literals(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
/** @since 0.1.0 @category models */
export type Weekday = typeof Weekday.Type;

/**
 * Weekdays in `Date#getUTCDay` order.
 *
 * @since 0.1.0
 * @category constants
 */
export const WEEKDAYS: ReadonlyArray<Weekday> = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * The weekday of an ISO date.
 *
 * @since 0.1.0
 * @category accessors
 */
export const weekdayOf = (date: string): Weekday => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? 'sun';

/**
 * The ISO date `days` after `date`.
 *
 * @since 0.1.0
 * @category constructors
 */
export const addDays = (date: string, days: number): IsoDate => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return Schema.decodeSync(IsoDate)(next.toISOString().slice(0, 10));
};

/**
 * Holiday kinds: `restricted` holidays are elective and count only when a person takes them.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HolidayKind = Schema.Literals(['public', 'bank', 'restricted', 'company']);

/** @since 0.1.0 @category schemas */
export const HolidayEntry = Schema.Struct({
  date: IsoDate,
  name: Schema.NonEmptyString,
  kind: HolidayKind,
  status: Schema.Literals(['provisional', 'confirmed']),
});
/** @since 0.1.0 @category models */
export type HolidayEntry = typeof HolidayEntry.Type;

/**
 * A versioned holiday data pack for one jurisdiction. Public packs stay `needs-verification`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HolidayPack = Schema.Struct({
  jurisdiction: Situs,
  edition: Schema.NonEmptyString,
  status: Schema.Literals(['needs-verification', 'adopter-verified']),
  citations: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  entries: Schema.Array(HolidayEntry),
});
/** @since 0.1.0 @category models */
export type HolidayPack = typeof HolidayPack.Type;

/**
 * A work calendar: jurisdiction, weekend days, standard day length and holiday packs.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkCalendar = Schema.Struct({
  jurisdiction: Situs,
  weekendDays: Schema.Array(Weekday),
  standardDayMinutes: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 1440 })),
  holidayPacks: Schema.Array(Schema.NonEmptyString),
});
/** @since 0.1.0 @category models */
export type WorkCalendar = typeof WorkCalendar.Type;

/**
 * Leave from a leave feed (port supplied by the adopter's HR system). Only `approved` leave
 * reduces availability; `minutesPerDay` marks partial days.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Leave = Schema.Struct({
  personId: PersonId,
  engagementId: Schema.optional(EngagementId),
  validFrom: IsoDate,
  validTo: IsoDate,
  status: Schema.Literals(['requested', 'approved', 'cancelled']),
  minutesPerDay: Schema.optional(Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 1440 }))),
}).check(validInterval);
/** @since 0.1.0 @category models */
export type Leave = typeof Leave.Type;

/**
 * How a calendar treats one date.
 *
 * @since 0.1.0
 * @category models
 */
export type DayKind = 'weekend' | 'holiday' | 'provisional-holiday' | 'restricted-holiday' | 'working';

/**
 * Classify `date` under a calendar and its resolved packs. Confirmed holidays win over provisional ones.
 *
 * @since 0.1.0
 * @category accessors
 */
export const dayKind = (options: { readonly calendar: WorkCalendar; readonly packs: ReadonlyArray<HolidayPack>; readonly date: string }): DayKind => {
  if (options.calendar.weekendDays.includes(weekdayOf(options.date))) return 'weekend';
  const entries = options.packs.flatMap((pack) => pack.entries.filter((entry) => entry.date === options.date));
  const fixed = entries.filter((entry) => entry.kind !== 'restricted');
  if (fixed.some((entry) => entry.status === 'confirmed')) return 'holiday';
  if (fixed.length > 0) return 'provisional-holiday';
  return entries.length > 0 ? 'restricted-holiday' : 'working';
};
