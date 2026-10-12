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
/**
 * Three-valued answer; `unknown` is never read as `no`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Answer: Schema.Literals<readonly ["yes", "no", "unknown"]>;
/** @since 0.1.0 @category models */
export type Answer = typeof Answer.Type;
/** @since 0.1.0 @category schemas */
export declare const PerformerVerdict: Schema.Literals<readonly ["funded", "not-funded", "partially-funded", "undetermined"]>;
/** @since 0.1.0 @category models */
export type PerformerVerdict = typeof PerformerVerdict.Type;
/** @since 0.1.0 @category schemas */
export declare const PayerVerdict: Schema.Literals<readonly ["contract-research-candidate", "no-contract-research", "undetermined"]>;
/** @since 0.1.0 @category models */
export type PayerVerdict = typeof PayerVerdict.Type;
/**
 * A funding assessment.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FundingAssessment: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
    readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
    readonly performer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly payer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly paymentContingentOnSuccess: Schema.Literals<readonly ["yes", "no", "unknown"]>;
    readonly performerRetainsSubstantialRights: Schema.Literals<readonly ["yes", "no", "unknown"]>;
    readonly economicRiskBearer: Schema.Literals<readonly ["performer", "payer", "shared", "unknown"]>;
    readonly agreementPredatesWork: Schema.Literals<readonly ["yes", "no", "unknown"]>;
    readonly performerVerdict: Schema.Literals<readonly ["funded", "not-funded", "partially-funded", "undetermined"]>;
    readonly payerVerdict: Schema.Literals<readonly ["contract-research-candidate", "no-contract-research", "undetermined"]>;
    readonly decisionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DecisionId">>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type FundingAssessment = typeof FundingAssessment.Type;
/**
 * Whether the two verdicts are mutually consistent.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const verdictsExclusive: (assessment: FundingAssessment) => boolean;
/**
 * Whether the facts show the payer bears the risk and holds the rights (the
 * foreign research-expenditure test for a payer of foreign work).
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const payerBearsRiskAndHoldsRights: (assessment: FundingAssessment) => boolean;
//# sourceMappingURL=FundingAssessment.d.ts.map