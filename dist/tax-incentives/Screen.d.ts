/**
 * Screening: run every invariant over an incentive set and return a core
 * validation report. Errors reject a record, holds wait for a human decision,
 * warnings flag for review. Nothing here is a filing position.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue, ValidationReport } from '../core/Issue.ts';
import { type IncentiveSet, type SetIndex } from './IncentiveSet.ts';
/**
 * Screening options.
 *
 * @since 0.1.0
 * @category models
 */
export interface ScreenOptions {
    /** Citations older than this many days at `asOf` raise `regime.citation-stale` (default 365). */
    readonly staleAfterDays?: number;
}
/**
 * Detailed screening result: the flat report and the issues bearing on each attribution.
 *
 * @since 0.1.0
 * @category models
 */
export interface ScreenResult {
    readonly report: ValidationReport;
    readonly index: SetIndex;
    /** Issues on the attribution itself, its slice and its funding assessment. */
    readonly byAttribution: ReadonlyMap<string, ReadonlyArray<ValidationIssue>>;
}
/**
 * Screen a set and keep the per-attribution view used by candidate pools.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenDetailed: (set: IncentiveSet, options?: ScreenOptions) => ScreenResult;
/**
 * Screen a set.
 *
 * @example
 * ```ts
 * import { screen } from './Screen.ts'
 * declare const set: import('@snyder-tech/keiretsu/tax-incentives/IncentiveSet').IncentiveSet
 * const { issues, holdCount } = screen(set)
 * ```
 * @since 0.1.0
 * @category screening
 */
export declare const screen: (set: IncentiveSet, options?: ScreenOptions) => ValidationReport;
/**
 * Whether an attribution has no blocking (error or hold) issue.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isClear: (result: ScreenResult, attributionId: string) => boolean;
//# sourceMappingURL=Screen.d.ts.map