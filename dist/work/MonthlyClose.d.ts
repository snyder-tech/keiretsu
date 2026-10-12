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
import { type ValidationIssue } from '../core/Issue.ts';
/**
 * Period lifecycle. A month closes in two steps so stragglers can be chased
 * before the lock; a locked month is a fence and never reopens.
 *
 * @since 0.44.11
 * @category constants
 */
export declare const PERIOD_STATUS_TRANSITIONS: {
    readonly open: readonly ["closing"];
    readonly closing: readonly ["open", "locked"];
    readonly locked: readonly [];
};
/** @since 0.44.11 @category models */
export type PeriodStatus = keyof typeof PERIOD_STATUS_TRANSITIONS;
/** @since 0.44.11 @category constants */
export declare const PERIOD_STATUSES: ReadonlyArray<PeriodStatus>;
/**
 * Whether a period may move from `from` to `to`.
 *
 * @since 0.44.11
 * @category guards
 */
export declare const canTransitionPeriod: (from: PeriodStatus, to: PeriodStatus) => boolean;
/**
 * Time entry statuses. Only approved time is locked by a close; draft and
 * rejected time is left behind, and submitted time blocks the lock.
 *
 * @since 0.44.11
 * @category constants
 */
export declare const TIME_STATUSES: readonly ["draft", "submitted", "approved", "rejected", "locked"];
/** @since 0.44.11 @category models */
export type TimeStatus = (typeof TIME_STATUSES)[number];
/**
 * A close month, `YYYY-MM`.
 *
 * @since 0.44.11
 * @category schemas
 */
export declare const CloseMonth: Schema.String;
/** @since 0.44.11 @category calendar */
export declare const addDays: (day: string, count: number) => string;
/** 0 = Monday … 6 = Sunday. @since 0.44.11 @category calendar */
export declare const weekdayIndex: (day: string) => number;
/** @since 0.44.11 @category calendar */
export declare const isWeekend: (day: string) => boolean;
/** Monday of the week containing `day`. @since 0.44.11 @category calendar */
export declare const weekStartOf: (day: string) => string;
/** First and last civil day of a month. @since 0.44.11 @category calendar */
export declare const monthBounds: (month: string) => {
    readonly fromDay: string;
    readonly toDay: string;
};
/** Every day from `fromDay` to `toDay`, inclusive. @since 0.44.11 @category calendar */
export declare const daysBetween: (fromDay: string, toDay: string) => ReadonlyArray<string>;
/** The Mondays of every week that touches the month. @since 0.44.11 @category calendar */
export declare const monthWeekStarts: (month: string) => ReadonlyArray<string>;
/** Whether every day of the month is before `today`. @since 0.44.11 @category calendar */
export declare const isMonthEnded: (month: string, today: string) => boolean;
/** Whether the month starts after the month containing `today`. @since 0.44.11 @category calendar */
export declare const isFutureMonth: (month: string, today: string) => boolean;
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
export declare const standardAnomalies: (entry: CloseTimeEntry) => ReadonlyArray<StandardAnomalyKind>;
/** Standard then adopter anomalies of one entry, regardless of status. @since 0.44.11 @category checks */
export declare const anomaliesOf: <E extends CloseTimeEntry, X extends string = never>(entry: E, classify?: AnomalyClassifier<E, X>) => ReadonlyArray<StandardAnomalyKind | X>;
/**
 * Anomalies on entries still waiting for a decision (status `submitted`).
 *
 * @since 0.44.11
 * @category checks
 */
export declare const findAnomalies: <E extends CloseTimeEntry, X extends string = never>(entries: ReadonlyArray<E>, classify?: AnomalyClassifier<E, X>) => ReadonlyArray<EntryAnomaly<StandardAnomalyKind | X>>;
/** The days off in a set of holidays: every holiday that carries hours. @since 0.44.11 @category calendar */
export declare const holidayDaysOf: (holidays: ReadonlyArray<CloseHoliday>) => ReadonlySet<string>;
/** Weekdays of the month up to `asOfDay`, less company holidays. @since 0.44.11 @category calendar */
export declare const expectedWorkdays: (month: string, asOfDay: string, holidays?: ReadonlyArray<CloseHoliday>) => ReadonlyArray<string>;
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
export declare const STANDARD_CLOSE_CHECKS: readonly ["all-days-logged", "nothing-in-draft", "nothing-awaiting-approval", "no-open-anomalies"];
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
/**
 * Month-close readiness from the month's people, entries and holidays. The
 * close screen, the lock guard and the tests read this one function.
 *
 * @since 0.44.11
 * @category readiness
 */
export declare const computeCloseReadiness: <E extends CloseTimeEntry, X extends string = never>(input: ReadinessInput<E, X>) => CloseReadiness<E, StandardAnomalyKind | X>;
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
export declare const approvalInbox: <E extends CloseTimeEntry, X extends string = never>(input: InboxInput<E, X>) => ReadonlyArray<InboxItem<E, StandardAnomalyKind | X>>;
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
export declare const strandedPreview: (entries: ReadonlyArray<CloseTimeEntry>) => StrandedPreview;
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
export declare const lockIssues: (input: LockCheckInput) => ReadonlyArray<ValidationIssue>;
/**
 * The canonical record of a locked month, exchanged between companies. It
 * names the entity, the period revision that was reviewed, the human who
 * locked it, the checklist as it stood and the chart the close was booked
 * against. It carries no time entries and no amounts.
 *
 * @since 0.44.11
 * @category schemas
 */
export declare const CloseReceipt: Schema.Struct<{
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly month: Schema.String;
    readonly periodRevision: Schema.Number;
    readonly lockedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly lockedBy: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly lockedEntries: Schema.Number;
    readonly checklist: Schema.$Array<Schema.Struct<{
        readonly id: Schema.Literals<readonly ["all-days-logged", "nothing-in-draft", "nothing-awaiting-approval", "no-open-anomalies"]>;
        readonly ok: Schema.Boolean;
    }>>;
    /** `chart` name of the entity's `ChartMapping` and its revision. */
    readonly chart: Schema.Struct<{
        readonly name: Schema.NonEmptyString;
        readonly revision: Schema.Number;
    }>;
    readonly overrideReason: Schema.optional<Schema.NonEmptyString>;
    readonly readinessDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.44.11 @category models */
export type CloseReceipt = typeof CloseReceipt.Type;
//# sourceMappingURL=MonthlyClose.d.ts.map