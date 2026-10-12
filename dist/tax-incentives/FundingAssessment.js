/**
 * Funding assessments: for one agreement between a performer and a payer,
 * the facts of the funded-research test and the verdict for each side.
 *
 * Verdicts are exclusive: the payer can be a contract-research candidate only
 * if the performer is funded, and a performer that is not funded leaves the
 * payer nothing. Labels such as "time and materials" are inputs, never verdicts.
 * A verdict other than `undetermined` cites a human decision.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { EvidenceRef } from "../core/Envelope.js";
import { DecisionId } from "../core/Hold.js";
import { AgreementId, AttributionId } from "../core/Ids.js";
import { Instant } from "../core/Temporal.js";
/**
 * Three-valued answer; `unknown` is never read as `no`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Answer = Schema.Literals(['yes', 'no', 'unknown']);
/** @since 0.1.0 @category schemas */
export const PerformerVerdict = Schema.Literals(['funded', 'not-funded', 'partially-funded', 'undetermined']);
/** @since 0.1.0 @category schemas */
export const PayerVerdict = Schema.Literals(['contract-research-candidate', 'no-contract-research', 'undetermined']);
/**
 * A funding assessment.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FundingAssessment = Schema.Struct({
    id: AttributionId,
    agreementId: AgreementId,
    performer: EntityId,
    payer: EntityId,
    paymentContingentOnSuccess: Answer,
    performerRetainsSubstantialRights: Answer,
    economicRiskBearer: Schema.Literals(['performer', 'payer', 'shared', 'unknown']),
    agreementPredatesWork: Answer,
    performerVerdict: PerformerVerdict,
    payerVerdict: PayerVerdict,
    decisionId: Schema.optional(DecisionId),
    evidence: Schema.Array(EvidenceRef),
    recordedAt: Instant,
});
/**
 * Whether the two verdicts are mutually consistent.
 *
 * @since 0.1.0
 * @category predicates
 */
export const verdictsExclusive = (assessment) => {
    if (assessment.payerVerdict === 'contract-research-candidate')
        return assessment.performerVerdict === 'funded' || assessment.performerVerdict === 'partially-funded';
    if (assessment.performerVerdict === 'not-funded')
        return assessment.payerVerdict !== 'undetermined';
    return true;
};
/**
 * Whether the facts show the payer bears the risk and holds the rights (the
 * foreign research-expenditure test for a payer of foreign work).
 *
 * @since 0.1.0
 * @category predicates
 */
export const payerBearsRiskAndHoldsRights = (assessment) => assessment.economicRiskBearer === 'payer' && assessment.performerRetainsSubstantialRights === 'no';
//# sourceMappingURL=FundingAssessment.js.map