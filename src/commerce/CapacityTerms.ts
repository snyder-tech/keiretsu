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

import { addDays } from '../work/TimeZone.ts';

import { OpenCode, ShareBps } from './Code.ts';
import { PartyRef } from './Party.ts';

const DayCount = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 3_660 }));

/**
 * A right to reserve another party's capacity.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HoldRight = Schema.Struct({
  key: OpenCode,
  holder: PartyRef,
  provider: PartyRef,
  /** Roles the right covers; omitted covers every role. */
  roleKeys: Schema.optional(Schema.NonEmptyArray(OpenCode)),
  /** Maximum minutes the holder may have outstanding (held) under this right at once. */
  maxOutstandingMinutes: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  /** Minimum calendar days between booking and the start of the held window. */
  minLeadDays: DayCount,
  /** Business days from booking after which an unconverted hold lapses (default and maximum). */
  expiryBusinessDays: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 60 })),
  /** Release obligation: business days before the window starts by which an unneeded hold is released. */
  releaseNoticeBusinessDays: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 60 })),
  /**
   * The business-day calendar the parties named for expiry and release
   * deadlines; omitted means the provider's own work calendar.
   */
  calendarRef: Schema.optional(OpenCode),
  /**
   * Holds an agent or system places must be smaller than this many minutes;
   * a larger hold needs a human acting for the holder. Omitted leaves
   * non-human holds bounded only by the ceiling.
   */
  agentHoldBelowMinutes: Schema.optional(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1))),
});
/** @since 0.1.0 @category models */
export type HoldRight = typeof HoldRight.Type;

/**
 * A lead-time price class: lead days in `[minLeadDays, maxLeadDays)` and the
 * discount from the standard price in basis points (0 is standard).
 *
 * @since 0.1.0
 * @category schemas
 */
export const LeadTimeClass = Schema.Struct({
  key: OpenCode,
  minLeadDays: DayCount,
  maxLeadDays: Schema.optional(DayCount),
  discountBps: ShareBps,
});
/** @since 0.1.0 @category models */
export type LeadTimeClass = typeof LeadTimeClass.Type;

/**
 * Calendar days from `bookedOn` to `serviceStart` (negative when booked after the start).
 *
 * @since 0.1.0
 * @category math
 */
export const leadDays = (bookedOn: string, serviceStart: string): number => Math.round((Date.parse(`${serviceStart}T00:00:00Z`) - Date.parse(`${bookedOn}T00:00:00Z`)) / 86_400_000);

/**
 * The class whose range contains `days`, if any.
 *
 * @since 0.1.0
 * @category lookups
 */
export const classFor = (classes: ReadonlyArray<LeadTimeClass>, days: number): LeadTimeClass | undefined =>
  classes.find((entry) => days >= entry.minLeadDays && (entry.maxLeadDays === undefined || days < entry.maxLeadDays));

/**
 * Whether a lead-time class list is well formed: unique keys, non-empty ranges, no overlaps.
 *
 * @since 0.1.0
 * @category predicates
 */
export const leadTimeClassProblem = (classes: ReadonlyArray<LeadTimeClass>): string | undefined => {
  if (new Set(classes.map((entry) => entry.key)).size !== classes.length) return 'lead-time class keys are unique';
  if (classes.some((entry) => entry.maxLeadDays !== undefined && entry.maxLeadDays <= entry.minLeadDays)) return 'each lead-time range is non-empty';
  const sorted = [...classes].sort((left, right) => left.minLeadDays - right.minLeadDays);
  const overlap = sorted.slice(1).some((entry, index) => {
    const previous = sorted[index];
    return previous !== undefined && (previous.maxLeadDays === undefined || entry.minLeadDays < previous.maxLeadDays);
  });
  return overlap ? 'lead-time ranges do not overlap' : undefined;
};

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
export const mondayToFriday: BusinessDay = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
};

/**
 * The `count`-th business day after `date` (`count` ≥ 0; 0 returns `date`).
 *
 * @since 0.1.0
 * @category math
 */
export const addBusinessDays = (date: string, count: number, isBusinessDay: BusinessDay = mondayToFriday): string => {
  let current: string = date;
  let remaining = count;
  while (remaining > 0) {
    current = addDays(current, 1);
    if (isBusinessDay(current)) remaining -= 1;
  }
  return current;
};

/**
 * The `count`-th business day before `date` (`count` ≥ 0; 0 returns `date`).
 *
 * @since 0.1.0
 * @category math
 */
export const subtractBusinessDays = (date: string, count: number, isBusinessDay: BusinessDay = mondayToFriday): string => {
  let current: string = date;
  let remaining = count;
  while (remaining > 0) {
    current = addDays(current, -1);
    if (isBusinessDay(current)) remaining -= 1;
  }
  return current;
};
