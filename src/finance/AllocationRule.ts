/**
 * Approved, versioned allocation rules.
 *
 * A rule moves one pool's cost to cost objects by a driver. Every version is
 * approved by a human decision (cited by id), versions of one rule never
 * overlap in time, and a close run uses only the single version in effect.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Actor } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { revisionChain } from '../core/Envelope.ts';
import { type Decision, DecisionId } from '../core/Hold.ts';
import { CostObjectId, EntityId, RuleId } from '../core/Ids.ts';
import { type ValidationIssue, issue } from '../core/Issue.ts';
import { contains, Instant, IsoDate, overlaps } from '../core/Temporal.ts';

import { CostPoolId } from './CostPool.ts';

/**
 * Allocation driver.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Driver = Schema.TaggedUnion({
  minutes: {},
  headcount: {},
  revenue: {},
  'usage-units': { meter: Schema.NonEmptyString },
  'square-meters': {},
  'agreed-shares': {},
  'activity-quantity': { activityId: Schema.NonEmptyString },
});
/** @since 0.1.0 @category models */
export type Driver = typeof Driver.Type;

/**
 * The human approval a rule version carries.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RuleApproval = Schema.Struct({
  decisionId: DecisionId,
  decidedBy: Actor,
  decidedAt: Instant,
}).check(Schema.makeFilter((approval) => (approval.decidedBy._tag === 'human' ? undefined : 'allocation-rule.human-approval: allocation rules are approved by a human')));
/** @since 0.1.0 @category models */
export type RuleApproval = typeof RuleApproval.Type;

/**
 * One version of an allocation rule. `targets` order is the declared tie-break order.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AllocationRule = Schema.Struct({
  id: RuleId,
  revision: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  supersedesDigest: Schema.optional(Sha256),
  entityId: EntityId,
  fromPoolId: CostPoolId,
  driver: Driver,
  targets: Schema.NonEmptyArray(CostObjectId).check(Schema.isUnique()),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  approval: RuleApproval,
}).check(revisionChain);
/** @since 0.1.0 @category models */
export type AllocationRule = typeof AllocationRule.Type;

/**
 * Check that an approving decision is human, chose an `approve` option and concerns this rule version.
 *
 * Codes: `allocation-rule.human-approval`, `allocation-rule.not-approved`, `allocation-rule.decision-subject`.
 *
 * @since 0.1.0
 * @category checks
 */
export const checkApproval = (rule: AllocationRule, decision: Decision): ReadonlyArray<ValidationIssue> => {
  const subject = `${rule.id}@${rule.revision}`;
  const issues: Array<ValidationIssue> = [];
  if (decision.id !== rule.approval.decisionId) issues.push(issue('allocation-rule.decision-subject', 'error', subject, 'approval cites a different decision'));
  if (decision.decidedBy._tag !== 'human') issues.push(issue('allocation-rule.human-approval', 'error', subject, 'decision was not made by a human'));
  if (decision.chosenOptionId !== 'approve') issues.push(issue('allocation-rule.not-approved', 'error', subject, `decision chose ${decision.chosenOptionId}`));
  if (decision.subject.kind !== 'allocation-rule' || decision.subject.id !== rule.id) issues.push(issue('allocation-rule.decision-subject', 'error', subject, 'decision concerns another subject'));
  return issues;
};

/**
 * Version invariants across a rule set: unique revisions, no overlapping validity per rule id.
 *
 * Codes: `allocation-rule.duplicate-revision`, `allocation-rule.overlap`.
 *
 * @since 0.1.0
 * @category checks
 */
export const validateVersions = (rules: ReadonlyArray<AllocationRule>): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  rules.forEach((rule, index) => {
    for (const other of rules.slice(index + 1)) {
      if (other.id !== rule.id) continue;
      if (other.revision === rule.revision) issues.push(issue('allocation-rule.duplicate-revision', 'error', rule.id, `revision ${rule.revision} appears twice`));
      else if (overlaps(rule, other)) issues.push(issue('allocation-rule.overlap', 'error', rule.id, `revisions ${rule.revision} and ${other.revision} overlap`));
    }
  });
  return issues;
};

/**
 * Rule versions for a pool in effect on a date (zero, one or — if misconfigured — several).
 *
 * @since 0.1.0
 * @category lookups
 */
export const rulesInEffect = (rules: ReadonlyArray<AllocationRule>, poolId: CostPoolId, date: IsoDate): ReadonlyArray<AllocationRule> =>
  rules.filter((rule) => rule.fromPoolId === poolId && contains(rule, date));
