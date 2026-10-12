/**
 * Screening: run every invariant over an incentive set and return a core
 * validation report. Errors reject a record, holds wait for a human decision,
 * warnings flag for review. Nothing here is a filing position.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue, ValidationReport } from '../core/Issue.ts';
import { report } from '../core/Issue.ts';

import type { ClaimantAttribution } from './ClaimantAttribution.ts';
import { type IncentiveSet, indexSet, type SetIndex } from './IncentiveSet.ts';
import { screenAttribution } from './internal/attributionRules.ts';
import { screenFunding, screenRegime, screenSlices, screenTransfers, screenUniqueness } from './internal/recordRules.ts';
import { blocks } from './IssueCode.ts';

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

const fundingIssues = (index: SetIndex, attribution: ClaimantAttribution): ReadonlyArray<ValidationIssue> => {
  const funding = attribution.fundingAssessmentId === undefined ? undefined : index.fundings.get(attribution.fundingAssessmentId);
  return funding === undefined ? [] : screenFunding(funding);
};

/**
 * Screen a set and keep the per-attribution view used by candidate pools.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenDetailed = (set: IncentiveSet, options: ScreenOptions = {}): ScreenResult => {
  const index = indexSet(set);
  const regimeIssues = set.regimes.flatMap((regime) => screenRegime(regime, { asOf: set.asOf, staleAfterDays: options.staleAfterDays ?? 365 }));
  const sliceIssues = screenSlices(index);
  const uniqueness = screenUniqueness(set.attributions);
  const own = new Map(set.attributions.map((attribution) => [attribution.id, [...screenAttribution(index, attribution), ...(uniqueness.get(attribution.id) ?? [])]] as const));
  const byAttribution = new Map(
    set.attributions.map((attribution) => [attribution.id, [...(own.get(attribution.id) ?? []), ...(sliceIssues.get(attribution.sliceId) ?? []), ...fundingIssues(index, attribution)]] as const),
  );
  const issues = [...regimeIssues, ...[...sliceIssues.values()].flat(), ...set.fundings.flatMap(screenFunding), ...screenTransfers(index), ...[...own.values()].flat()];
  return { report: report(issues), index, byAttribution };
};

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
export const screen = (set: IncentiveSet, options: ScreenOptions = {}): ValidationReport => screenDetailed(set, options).report;

/**
 * Whether an attribution has no blocking (error or hold) issue.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isClear = (result: ScreenResult, attributionId: string): boolean => !(result.byAttribution.get(attributionId) ?? []).some(blocks);
