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
import { type Decision } from '../core/Hold.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { IsoDate } from '../core/Temporal.ts';
import { CostPoolId } from './CostPool.ts';
/**
 * Allocation driver.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Driver: Schema.TaggedUnion<{
    readonly minutes: Schema.TaggedStruct<"minutes", {}>;
    readonly headcount: Schema.TaggedStruct<"headcount", {}>;
    readonly revenue: Schema.TaggedStruct<"revenue", {}>;
    readonly "usage-units": Schema.TaggedStruct<"usage-units", {
        readonly meter: Schema.NonEmptyString;
    }>;
    readonly "square-meters": Schema.TaggedStruct<"square-meters", {}>;
    readonly "agreed-shares": Schema.TaggedStruct<"agreed-shares", {}>;
    readonly "activity-quantity": Schema.TaggedStruct<"activity-quantity", {
        readonly activityId: Schema.NonEmptyString;
    }>;
}>;
/** @since 0.1.0 @category models */
export type Driver = typeof Driver.Type;
/**
 * The human approval a rule version carries.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RuleApproval: Schema.Struct<{
    readonly decisionId: Schema.brand<Schema.String, "keiretsu/DecisionId">;
    readonly decidedBy: Schema.TaggedUnion<{
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
    }>;
    readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type RuleApproval = typeof RuleApproval.Type;
/**
 * One version of an allocation rule. `targets` order is the declared tie-break order.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AllocationRule: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly fromPoolId: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
    readonly driver: Schema.TaggedUnion<{
        readonly minutes: Schema.TaggedStruct<"minutes", {}>;
        readonly headcount: Schema.TaggedStruct<"headcount", {}>;
        readonly revenue: Schema.TaggedStruct<"revenue", {}>;
        readonly "usage-units": Schema.TaggedStruct<"usage-units", {
            readonly meter: Schema.NonEmptyString;
        }>;
        readonly "square-meters": Schema.TaggedStruct<"square-meters", {}>;
        readonly "agreed-shares": Schema.TaggedStruct<"agreed-shares", {}>;
        readonly "activity-quantity": Schema.TaggedStruct<"activity-quantity", {
            readonly activityId: Schema.NonEmptyString;
        }>;
    }>;
    readonly targets: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly approval: Schema.Struct<{
        readonly decisionId: Schema.brand<Schema.String, "keiretsu/DecisionId">;
        readonly decidedBy: Schema.TaggedUnion<{
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
        }>;
        readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>;
}>;
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
export declare const checkApproval: (rule: AllocationRule, decision: Decision) => ReadonlyArray<ValidationIssue>;
/**
 * Version invariants across a rule set: unique revisions, no overlapping validity per rule id.
 *
 * Codes: `allocation-rule.duplicate-revision`, `allocation-rule.overlap`.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const validateVersions: (rules: ReadonlyArray<AllocationRule>) => ReadonlyArray<ValidationIssue>;
/**
 * Rule versions for a pool in effect on a date (zero, one or — if misconfigured — several).
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const rulesInEffect: (rules: ReadonlyArray<AllocationRule>, poolId: CostPoolId, date: IsoDate) => ReadonlyArray<AllocationRule>;
//# sourceMappingURL=AllocationRule.d.ts.map