/**
 * Per-attribution screening rules. Each rule is a small pure function over an
 * attribution context returning zero or more issues.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue } from '../../core/Issue.ts';
import type { ClaimantAttribution } from '../ClaimantAttribution.ts';
import type { EntityTaxProfile } from '../EntityTaxProfile.ts';
import type { IncentiveRegime } from '../IncentiveRegime.ts';
import type { SetIndex } from '../IncentiveSet.ts';
import type { LabourFact } from '../LabourFact.ts';
import { type TaxActivitySlice } from '../TaxActivitySlice.ts';
/** @since 0.1.0 @category models */
export interface AttributionContext {
    readonly index: SetIndex;
    readonly attribution: ClaimantAttribution;
    readonly regime: IncentiveRegime;
    readonly slice: TaxActivitySlice;
    readonly labour: LabourFact;
    readonly claimant: EntityTaxProfile;
    readonly subject: string;
}
/**
 * Screen one attribution.
 *
 * @since 0.1.0
 * @category screening
 */
export declare const screenAttribution: (index: SetIndex, attribution: ClaimantAttribution) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=attributionRules.d.ts.map