/**
 * Availability: `workweek × FTE − holidays − approved leave`, per person and interval.
 *
 * Each engagement uses its own work calendar, or its employer's. Minutes are
 * accumulated exactly in FTE basis points and rounded once (half-even). A
 * missing calendar makes the result incomplete with a `hold` issue instead of
 * counting zero; provisional holidays count as unavailable and are listed so
 * a planner can confirm them.
 *
 * @since 0.1.0
 * @module
 */
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { divide } from '../core/Rounding.ts';
import { contains, overlaps, type IsoDate } from '../core/Temporal.ts';

import type { Engagement } from './Engagement.ts';
import type { KeiretsuModel, Keyed } from './Model.ts';
import { addDays, dayKind, type HolidayPack, type Leave, type WorkCalendar } from './WorkCalendar.ts';

const BPS = 10_000n;
const DAY_CAP = 1440n * BPS;

/**
 * Availability over an interval.
 *
 * @since 0.1.0
 * @category models
 */
export interface AvailabilityResult {
  /** Available minutes, rounded once (half-even). */
  readonly minutes: number;
  /** False when an engagement had no work calendar; `minutes` then understates availability. */
  readonly complete: boolean;
  /** Dates of provisional holidays counted as unavailable. */
  readonly provisionalDates: ReadonlyArray<IsoDate>;
  readonly issues: ReadonlyArray<ValidationIssue>;
}

/**
 * Options for {@link availableMinutes}. `from`/`to` are a half-open date interval.
 *
 * @since 0.1.0
 * @category models
 */
export interface AvailabilityOptions {
  readonly model: KeiretsuModel;
  readonly person: string;
  readonly from: IsoDate;
  readonly to: IsoDate;
  readonly leave?: ReadonlyArray<Leave> | undefined;
}

interface Resolved {
  readonly engagement: Engagement;
  readonly calendar: Keyed<WorkCalendar>;
  readonly packs: ReadonlyArray<HolidayPack>;
}

const resolve = (model: KeiretsuModel, engagement: Engagement): Resolved | undefined => {
  const key = engagement.workCalendar ?? model.entities.find((entity) => entity.key === engagement.employer)?.workCalendar;
  const calendar = model.workCalendars.find((candidate) => candidate.key === key);
  if (calendar === undefined) return undefined;
  return { engagement, calendar, packs: model.holidayPacks.filter((pack) => calendar.holidayPacks.includes(pack.key)) };
};

const leaveOn = (leave: ReadonlyArray<Leave>, date: string, engagementId: string | undefined): ReadonlyArray<Leave> =>
  leave.filter((entry) => entry.status === 'approved' && contains(entry, date) && entry.engagementId === engagementId);

/** Remaining scaled minutes after leave: a full-day leave zeroes, partial leave subtracts. */
const afterLeave = (scaled: bigint, leave: ReadonlyArray<Leave>): bigint => {
  if (leave.some((entry) => entry.minutesPerDay === undefined)) return 0n;
  const taken = leave.reduce((total, entry) => total + BigInt(entry.minutesPerDay ?? 0) * BPS, 0n);
  return scaled > taken ? scaled - taken : 0n;
};

const engagementDay = (options: { readonly resolved: Resolved; readonly date: IsoDate; readonly leave: ReadonlyArray<Leave>; readonly provisional: Set<IsoDate> }): bigint => {
  const kind = dayKind({ calendar: options.resolved.calendar, packs: options.resolved.packs, date: options.date });
  if (kind === 'provisional-holiday') options.provisional.add(options.date);
  if (kind !== 'working' && kind !== 'restricted-holiday') return 0n;
  const scaled = BigInt(options.resolved.calendar.standardDayMinutes) * BigInt(options.resolved.engagement.fteBps);
  return afterLeave(scaled, leaveOn(options.leave, options.date, options.resolved.engagement.id));
};

/**
 * Available minutes for a declared person over `[from, to)`.
 *
 * @since 0.1.0
 * @category derivations
 */
export const availableMinutes = (options: AvailabilityOptions): AvailabilityResult => {
  const person = options.model.people.find((candidate) => candidate.key === options.person);
  if (person === undefined || options.to <= options.from) {
    const message = person === undefined ? `person ${options.person} is not declared` : 'interval must be non-empty';
    return { minutes: 0, complete: false, provisionalDates: [], issues: [issue('availability.input', 'error', options.person, message)] };
  }
  const engagements = options.model.engagements.filter((engagement) => engagement.person === options.person);
  const resolved = new Map(engagements.map((engagement) => [engagement.id, resolve(options.model, engagement)] as const));
  const leave = (options.leave ?? []).filter((entry) => entry.personId === person.id);
  const provisional = new Set<IsoDate>();
  let total = 0n;
  for (let date = options.from; date < options.to; date = addDays(date, 1)) {
    const day = engagements
      .filter((engagement) => contains(engagement, date))
      .reduce((sum, engagement) => {
        const entry = resolved.get(engagement.id);
        return entry === undefined ? sum : sum + engagementDay({ resolved: entry, date, leave, provisional });
      }, 0n);
    const capped = day > DAY_CAP ? DAY_CAP : day;
    total += afterLeave(capped, leaveOn(leave, date, undefined));
  }
  const window = { validFrom: options.from, validTo: options.to };
  const missing = engagements.filter((engagement) => resolved.get(engagement.id) === undefined && overlaps(engagement, window));
  return {
    minutes: Number(divide(total, BPS, 'half-even')),
    complete: missing.length === 0,
    provisionalDates: [...provisional].sort(),
    issues: missing.map((engagement) => issue('availability.calendar-missing', 'hold', `engagements.${engagement.id}`, 'no work calendar on the engagement or its employer')),
  };
};
