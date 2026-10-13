import { actsForEntity } from "../core/PartyRef.js";
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
import { EntityId, HumanActorSchema } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { issue } from "../core/Issue.js";
import { IsoDate, Period } from "../core/Temporal.js";
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
};
/** @since 0.44.11 @category constants */
export const PERIOD_STATUSES = ['open', 'closing', 'locked'];
/**
 * Whether a period may move from `from` to `to`.
 *
 * @since 0.44.11
 * @category guards
 */
export const canTransitionPeriod = (from, to) => from !== to && PERIOD_STATUS_TRANSITIONS[from].includes(to);
/**
 * Time entry statuses. Only approved time is locked by a close; draft and
 * rejected time is left behind, and submitted time blocks the lock.
 *
 * @since 0.44.11
 * @category constants
 */
export const TIME_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'locked'];
// ---------------------------------------------------------------- calendar
/**
 * A close month, `YYYY-MM`.
 *
 * @since 0.44.11
 * @category schemas
 */
export const CloseMonth = Schema.toEncoded(Period);
/** Civil day with a string wire representation. @since 0.44.11 @category schemas */
export const CloseDay = Schema.toEncoded(IsoDate);
const DAY_MS = 86_400_000;
const toUtc = (day) => new Date(`${day}T00:00:00Z`).getTime();
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);
/** @since 0.44.11 @category calendar */
export const addDays = (day, count) => fromUtc(toUtc(day) + count * DAY_MS);
/** 0 = Monday … 6 = Sunday. @since 0.44.11 @category calendar */
export const weekdayIndex = (day) => (new Date(toUtc(day)).getUTCDay() + 6) % 7;
/** @since 0.44.11 @category calendar */
export const isWeekend = (day) => weekdayIndex(day) >= 5;
/** Monday of the week containing `day`. @since 0.44.11 @category calendar */
export const weekStartOf = (day) => addDays(day, -weekdayIndex(day));
/** First and last civil day of a month. @since 0.44.11 @category calendar */
export const monthBounds = (month) => {
    const lastDay = new Date(toUtc(`${month}-01`));
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
    return { fromDay: `${month}-01`, toDay: fromUtc(lastDay.getTime()) };
};
/** Every day from `fromDay` to `toDay`, inclusive. @since 0.44.11 @category calendar */
export const daysBetween = (fromDay, toDay) => {
    const count = Math.round((toUtc(toDay) - toUtc(fromDay)) / DAY_MS) + 1;
    return count <= 0 ? [] : Array.from({ length: count }, (_, index) => addDays(fromDay, index));
};
/** The Mondays of every week that touches the month. @since 0.44.11 @category calendar */
export const monthWeekStarts = (month) => {
    const { fromDay, toDay } = monthBounds(month);
    const starts = [];
    for (let start = weekStartOf(fromDay); start <= toDay; start = addDays(start, 7))
        starts.push(start);
    return starts;
};
/** Whether every day of the month is before `today`. @since 0.44.11 @category calendar */
export const isMonthEnded = (month, today) => monthBounds(month).toDay < today;
/** Whether the month starts after the month containing `today`. @since 0.44.11 @category calendar */
export const isFutureMonth = (month, today) => month > today.slice(0, 7);
/** The standard anomalies of one entry. @since 0.44.11 @category checks */
export const standardAnomalies = (entry) => {
    const kinds = [];
    if (entry.hours > 10)
        kinds.push('over-ten-hours');
    if (isWeekend(entry.day) && entry.hours > 0)
        kinds.push('weekend');
    return kinds;
};
const noExtra = () => [];
/** Standard then adopter anomalies of one entry, regardless of status. @since 0.44.11 @category checks */
export const anomaliesOf = (entry, classify = noExtra) => [
    ...standardAnomalies(entry),
    ...classify(entry),
];
/**
 * Anomalies on entries still waiting for a decision (status `submitted`).
 *
 * @since 0.44.11
 * @category checks
 */
export const findAnomalies = (entries, classify = noExtra) => entries.flatMap((entry) => (entry.status === 'submitted' ? anomaliesOf(entry, classify).map((kind) => ({ entryId: entry.id, kind })) : []));
/** The days off in a set of holidays: every holiday that carries hours. @since 0.44.11 @category calendar */
export const holidayDaysOf = (holidays) => new Set(holidays.flatMap((holiday) => (holiday.hours > 0 ? [holiday.day] : [])));
/** Weekdays of the month up to `asOfDay`, less company holidays. @since 0.44.11 @category calendar */
export const expectedWorkdays = (month, asOfDay, holidays = []) => {
    const { fromDay, toDay } = monthBounds(month);
    const off = holidayDaysOf(holidays);
    return daysBetween(fromDay, asOfDay < toDay ? asOfDay : toDay).filter((day) => !isWeekend(day) && !off.has(day));
};
/**
 * The standard close checklist. Every adopter's checklist has exactly these
 * items, in this order.
 *
 * @since 0.44.11
 * @category constants
 */
export const STANDARD_CLOSE_CHECKS = ['all-days-logged', 'nothing-in-draft', 'nothing-awaiting-approval', 'no-open-anomalies'];
const sum = (values) => values.reduce((total, value) => total + value, 0);
const hoursWith = (entries, statuses) => entries.reduce((total, entry) => (statuses.includes(entry.status) ? total + entry.hours : total), 0);
const loggedDaysOf = (entries) => new Set(entries.flatMap((entry) => (entry.hours > 0 ? [entry.day] : [])));
const weekCell = (weekStart, entries, owed, logged) => {
    const inWeek = entries.filter((entry) => weekStartOf(entry.day) === weekStart);
    return {
        weekStart,
        submittedHours: hoursWith(inWeek, ['submitted']),
        approvedHours: hoursWith(inWeek, ['approved', 'locked']),
        draftHours: hoursWith(inWeek, ['draft', 'rejected']),
        missingDays: owed.filter((day) => weekStartOf(day) === weekStart && !logged.has(day)).length,
    };
};
const personRow = (person, mine, scope) => {
    const owed = person.owesTime ? scope.owedDays : [];
    const logged = loggedDaysOf(mine);
    const weeks = scope.weekStarts.map((weekStart) => weekCell(weekStart, mine, owed, logged));
    const loggedDays = owed.filter((day) => logged.has(day)).length;
    const hasDraft = weeks.some((week) => week.draftHours > 0);
    return { personId: person.id, displayName: person.displayName, owesTime: person.owesTime, expectedDays: owed.length, loggedDays, weeks, straggler: loggedDays < owed.length || hasDraft };
};
/** A row is listed when the person owes time or has hours in the month. */
const closeRows = (people, entries, scope) => people.flatMap((person) => {
    const mine = entries.filter((entry) => entry.personId === person.id);
    return person.owesTime || mine.some((entry) => entry.hours > 0) ? [personRow(person, mine, scope)] : [];
});
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const checklistOf = (people, entries, anomalyCount) => {
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
export const computeCloseReadiness = (input) => {
    const holidays = input.holidays ?? [];
    const scope = { owedDays: expectedWorkdays(input.month, input.asOfDay, holidays), weekStarts: monthWeekStarts(input.month) };
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
/**
 * Submitted time awaiting a decision, oldest day first, each with its
 * anomalies and whether it is the approver's own entry.
 *
 * @since 0.44.11
 * @category approvals
 */
export const approvalInbox = (input) => input.entries
    .filter((entry) => entry.status === 'submitted')
    .map((entry) => ({ entry, weekStart: weekStartOf(entry.day), anomalies: anomaliesOf(entry, input.classify ?? noExtra), ownEntry: entry.personId === input.approverPersonId }))
    .sort((left, right) => left.entry.day.localeCompare(right.entry.day) || left.entry.id.localeCompare(right.entry.id));
/** @since 0.44.11 @category lock */
export const strandedPreview = (entries) => ({
    draft: entries.filter((entry) => entry.status === 'draft').length,
    rejected: entries.filter((entry) => entry.status === 'rejected').length,
    submitted: entries.filter((entry) => entry.status === 'submitted').length,
});
const hasText = (value) => (value?.trim().length ?? 0) > 0;
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
export const lockIssues = (input) => {
    const issues = [];
    if (isFutureMonth(input.month, input.today))
        issues.push(issue('close.future-month', 'error', input.month, `${input.month} has not started yet`));
    if (input.status !== 'closing')
        issues.push(issue('close.not-closing', 'error', input.month, `a ${input.status} period cannot be locked; start closing first`));
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
//# sourceMappingURL=MonthlyClose.js.map