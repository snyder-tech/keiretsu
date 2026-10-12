import { actsForEntity } from "../core/PartyRef.js";
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
import { Actor } from "../core/Actor.js";
import { digestValueSync, Sha256 } from "../core/CanonicalJson.js";
import { BitemporalFields, EvidenceRef, revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { DecisionId } from "../core/Hold.js";
import { EntityId } from "../core/Ids.js";
import { issue } from "../core/Issue.js";
import { contains, Instant } from "../core/Temporal.js";
import { BillingPolicyId } from "./CommerceIds.js";
import { rule, toCheck } from "./Invariant.js";
/**
 * Who approved the policy, when, and the decision record if any.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PolicyApproval = Schema.Struct({ approvedBy: Actor, approvedAt: Instant, decisionId: Schema.optional(DecisionId) });
/**
 * Billing-policy invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const billingPolicyRules = {
    approvedByManagement: rule('billing-policy.approval-not-human', (policy) => {
        if (policy.status !== 'approved')
            return undefined;
        const by = policy.approval?.approvedBy;
        return by?._tag === 'human' && actsForEntity(by.actingFor, policy.owner) ? undefined : 'an approved policy names a human approver acting for its owner';
    }),
    documentPinned: rule('billing-policy.document-undigested', (policy) => (policy.document.digest === undefined ? 'the policy document is pinned by digest' : undefined)),
};
/**
 * A billing policy revision.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BillingPolicy = Schema.Struct({
    id: BillingPolicyId,
    ...RevisionFields,
    ...BitemporalFields,
    owner: EntityId,
    /** The owner's version label (e.g. `2026.4`). */
    version: Schema.NonEmptyString.check(Schema.isMaxLength(32)),
    title: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
    document: EvidenceRef,
    status: Schema.Literals(['proposed', 'approved', 'withdrawn']),
    approval: Schema.optional(PolicyApproval),
}).check(revisionChain, validInterval, toCheck(billingPolicyRules.approvedByManagement), toCheck(billingPolicyRules.documentPinned));
/**
 * A citation of one policy revision.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PolicyCitation = Schema.Struct({
    policyId: BillingPolicyId,
    revision: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    digest: Sha256,
});
/**
 * Cite a policy revision (digest over its canonical wire form).
 *
 * @since 0.1.0
 * @category constructors
 */
export const citePolicy = (policy) => Effect.gen(function* () {
    const encoded = yield* Schema.encodeEffect(BillingPolicy)(policy);
    const digest = yield* digestValueSync(encoded);
    return { policyId: policy.id, revision: policy.revision, digest };
});
/** A later revision supersedes a citation only once it is approved and in force on the quote date. */
const supersededBy = (policy, policies, quotedOn) => policies.find((entry) => entry.id === policy.id && entry.revision > policy.revision && entry.status === 'approved' && contains(entry, quotedOn));
const supersededIssues = (quote, policy, policies) => {
    const later = supersededBy(policy, policies, quote.quotedOn);
    return later === undefined ? [] : [issue('billing-policy.superseded', 'error', quote.subject, `revision ${policy.revision} has been superseded by approved revision ${later.revision}`)];
};
const citedPolicyIssues = (quote, policy, policies) => [
    ...(policy.owner === quote.issuer ? [] : [issue('billing-policy.owner-mismatch', 'error', quote.subject, 'the cited policy belongs to another entity')]),
    ...(policy.status === 'approved' ? [] : [issue('billing-policy.not-approved', 'error', quote.subject, `the cited policy is ${policy.status}`)]),
    ...(contains(policy, quote.quotedOn) ? [] : [issue('billing-policy.not-in-force', 'error', quote.subject, `the cited policy is not in force on ${quote.quotedOn}`)]),
    ...supersededIssues(quote, policy, policies),
];
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
export const checkPolicyCitation = (quote, policies) => Effect.gen(function* () {
    const citation = quote.citation;
    if (citation === undefined) {
        return quote.quotedBy._tag === 'human'
            ? []
            : [issue('billing-policy.citation-missing', 'error', quote.subject, `a quote drafted by a non-human actor (${quote.quotedBy._tag}) cites the billing policy in force`)];
    }
    const policy = policies.find((entry) => entry.id === citation.policyId && entry.revision === citation.revision);
    if (policy === undefined)
        return [issue('billing-policy.unresolved', 'error', quote.subject, 'the cited policy revision is not in the set')];
    const actual = yield* citePolicy(policy);
    if (actual.digest !== citation.digest)
        return [issue('billing-policy.digest-mismatch', 'error', quote.subject, 'the citation digest does not match the policy revision')];
    return citedPolicyIssues(quote, policy, policies);
});
//# sourceMappingURL=BillingPolicy.js.map