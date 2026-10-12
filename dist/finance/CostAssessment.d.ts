/**
 * Employer-side cost assessments and their disclosure.
 *
 * An assessment states what a scope of work cost the employer for a period,
 * by component, against a rate snapshot. It leaves the employer only as an
 * `aggregate-attested` total for a cohort of at least {@link MIN_COHORT}
 * persons (DPDP 2023, GDPR Art. 88); smaller cohorts are held unless a data
 * processing agreement is cited. Person ids and pay never appear in it.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { type ValidationIssue } from '../core/Issue.ts';
/**
 * Minimum cohort size for an aggregate disclosure.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const MIN_COHORT = 5;
/** @since 0.1.0 @category schemas */
export declare const CostAssessmentId: Schema.brand<Schema.String, "keiretsu/CostAssessmentId">;
/**
 * A cost assessment.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostAssessment: Schema.Struct<{
    readonly employerEntityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    /** Engagements covered; their persons stay with the employer. */
    readonly engagementIds: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/EngagementId">>;
    /** Distinct persons behind the engagements. */
    readonly cohortSize: Schema.Number;
    readonly minutes: Schema.Number;
    readonly components: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["pay", "burden", "benefits", "overhead", "stock-compensation", "idle-time", "contractor", "cloud-ai", "tooling", "third-party-disbursement"]>, Schema.String]>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
    }>>;
    readonly rateSnapshot: Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/SnapshotId">;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
    readonly costBaseDefinition: Schema.optional<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    readonly disclosure: Schema.Literals<readonly ["private", "aggregate-attested"]>;
    readonly attestedBy: Schema.optional<Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
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
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/CostAssessmentId">;
}>;
/** @since 0.1.0 @category models */
export type CostAssessment = typeof CostAssessment.Type;
/**
 * Whether an assessment may leave the employer.
 *
 * @since 0.1.0
 * @category models
 */
export type DisclosureOutcome = {
    readonly _tag: 'disclosable';
    readonly assessment: CostAssessment;
} | {
    readonly _tag: 'held';
    readonly issue: ValidationIssue;
};
/**
 * Apply the disclosure policy.
 *
 * Codes: `cost-assessment.private` (hold), `cost-assessment.min-cohort` (hold).
 *
 * @since 0.1.0
 * @category disclosure
 */
export declare const disclose: (assessment: CostAssessment, policy?: {
    readonly minCohort?: number;
    readonly dpaRef?: string;
}) => DisclosureOutcome;
//# sourceMappingURL=CostAssessment.d.ts.map