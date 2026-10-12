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

import { Actor } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { revisionChain, RevisionFields } from '../core/Envelope.ts';
import { brand } from '../core/Id.ts';
import { EngagementId, EntityId, RuleId, SnapshotId } from '../core/Ids.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { Money } from '../core/Money.ts';
import { Period } from '../core/Temporal.ts';

import { CostComponentKind } from './CostBaseDefinition.ts';

/**
 * Minimum cohort size for an aggregate disclosure.
 *
 * @since 0.1.0
 * @category constants
 */
export const MIN_COHORT = 5;

/** @since 0.1.0 @category schemas */
export const CostAssessmentId = brand('keiretsu/CostAssessmentId');

/**
 * A cost assessment.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostAssessment = Schema.Struct({
  id: CostAssessmentId,
  ...RevisionFields,
  employerEntityId: EntityId,
  period: Period,
  /** Engagements covered; their persons stay with the employer. */
  engagementIds: Schema.NonEmptyArray(EngagementId).check(Schema.isUnique()),
  /** Distinct persons behind the engagements. */
  cohortSize: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  minutes: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  components: Schema.NonEmptyArray(Schema.Struct({ kind: CostComponentKind, amount: Money })),
  rateSnapshot: Schema.Struct({ id: SnapshotId, digest: Sha256 }),
  costBaseDefinition: Schema.optional(Schema.Struct({ id: RuleId, digest: Sha256 })),
  disclosure: Schema.Literals(['private', 'aggregate-attested']),
  attestedBy: Schema.optional(Actor),
}).check(
  revisionChain,
  Schema.makeFilter((assessment) => (new Set(assessment.components.map((line) => line.amount.currency)).size === 1 ? undefined : 'cost-assessment.single-currency: stated in one functional currency')),
  Schema.makeFilter((assessment) =>
    assessment.disclosure === 'private' || assessment.attestedBy?._tag === 'human' ? undefined : 'cost-assessment.human-attestation: aggregate disclosure is attested by a human',
  ),
);
/** @since 0.1.0 @category models */
export type CostAssessment = typeof CostAssessment.Type;

/**
 * Whether an assessment may leave the employer.
 *
 * @since 0.1.0
 * @category models
 */
export type DisclosureOutcome = { readonly _tag: 'disclosable'; readonly assessment: CostAssessment } | { readonly _tag: 'held'; readonly issue: ValidationIssue };

/**
 * Apply the disclosure policy.
 *
 * Codes: `cost-assessment.private` (hold), `cost-assessment.min-cohort` (hold).
 *
 * @since 0.1.0
 * @category disclosure
 */
export const disclose = (assessment: CostAssessment, policy: { readonly minCohort?: number; readonly dpaRef?: string } = {}): DisclosureOutcome => {
  const minimum = Math.max(policy.minCohort ?? MIN_COHORT, MIN_COHORT);
  if (assessment.disclosure === 'private') {
    return { _tag: 'held', issue: issue('cost-assessment.private', 'hold', assessment.id, 'assessment is private to the employer') };
  }
  if (assessment.cohortSize < minimum && policy.dpaRef === undefined) {
    return {
      _tag: 'held',
      issue: issue('cost-assessment.min-cohort', 'hold', assessment.id, `cohort of ${assessment.cohortSize} is below ${minimum}; aggregate would reveal individual pay`),
    };
  }
  return { _tag: 'disclosable', assessment };
};
