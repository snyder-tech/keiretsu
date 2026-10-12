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
import { type ValidationIssue } from '../core/Issue.ts';
import { type IsoDate } from '../core/Temporal.ts';
import type { KeiretsuModel } from './Model.ts';
import { type Leave } from './WorkCalendar.ts';
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
/**
 * Available minutes for a declared person over `[from, to)`.
 *
 * @since 0.1.0
 * @category derivations
 */
export declare const availableMinutes: (options: AvailabilityOptions) => AvailabilityResult;
//# sourceMappingURL=Availability.d.ts.map