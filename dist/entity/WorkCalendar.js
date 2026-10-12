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
import { EngagementId, PersonId } from "../core/Ids.js";
import { Situs } from "../core/Country.js";
import { validInterval } from "../core/Envelope.js";
import { IsoDate } from "../core/Temporal.js";
import { Schema } from 'effect';
/**
 * CLDR weekday identifiers.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Weekday = Schema.Literals(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
/**
 * Weekdays in `Date#getUTCDay` order.
 *
 * @since 0.1.0
 * @category constants
 */
export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/**
 * The weekday of an ISO date.
 *
 * @since 0.1.0
 * @category accessors
 */
export const weekdayOf = (date) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? 'sun';
/**
 * The ISO date `days` after `date`.
 *
 * @since 0.1.0
 * @category constructors
 */
export const addDays = (date, days) => {
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
/**
 * Classify `date` under a calendar and its resolved packs. Confirmed holidays win over provisional ones.
 *
 * @since 0.1.0
 * @category accessors
 */
export const dayKind = (options) => {
    if (options.calendar.weekendDays.includes(weekdayOf(options.date)))
        return 'weekend';
    const entries = options.packs.flatMap((pack) => pack.entries.filter((entry) => entry.date === options.date));
    const fixed = entries.filter((entry) => entry.kind !== 'restricted');
    if (fixed.some((entry) => entry.status === 'confirmed'))
        return 'holiday';
    if (fixed.length > 0)
        return 'provisional-holiday';
    return entries.length > 0 ? 'restricted-holiday' : 'working';
};
//# sourceMappingURL=WorkCalendar.js.map