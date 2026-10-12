import { actsForEntity } from '../core/PartyRef.ts';
/**
 * The standard monthly close over a company's time ledger.
 *
 * Every adopter closes a month the same way: the period moves `open` →
 * `closing` → `locked` (a `closing` month may return to `open` with a reason),
 * readiness is computed from the month's time entries by one function, the
 * approval inbox lists submitted time with its anomalies, and the lock refuses
 * while any submitted time is undecided. What differs between companies is
 * data, not logic: people, holidays, entries and the chart of accounts (see
 * `finance/CloseProfile`). An adopter may add its own anomaly kinds through a
 * classifier; the standard kinds and checklist never change.
 *
 * Days are civil dates (`YYYY-MM-DD`, no zone); arithmetic runs in UTC so a
 * day never shifts with the viewer's zone. Nothing here reads the clock.
 *
 * @since 0.44.11
 * @module
 */
import { Schema } from 'effect';

import { EntityId, HumanActorSchema } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { IsoDate } from '../core/Temporal.ts';

// ---------------------------------------------------------------- lifecycle

/**
 * Period lifecycle. A month closes in two steps so stragglers can be chased
 * before the lock; a locked month is a fence and never reopens.
 *
 * @since 0.44.11
 * @category constants
 */
export const PERIOD_STATUS_TRANSITIONS = {
  open: ['closing'],
  closing: ['open', 'locked'],
  locked: [],
} as const;

/** @since 0.44.11 @category models */
export type PeriodStatus = keyof typeof PERIOD_STATUS_TRANSITIONS;

/** @since 0.44.11 @category constants */
export const PERIOD_STATUSES: ReadonlyArray<PeriodStatus> = ['open', 'closing', 'locked'];

/**
 * Whether a period may move from `from` to `to`.
 *
 * @since 0.44.11
 * @category guards
 */
export const canTransitionPeriod = (from: PeriodStatus, to: PeriodStatus): boolean => from !== to && (PERIOD_STATUS_TRANSITIONS[from] as ReadonlyArray<PeriodStatus>).includes(to);

/**
 * Time entry statuses. Only approved time is locked by a close; draft and
 * rejected time is left behind, and submitted time blocks the lock.
 *
 * @since 0.44.11
 * @category constants
 */
export const TIME_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'locked'] as const;

/** @since 0.44.11 @category models */
export type TimeStatus = (typeof TIME_STATUSES)[number];

// ---------------------------------------------------------------- calendar

/**
 * A close month, `YYYY-MM`.
 *
 * @since 0.44.11
 * @category schemas
 */
export const CloseMonth = Schema.String.check(Schema.isPattern(/^\d{4}-(0[1-9]|1[0-2])$/));

const DAY_MS = 86_400_000;

const toUtc = (day: string): number => {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1);
};

const fromUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** @since 0.44.11 @category calendar */
export const addDays = (day: string, count: number): string => fromUtc(toUtc(day) + count * DAY_MS);

/** 0 = Monday … 6 = Sunday. @since 0.44.11 @category calendar */
export const weekdayIndex = (day: string): number => (new Date(toUtc(day)).getUTCDay() + 6) % 7;

/** @since 0.44.11 @category calendar */
export const isWeekend = (day: string): boolean => weekdayIndex(day) >= 5;

/** Monday of the week containing `day`. @since 0.44.11 @category calendar */
export const weekStartOf = (day: string): string => addDays(day, -weekdayIndex(day));

/** First and last civil day of a month. @since 0.44.11 @category calendar */
export const monthBounds = (month: string): { readonly fromDay: string; readonly toDay: string } => {
  const [year, monthNumber] = month.split('-').map(Number);
  return { fromDay: `${month}-01`, toDay: fromUtc(Date.UTC(year ?? 1970, monthNumber ?? 1, 0)) };
};

/** Every day from `fromDay` to `toDay`, inclusive. @since 0.44.11 @category calendar */
export const daysBetween = (fromDay: string, toDay: string): ReadonlyArray<string> => {
  const count = Math.round((toUtc(toDay) - toUtc(fromDay)) / DAY_MS) + 1;
  return count <= 0 ? [] : Array.from({ length: count }, (_, index) => addDays(fromDay, index));
};

/** The Mondays of every week that touches the month. @since 0.44.11 @category calendar */
export const monthWeekStarts = (month: string): ReadonlyArray<string> => {
  const { fromDay, toDay } = monthBounds(month);
  const starts: Array<string> = [];
  for (let start = weekStartOf(fromDay); start <= toDay; start = addDays(start, 7)) starts.push(start);
  return starts;
};

/** Whether every day of the month is before `today`. @since 0.44.11 @category calendar */
export const isMonthEnded = (month: string, today: string): boolean => monthBounds(month).toDay < today;

/** Whether the month starts after the month containing `today`. @since 0.44.11 @category calendar */
export const isFutureMonth = (month: string, today: string): boolean => month > today.slice(0, 7);

// ---------------------------------------------------------------- inputs

/**
 * The fields of a time entry the close reads. Adopters pass their own entry
 * records; extra fields are carried through untouched.
 *
 * @since 0.44.11
 * @category models
 */
export interface CloseTimeEntry {
  readonly id: string;
  readonly personId: string;
  readonly day: string;
  readonly hours: number;
  readonly status: TimeStatus;
}

/**
 * A person in the close. `owesTime` is the adopter's directory decision (for
 * example: can sign in and has capacity); a person who owes no time is listed
 * only when they logged hours in the month.
 *
 * @since 0.44.11
 * @category models
 */
export interface ClosePerson {
  readonly id: string;
  readonly displayName: string;
  readonly owesTime: boolean;
}

/**
 * A company holiday: a day nobody owes time. A holiday with zero hours is a
 * working day.
 *
 * @since 0.44.11
 * @category models
 */
export interface CloseHoliday {
  readonly day: string;
  readonly hours: number;
}

// ---------------------------------------------------------------- integrity checks

/**
 * Anomalies every adopter flags on submitted time: a day over ten hours, and
 * hours on a weekend.
 *
 * @since 0.44.11
 * @category models
 */
export type StandardAnomalyKind = 'over-ten-hours' | 'weekend';

/** @since 0.44.11 @category models */
export interface EntryAnomaly<K extends string = StandardAnomalyKind> {
  readonly entryId: string;
  readonly kind: K;
}

/**
 * Adopter-defined anomaly kinds for one entry, appended after the standard
 * kinds (for example, project-budget checks that need the adopter's own data).
 *
 * @since 0.44.11
 * @category models
 */
export type AnomalyClassifier<E extends CloseTimeEntry, X extends string> = (entry: E) => ReadonlyArray<X>;

/** The standard anomalies of one entry. @since 0.44.11 @category checks */
export const standardAnomalies = (entry: CloseTimeEntry): ReadonlyArray<StandardAnomalyKind> => {
  const kinds: Array<StandardAnomalyKind> = [];
  if (entry.hours > 10) kinds.push('over-ten-hours');
  if (isWeekend(entry.day) && entry.hours > 0) kinds.push('weekend');
  return kinds;
};

const noExtra = (): ReadonlyArray<never> => [];

/** Standard then adopter anomalies of one entry, regardless of status. @since 0.44.11 @category checks */
export const anomaliesOf = <E extends CloseTimeEntry, X extends string = never>(entry: E, classify: AnomalyClassifier<E, X> = noExtra): ReadonlyArray<StandardAnomalyKind | X> => [
  ...standardAnomalies(entry),
  ...classify(entry),
];

/**
 * Anomalies on entries still waiting for a decision (status `submitted`).
 *
 * @since 0.44.11
 * @category checks
 */
export const findAnomalies = <E extends CloseTimeEntry, X extends string = never>(
  entries: ReadonlyArray<E>,
  classify: AnomalyClassifier<E, X> = noExtra,
): ReadonlyArray<EntryAnomaly<StandardAnomalyKind | X>> => entries.flatMap((entry) => (entry.status === 'submitted' ? anomaliesOf(entry, classify).map((kind) => ({ entryId: entry.id, kind })) : []));

/** The days off in a set of holidays: every holiday that carries hours. @since 0.44.11 @category calendar */
export const holidayDaysOf = (holidays: ReadonlyArray<CloseHoliday>): ReadonlySet<string> => new Set(holidays.flatMap((holiday) => (holiday.hours > 0 ? [holiday.day] : [])));

/** Weekdays of the month up to `asOfDay`, less company holidays. @since 0.44.11 @category calendar */
export const expectedWorkdays = (month: string, asOfDay: string, holidays: ReadonlyArray<CloseHoliday> = []): ReadonlyArray<string> => {
  const { fromDay, toDay } = monthBounds(month);
  const off = holidayDaysOf(holidays);
  return daysBetween(fromDay, asOfDay < toDay ? asOfDay : toDay).filter((day) => !isWeekend(day) && !off.has(day));
};

// ---------------------------------------------------------------- readiness

/** @since 0.44.11 @category models */
export interface PersonWeekCell {
  readonly weekStart: string;
  readonly submittedHours: number;
  readonly approvedHours: number;
  readonly draftHours: number;
  readonly missingDays: number;
}

/** @since 0.44.11 @category models */
export interface PersonCloseRow {
  readonly personId: string;
  readonly displayName: string;
  readonly owesTime: boolean;
  readonly expectedDays: number;
  readonly loggedDays: number;
  readonly weeks: ReadonlyArray<PersonWeekCell>;
  readonly straggler: boolean;
}

/**
 * The standard close checklist. Every adopter's checklist has exactly these
 * items, in this order.
 *
 * @since 0.44.11
 * @category constants
 */
export const STANDARD_CLOSE_CHECKS = ['all-days-logged', 'nothing-in-draft', 'nothing-awaiting-approval', 'no-open-anomalies'] as const;

/** @since 0.44.11 @category models */
export type CloseCheckId = (typeof STANDARD_CLOSE_CHECKS)[number];

/** @since 0.44.11 @category models */
export interface CloseChecklistItem {
  readonly id: CloseCheckId;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
}

/** @since 0.44.11 @category models */
export interface CloseReadiness<E extends CloseTimeEntry = CloseTimeEntry, K extends string = StandardAnomalyKind> {
  readonly month: string;
  readonly people: ReadonlyArray<PersonCloseRow>;
  readonly awaitingApproval: ReadonlyArray<E>;
  readonly anomalies: ReadonlyArray<EntryAnomaly<K>>;
  readonly checklist: ReadonlyArray<CloseChecklistItem>;
  /** Company holidays inside the month that are not owed. */
  readonly holidayDays: ReadonlyArray<string>;
  /** 0–100: logged days over expected days across everyone. */
  readonly readinessPct: number;
  readonly ready: boolean;
}

/** @since 0.44.11 @category models */
export interface ReadinessInput<E extends CloseTimeEntry, X extends string = never> {
  readonly month: string;
  /** The last day that counts as owed; days after it are not yet missing. */
  readonly asOfDay: string;
  readonly people: ReadonlyArray<ClosePerson>;
  /** The month's entries. */
  readonly entries: ReadonlyArray<E>;
  /** Absent means no holidays are known. */
  readonly holidays?: ReadonlyArray<CloseHoliday>;
  readonly classify?: AnomalyClassifier<E, X>;
}

const sum = (values: ReadonlyArray<number>): number => values.reduce((total, value) => total + value, 0);

const hoursWith = (entries: ReadonlyArray<CloseTimeEntry>, statuses: ReadonlyArray<TimeStatus>): number =>
  entries.reduce((total, entry) => (statuses.includes(entry.status) ? total + entry.hours : total), 0);

const loggedDaysOf = (entries: ReadonlyArray<CloseTimeEntry>): ReadonlySet<string> => new Set(entries.flatMap((entry) => (entry.hours > 0 ? [entry.day] : [])));

interface PersonScope {
  readonly owedDays: ReadonlyArray<string>;
  readonly weekStarts: ReadonlyArray<string>;
}

const weekCell = (weekStart: string, entries: ReadonlyArray<CloseTimeEntry>, owed: ReadonlyArray<string>, logged: ReadonlySet<string>): PersonWeekCell => {
  const inWeek = entries.filter((entry) => weekStartOf(entry.day) === weekStart);
  return {
    weekStart,
    submittedHours: hoursWith(inWeek, ['submitted']),
    approvedHours: hoursWith(inWeek, ['approved', 'locked']),
    draftHours: hoursWith(inWeek, ['draft', 'rejected']),
    missingDays: owed.filter((day) => weekStartOf(day) === weekStart && !logged.has(day)).length,
  };
};

const personRow = (person: ClosePerson, mine: ReadonlyArray<CloseTimeEntry>, scope: PersonScope): PersonCloseRow => {
  const owed = person.owesTime ? scope.owedDays : [];
  const logged = loggedDaysOf(mine);
  const weeks = scope.weekStarts.map((weekStart) => weekCell(weekStart, mine, owed, logged));
  const loggedDays = owed.filter((day) => logged.has(day)).length;
  const hasDraft = weeks.some((week) => week.draftHours > 0);
  return { personId: person.id, displayName: person.displayName, owesTime: person.owesTime, expectedDays: owed.length, loggedDays, weeks, straggler: loggedDays < owed.length || hasDraft };
};

/** A row is listed when the person owes time or has hours in the month. */
const closeRows = (people: ReadonlyArray<ClosePerson>, entries: ReadonlyArray<CloseTimeEntry>, scope: PersonScope): ReadonlyArray<PersonCloseRow> =>
  people.flatMap((person) => {
    const mine = entries.filter((entry) => entry.personId === person.id);
    return person.owesTime || mine.some((entry) => entry.hours > 0) ? [personRow(person, mine, scope)] : [];
  });

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

const checklistOf = (people: ReadonlyArray<PersonCloseRow>, entries: ReadonlyArray<CloseTimeEntry>, anomalyCount: number): ReadonlyArray<CloseChecklistItem> => {
  const missing = sum(people.map((person) => person.expectedDays - person.loggedDays));
  const drafts = entries.filter((entry) => entry.status === 'draft' || entry.status === 'rejected').length;
  const awaiting = entries.filter((entry) => entry.status === 'submitted').length;
  return [
    { id: 'all-days-logged', label: 'Every owed workday has time', ok: missing === 0, detail: missing === 0 ? 'All days logged' : `${plural(missing, 'workday', 'workdays')} missing` },
    { id: 'nothing-in-draft', label: 'No time left in draft', ok: drafts === 0, detail: drafts === 0 ? 'Nothing in draft' : plural(drafts, 'draft or rejected entry', 'draft or rejected entries') },
    { id: 'nothing-awaiting-approval', label: 'Every submitted entry decided', ok: awaiting === 0, detail: awaiting === 0 ? 'Queue is clear' : `${awaiting} awaiting approval` },
    { id: 'no-open-anomalies', label: 'No unreviewed anomalies', ok: anomalyCount === 0, detail: anomalyCount === 0 ? 'None flagged' : `${anomalyCount} flagged` },
  ];
};

/**
 * Month-close readiness from the month's people, entries and holidays. The
 * close screen, the lock guard and the tests read this one function.
 *
 * @since 0.44.11
 * @category readiness
 */
export const computeCloseReadiness = <E extends CloseTimeEntry, X extends string = never>(input: ReadinessInput<E, X>): CloseReadiness<E, StandardAnomalyKind | X> => {
  const holidays = input.holidays ?? [];
  const scope: PersonScope = { owedDays: expectedWorkdays(input.month, input.asOfDay, holidays), weekStarts: monthWeekStarts(input.month) };
  const people = closeRows(input.people, input.entries, scope);
  const anomalies = findAnomalies(input.entries, input.classify ?? noExtra);
  const checklist = checklistOf(people, input.entries, anomalies.length);
  const expected = sum(people.map((person) => person.expectedDays));
  const logged = sum(people.map((person) => person.loggedDays));
  const { fromDay, toDay } = monthBounds(input.month);
  return {
    month: input.month,
    people,
    awaitingApproval: input.entries.filter((entry) => entry.status === 'submitted'),
    anomalies,
    checklist,
    holidayDays: [...holidayDaysOf(holidays)].filter((day) => day >= fromDay && day <= toDay).sort(),
    readinessPct: expected === 0 ? 100 : Math.round((logged / expected) * 100),
    ready: checklist.every((item) => item.ok),
  };
};

// ---------------------------------------------------------------- approval inbox

/** @since 0.44.11 @category models */
export interface InboxItem<E extends CloseTimeEntry, K extends string> {
  readonly entry: E;
  readonly weekStart: string;
  readonly anomalies: ReadonlyArray<K>;
  /** The entry belongs to the approver. Nobody decides their own time. */
  readonly ownEntry: boolean;
}

/** @since 0.44.11 @category models */
export interface InboxInput<E extends CloseTimeEntry, X extends string = never> {
  readonly entries: ReadonlyArray<E>;
  /** The approver's person id, when the approver is in the directory. */
  readonly approverPersonId?: string;
  readonly classify?: AnomalyClassifier<E, X>;
}

/**
 * Submitted time awaiting a decision, oldest day first, each with its
 * anomalies and whether it is the approver's own entry.
 *
 * @since 0.44.11
 * @category approvals
 */
export const approvalInbox = <E extends CloseTimeEntry, X extends string = never>(input: InboxInput<E, X>): ReadonlyArray<InboxItem<E, StandardAnomalyKind | X>> =>
  input.entries
    .filter((entry) => entry.status === 'submitted')
    .map((entry) => ({ entry, weekStart: weekStartOf(entry.day), anomalies: anomaliesOf(entry, input.classify ?? noExtra), ownEntry: entry.personId === input.approverPersonId }))
    .sort((left, right) => left.entry.day.localeCompare(right.entry.day) || left.entry.id.localeCompare(right.entry.id));

// ---------------------------------------------------------------- the lock fence

/**
 * Entries in the month by the status the lock leaves them in. Only approved
 * time is locked; the rest is stranded.
 *
 * @since 0.44.11
 * @category models
 */
export interface StrandedPreview {
  readonly draft: number;
  readonly rejected: number;
  readonly submitted: number;
}

/** @since 0.44.11 @category lock */
export const strandedPreview = (entries: ReadonlyArray<CloseTimeEntry>): StrandedPreview => ({
  draft: entries.filter((entry) => entry.status === 'draft').length,
  rejected: entries.filter((entry) => entry.status === 'rejected').length,
  submitted: entries.filter((entry) => entry.status === 'submitted').length,
});

/** @since 0.44.11 @category models */
export interface LockCheckInput {
  readonly month: string;
  readonly today: string;
  readonly status: PeriodStatus;
  readonly stranded: StrandedPreview;
  readonly overrideReason?: string;
  /** Issues from `finance/CloseProfile.checkCloseProfile` for the entity's chart; any error blocks the lock. */
  readonly profileIssues?: ReadonlyArray<ValidationIssue>;
}

const hasText = (value: string | undefined): boolean => (value?.trim().length ?? 0) > 0;

/**
 * Why a lock must refuse, as issues. Empty means the lock may proceed.
 *
 * Codes: `close.future-month`, `close.not-closing`, `close.submitted-outstanding`
 * (no override skips it), `close.month-not-ended` (an override reason lifts it),
 * `close.chart-incomplete`.
 *
 * @since 0.44.11
 * @category lock
 */
export const lockIssues = (input: LockCheckInput): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  if (isFutureMonth(input.month, input.today)) issues.push(issue('close.future-month', 'error', input.month, `${input.month} has not started yet`));
  if (input.status !== 'closing') issues.push(issue('close.not-closing', 'error', input.month, `a ${input.status} period cannot be locked; start closing first`));
  if (input.stranded.submitted > 0)
    issues.push(issue('close.submitted-outstanding', 'error', input.month, `${plural(input.stranded.submitted, 'submitted entry', 'submitted entries')} still awaiting a decision`));
  if (!isMonthEnded(input.month, input.today) && !hasText(input.overrideReason))
    issues.push(issue('close.month-not-ended', 'error', input.month, `${input.month} runs to ${monthBounds(input.month).toDay}; give an override reason to lock early`));
  if ((input.profileIssues ?? []).some((found) => found.severity === 'error'))
    issues.push(issue('close.chart-incomplete', 'error', input.month, 'the close profile does not map every standard account role'));
  return issues;
};

// ---------------------------------------------------------------- receipt

/**
 * The canonical record of a locked month, exchanged between companies. It
 * names the entity, the period revision that was reviewed, the human who
 * locked it, the checklist as it stood and the chart the close was booked
 * against. It carries no time entries and no amounts.
 *
 * @since 0.44.11
 * @category schemas
 */
export const CloseReceipt = Schema.Struct({
  entityId: EntityId,
  month: CloseMonth,
  periodRevision: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  lockedOn: IsoDate,
  lockedBy: HumanActorSchema,
  lockedEntries: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  checklist: Schema.Array(Schema.Struct({ id: Schema.Literals(STANDARD_CLOSE_CHECKS), ok: Schema.Boolean })),
  /** `chart` name of the entity's `ChartMapping` and its revision. */
  chart: Schema.Struct({ name: Schema.NonEmptyString, revision: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)) }),
  overrideReason: Schema.optional(Schema.NonEmptyString),
  readinessDigest: Schema.optional(Sha256),
}).check(Schema.makeFilter((receipt) => (actsForEntity(receipt.lockedBy.actingFor, receipt.entityId) ? undefined : 'the person who locks acts for the closing entity')));
/** @since 0.44.11 @category models */
export type CloseReceipt = typeof CloseReceipt.Type;
