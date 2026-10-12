import { report } from "../core/Issue.js";
import { indexSet } from "./IncentiveSet.js";
import { screenAttribution } from "./internal/attributionRules.js";
import { screenFunding, screenRegime, screenSlices, screenTransfers, screenUniqueness } from "./internal/recordRules.js";
import { blocks } from "./IssueCode.js";
const fundingIssues = (index, attribution) => {
    const funding = attribution.fundingAssessmentId === undefined ? undefined : index.fundings.get(attribution.fundingAssessmentId);
    return funding === undefined ? [] : screenFunding(funding);
};
/**
 * Screen a set and keep the per-attribution view used by candidate pools.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenDetailed = (set, options = {}) => {
    const index = indexSet(set);
    const regimeIssues = set.regimes.flatMap((regime) => screenRegime(regime, { asOf: set.asOf, staleAfterDays: options.staleAfterDays ?? 365 }));
    const sliceIssues = screenSlices(index);
    const uniqueness = screenUniqueness(set.attributions);
    const own = new Map(set.attributions.map((attribution) => [attribution.id, [...screenAttribution(index, attribution), ...(uniqueness.get(attribution.id) ?? [])]]));
    const byAttribution = new Map(set.attributions.map((attribution) => [attribution.id, [...(own.get(attribution.id) ?? []), ...(sliceIssues.get(attribution.sliceId) ?? []), ...fundingIssues(index, attribution)]]));
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
export const screen = (set, options = {}) => screenDetailed(set, options).report;
/**
 * Whether an attribution has no blocking (error or hold) issue.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isClear = (result, attributionId) => !(result.byAttribution.get(attributionId) ?? []).some(blocks);
//# sourceMappingURL=Screen.js.map