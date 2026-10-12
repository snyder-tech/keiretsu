/**
 * Billing policies: the versioned, effective-dated rules a company's
 * management approved for pricing and quoting (lead-time discounts, hold
 * terms, rounding, minimums). Humans decide; agents operate: a quote or price
 * an agent or system drafts must cite the policy revision in force on the
 * quote date, by id, revision and digest, and the citation is checked before
 * the quote leaves the company.
 *
 * The policy text lives with its owner and is pinned by digest (`document`);
 * this record carries its version, effective interval and approval.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { Actor } from '../core/Actor.ts';
import { type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { EvidenceRef } from '../core/Envelope.ts';
import { type ValidationIssue } from '../core/Issue.ts';
/**
 * Who approved the policy, when, and the decision record if any.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PolicyApproval: Schema.Struct<{
    readonly approvedBy: Schema.TaggedUnion<{
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
    readonly approvedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly decisionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DecisionId">>;
}>;
/** @since 0.1.0 @category models */
export type PolicyApproval = typeof PolicyApproval.Type;
interface PolicyShape {
    readonly owner: string;
    readonly status: string;
    readonly approval?: PolicyApproval | undefined;
    readonly document: EvidenceRef;
}
/**
 * Billing-policy invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const billingPolicyRules: {
    readonly approvedByManagement: import("./Invariant.ts").Rule<PolicyShape>;
    readonly documentPinned: import("./Invariant.ts").Rule<PolicyShape>;
};
/**
 * A billing policy revision.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BillingPolicy: Schema.Struct<{
    readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
    /** The owner's version label (e.g. `2026.4`). */
    readonly version: Schema.NonEmptyString;
    readonly title: Schema.NonEmptyString;
    readonly document: Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    readonly status: Schema.Literals<readonly ["proposed", "approved", "withdrawn"]>;
    readonly approval: Schema.optional<Schema.Struct<{
        readonly approvedBy: Schema.TaggedUnion<{
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
        readonly approvedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly decisionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DecisionId">>;
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/BillingPolicyId">;
}>;
/** @since 0.1.0 @category models */
export type BillingPolicy = typeof BillingPolicy.Type;
/**
 * A citation of one policy revision.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PolicyCitation: Schema.Struct<{
    readonly policyId: Schema.brand<Schema.String, "keiretsu/BillingPolicyId">;
    readonly revision: Schema.Number;
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
/** @since 0.1.0 @category models */
export type PolicyCitation = typeof PolicyCitation.Type;
/**
 * Cite a policy revision (digest over its canonical wire form).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const citePolicy: (policy: BillingPolicy) => Effect.Effect<PolicyCitation, CanonicalJsonError | Schema.SchemaError>;
/**
 * A quote or price as the citation check sees it.
 *
 * @since 0.1.0
 * @category models
 */
export interface QuoteSubject {
    /** Identifier reported on issues. */
    readonly subject: string;
    readonly quotedBy: Actor;
    readonly quotedOn: string;
    /** The entity issuing the quote; its policy applies. */
    readonly issuer: string;
    readonly citation?: PolicyCitation | undefined;
}
/**
 * Check a quote's policy citation. Agent- and system-drafted quotes must cite;
 * a cited revision must be in the set, match its digest, belong to the
 * issuer, be approved and be in force on the quote date, and no later approved
 * revision may be in force on that date (a proposed or future-dated revision
 * does not supersede it).
 *
 * | Code | Severity |
 * | --- | --- |
 * | `billing-policy.citation-missing` | error |
 * | `billing-policy.unresolved` | error |
 * | `billing-policy.digest-mismatch` | error |
 * | `billing-policy.owner-mismatch` | error |
 * | `billing-policy.not-approved` | error |
 * | `billing-policy.not-in-force` | error |
 * | `billing-policy.superseded` | error |
 *
 * @since 0.1.0
 * @category validators
 */
export declare const checkPolicyCitation: (quote: QuoteSubject, policies: ReadonlyArray<BillingPolicy>) => Effect.Effect<ReadonlyArray<ValidationIssue>, CanonicalJsonError | Schema.SchemaError>;
export {};
//# sourceMappingURL=BillingPolicy.d.ts.map