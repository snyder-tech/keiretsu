/**
 * Record-level screening rules: regimes, slices, funding assessments,
 * transfers and attribution uniqueness.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue } from '../../core/Issue.ts';
import { type ClaimantAttribution } from '../ClaimantAttribution.ts';
import { type FundingAssessment } from '../FundingAssessment.ts';
import type { IncentiveRegime } from '../IncentiveRegime.ts';
import type { SetIndex } from '../IncentiveSet.ts';
/**
 * Regime data checks: verification status and citation staleness.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenRegime: (regime: IncentiveRegime, options: {
    readonly asOf: string;
    readonly staleAfterDays: number;
}) => ReadonlyArray<ValidationIssue>;
/**
 * Slice checks keyed by slice id.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenSlices: (index: SetIndex) => ReadonlyMap<string, ReadonlyArray<ValidationIssue>>;
/**
 * Funding assessment checks.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenFunding: (assessment: FundingAssessment) => ReadonlyArray<ValidationIssue>;
/**
 * Transfer checks keyed by event id.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenTransfers: (index: SetIndex) => ReadonlyArray<ValidationIssue>;
/**
 * Uniqueness of `(eventId, eventDigest, sliceId, regimeId)` across all claimants.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenUniqueness: (attributions: ReadonlyArray<ClaimantAttribution>) => ReadonlyMap<string, ReadonlyArray<ValidationIssue>>;
//# sourceMappingURL=recordRules.d.ts.map