/**
 * Capacity terms carried on an agreement.
 *
 * - **`HoldRight`**: who (`holder`) may reserve whose (`provider`) capacity,
 *   for which roles, up to how many outstanding minutes, with what minimum
 *   lead time, for how many business days before a hold lapses, and how far
 *   ahead of the window an unneeded hold must be released.
 * - **`LeadTimeClass`**: a price class keyed by lead time (days from booking
 *   to the start of service), e.g. near-term unused capacity at a discount
 *   versus pre-planned capacity at standard. Classes are half-open day ranges
 *   that never overlap; a charge or hold claims a class and validation checks
 *   the claim against its booking date.
 *
 * Business days default to Monday–Friday; adopters with other weekends or
 * holiday calendars pass a predicate (e.g. built from `entity/WorkCalendar`).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * A right to reserve another party's capacity.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HoldRight: Schema.Struct<{
    readonly key: Schema.String;
    readonly holder: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly provider: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    /** Roles the right covers; omitted covers every role. */
    readonly roleKeys: Schema.optional<Schema.NonEmptyArray<Schema.String>>;
    /** Maximum minutes the holder may have outstanding (held) under this right at once. */
    readonly maxOutstandingMinutes: Schema.Number;
    /** Minimum calendar days between booking and the start of the held window. */
    readonly minLeadDays: Schema.Number;
    /** Business days from booking after which an unconverted hold lapses (default and maximum). */
    readonly expiryBusinessDays: Schema.Number;
    /** Release obligation: business days before the window starts by which an unneeded hold is released. */
    readonly releaseNoticeBusinessDays: Schema.Number;
    /**
     * The business-day calendar the parties named for expiry and release
     * deadlines; omitted means the provider's own work calendar.
     */
    readonly calendarRef: Schema.optional<Schema.String>;
    /**
     * Holds an agent or system places must be smaller than this many minutes;
     * a larger hold needs a human acting for the holder. Omitted leaves
     * non-human holds bounded only by the ceiling.
     */
    readonly agentHoldBelowMinutes: Schema.optional<Schema.Number>;
}>;
/** @since 0.1.0 @category models */
export type HoldRight = typeof HoldRight.Type;
/**
 * A lead-time price class: lead days in `[minLeadDays, maxLeadDays)` and the
 * discount from the standard price in basis points (0 is standard).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LeadTimeClass: Schema.Struct<{
    readonly key: Schema.String;
    readonly minLeadDays: Schema.Number;
    readonly maxLeadDays: Schema.optional<Schema.Number>;
    readonly discountBps: Schema.Number;
}>;
/** @since 0.1.0 @category models */
export type LeadTimeClass = typeof LeadTimeClass.Type;
/**
 * Calendar days from `bookedOn` to `serviceStart` (negative when booked after the start).
 *
 * @since 0.1.0
 * @category math
 */
export declare const leadDays: (bookedOn: string, serviceStart: string) => number;
/**
 * The class whose range contains `days`, if any.
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const classFor: (classes: ReadonlyArray<LeadTimeClass>, days: number) => LeadTimeClass | undefined;
/**
 * Whether a lead-time class list is well formed: unique keys, non-empty ranges, no overlaps.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const leadTimeClassProblem: (classes: ReadonlyArray<LeadTimeClass>) => string | undefined;
/**
 * Whether a civil date is a business day.
 *
 * @since 0.1.0
 * @category models
 */
export type BusinessDay = (date: string) => boolean;
/**
 * Monday to Friday.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const mondayToFriday: BusinessDay;
/**
 * The `count`-th business day after `date` (`count` ≥ 0; 0 returns `date`).
 *
 * @since 0.1.0
 * @category math
 */
export declare const addBusinessDays: (date: string, count: number, isBusinessDay?: BusinessDay) => string;
/**
 * The `count`-th business day before `date` (`count` ≥ 0; 0 returns `date`).
 *
 * @since 0.1.0
 * @category math
 */
export declare const subtractBusinessDays: (date: string, count: number, isBusinessDay?: BusinessDay) => string;
//# sourceMappingURL=CapacityTerms.d.ts.map