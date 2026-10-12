import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';
/**
 * CLDR weekday identifiers.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Weekday: Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>;
/** @since 0.1.0 @category models */
export type Weekday = typeof Weekday.Type;
/**
 * Weekdays in `Date#getUTCDay` order.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const WEEKDAYS: ReadonlyArray<Weekday>;
/**
 * The weekday of an ISO date.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const weekdayOf: (date: string) => Weekday;
/**
 * The ISO date `days` after `date`.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const addDays: (date: string, days: number) => IsoDate;
/**
 * Holiday kinds: `restricted` holidays are elective and count only when a person takes them.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HolidayKind: Schema.Literals<readonly ["public", "bank", "restricted", "company"]>;
/** @since 0.1.0 @category schemas */
export declare const HolidayEntry: Schema.Struct<{
    readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly name: Schema.NonEmptyString;
    readonly kind: Schema.Literals<readonly ["public", "bank", "restricted", "company"]>;
    readonly status: Schema.Literals<readonly ["provisional", "confirmed"]>;
}>;
/** @since 0.1.0 @category models */
export type HolidayEntry = typeof HolidayEntry.Type;
/**
 * A versioned holiday data pack for one jurisdiction. Public packs stay `needs-verification`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HolidayPack: Schema.Struct<{
    readonly jurisdiction: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly edition: Schema.NonEmptyString;
    readonly status: Schema.Literals<readonly ["needs-verification", "adopter-verified"]>;
    readonly citations: Schema.optional<Schema.$Array<Schema.NonEmptyString>>;
    readonly entries: Schema.$Array<Schema.Struct<{
        readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly name: Schema.NonEmptyString;
        readonly kind: Schema.Literals<readonly ["public", "bank", "restricted", "company"]>;
        readonly status: Schema.Literals<readonly ["provisional", "confirmed"]>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type HolidayPack = typeof HolidayPack.Type;
/**
 * A work calendar: jurisdiction, weekend days, standard day length and holiday packs.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkCalendar: Schema.Struct<{
    readonly jurisdiction: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly weekendDays: Schema.$Array<Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>>;
    readonly standardDayMinutes: Schema.Number;
    readonly holidayPacks: Schema.$Array<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type WorkCalendar = typeof WorkCalendar.Type;
/**
 * Leave from a leave feed (port supplied by the adopter's HR system). Only `approved` leave
 * reduces availability; `minutesPerDay` marks partial days.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Leave: Schema.Struct<{
    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly engagementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/EngagementId">>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly status: Schema.Literals<readonly ["requested", "approved", "cancelled"]>;
    readonly minutesPerDay: Schema.optional<Schema.Number>;
}>;
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
export declare const dayKind: (options: {
    readonly calendar: WorkCalendar;
    readonly packs: ReadonlyArray<HolidayPack>;
    readonly date: string;
}) => DayKind;
//# sourceMappingURL=WorkCalendar.d.ts.map