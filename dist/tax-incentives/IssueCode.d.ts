/**
 * Invariant catalogue for incentive screening. Every issue the package emits
 * has a stable code and a fixed severity; conformance vectors refer to these.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue } from '../core/Issue.ts';
/**
 * Codes, severities and the rule each enforces.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const IssueCodes: {
    readonly 'regime.unknown': {
        readonly severity: "hold";
        readonly rule: "An attribution names a regime the adopter has not declared.";
    };
    readonly 'regime.needs-verification': {
        readonly severity: "warning";
        readonly rule: "Regime data has not been verified by a human reviewer.";
    };
    readonly 'regime.citation-stale': {
        readonly severity: "warning";
        readonly rule: "Regime citations were last reviewed longer ago than the staleness window.";
    };
    readonly 'regime.not-effective': {
        readonly severity: "error";
        readonly rule: "The regime's test date falls outside its effective interval.";
    };
    readonly 'regime.test-date-unresolved': {
        readonly severity: "hold";
        readonly rule: "The regime's test date cannot be resolved from the facts supplied.";
    };
    readonly 'regime.base-not-labour': {
        readonly severity: "error";
        readonly rule: "The regime is based on receipts, not labour; slices cannot be attributed to it.";
    };
    readonly 'situs.outside-regime': {
        readonly severity: "error";
        readonly rule: "Work was performed outside the regime's jurisdiction.";
    };
    readonly 'situs.subdivision-required': {
        readonly severity: "hold";
        readonly rule: "A sub-national regime needs the subdivision where the work was performed.";
    };
    readonly 'situs.not-foreign': {
        readonly severity: "error";
        readonly rule: "A foreign-research regime only takes work performed outside its country.";
    };
    readonly 'transfer.does-not-relocate-work': {
        readonly severity: "error";
        readonly rule: "A transfer leg to a domestic payer does not move where foreign work happened.";
    };
    readonly 'transfer.changes-wage-payer': {
        readonly severity: "error";
        readonly rule: "A transfer leg recipient is not the wage payer; wage-payer claims stay with the employer.";
    };
    readonly 'transfer.event-missing': {
        readonly severity: "warning";
        readonly rule: "A transfer leg refers to an event not in the set.";
    };
    readonly 'qre.foreign-research-excluded': {
        readonly severity: "error";
        readonly rule: "Research performed outside the country is excluded from the research credit.";
    };
    readonly 'qre.funded-research-excluded': {
        readonly severity: "error";
        readonly rule: "The performer is funded for this work and cannot claim it.";
    };
    readonly 'qre.intra-group-charge-disregarded': {
        readonly severity: "error";
        readonly rule: "Charges between members of one controlled group are disregarded; no contract research arises.";
    };
    readonly 'qre.post-commercial-excluded': {
        readonly severity: "error";
        readonly rule: "Work after the component reached commercial readiness is excluded from the credit.";
    };
    readonly 'sre.foreign-risk-rights-unproven': {
        readonly severity: "hold";
        readonly rule: "A payer of research needs evidence that it bears the risk and holds the rights.";
    };
    readonly 'slice.unknown': {
        readonly severity: "error";
        readonly rule: "An attribution names a slice not in the set.";
    };
    readonly 'slice.duplicate-id': {
        readonly severity: "error";
        readonly rule: "Two slices share an id.";
    };
    readonly 'slice.event-missing': {
        readonly severity: "hold";
        readonly rule: "The labour event a slice was cut from is not in the set.";
    };
    readonly 'slice.event-digest-mismatch': {
        readonly severity: "error";
        readonly rule: "The slice was cut from a different revision of the event.";
    };
    readonly 'slice.minutes-exceed-event': {
        readonly severity: "error";
        readonly rule: "Slices of one event sum to more than the event's minutes.";
    };
    readonly 'slice.quarter-mismatch': {
        readonly severity: "error";
        readonly rule: "The slice quarter is not the work date's calendar quarter.";
    };
    readonly 'slice.component-missing': {
        readonly severity: "hold";
        readonly rule: "A research-candidate slice needs a business component.";
    };
    readonly 'slice.component-unknown': {
        readonly severity: "error";
        readonly rule: "The slice names a business component not in the set.";
    };
    readonly 'slice.substantiation-weak': {
        readonly severity: "warning";
        readonly rule: "The slice is reconstructed or estimated rather than contemporaneous.";
    };
    readonly 'slice.attester-not-employer': {
        readonly severity: "warning";
        readonly rule: "The attesting human was not acting for the employer.";
    };
    readonly 'slice.ai-assistance-alone': {
        readonly severity: "hold";
        readonly rule: "AI assistance alone never qualifies work; research evidence beyond AI usage is required.";
    };
    readonly 'slice.category-not-eligible': {
        readonly severity: "error";
        readonly rule: "The slice's category on the regime's axis is not eligible.";
    };
    readonly 'component.ius-undetermined': {
        readonly severity: "hold";
        readonly rule: "The internal-use class of the component is undetermined.";
    };
    readonly 'component.internal-use-screen': {
        readonly severity: "warning";
        readonly rule: "Internal-use software faces additional tests; flag for review.";
    };
    readonly 'component.evidence-missing': {
        readonly severity: "hold";
        readonly rule: "The component lacks uncertainty, alternatives or experimentation evidence.";
    };
    readonly 'funding.verdicts-not-exclusive': {
        readonly severity: "error";
        readonly rule: "Performer and payer verdicts contradict each other.";
    };
    readonly 'funding.verdict-without-decision': {
        readonly severity: "error";
        readonly rule: "A funding verdict other than undetermined must cite a human decision.";
    };
    readonly 'funding.payer-candidate-unsupported': {
        readonly severity: "error";
        readonly rule: "A payer contract-research candidate needs a prior agreement and payer risk.";
    };
    readonly 'funding.verdict-contradicts-facts': {
        readonly severity: "warning";
        readonly rule: "The performer verdict contradicts the recorded test answers.";
    };
    readonly 'funding.assessment-missing': {
        readonly severity: "hold";
        readonly rule: "Work billed to another party needs a funding assessment.";
    };
    readonly 'funding.parties-mismatch': {
        readonly severity: "error";
        readonly rule: "The funding assessment names different performer or payer entities.";
    };
    readonly 'funding.undetermined': {
        readonly severity: "hold";
        readonly rule: "The funding verdict is undetermined or partial.";
    };
    readonly 'funding.payer-not-candidate': {
        readonly severity: "error";
        readonly rule: "The funding assessment gives the payer no contract research.";
    };
    readonly 'attribution.double-claim': {
        readonly severity: "error";
        readonly rule: "More than one claimant per (event, digest, slice, regime).";
    };
    readonly 'attribution.basis-not-allowed': {
        readonly severity: "error";
        readonly rule: "The regime does not admit claims on this basis.";
    };
    readonly 'attribution.wage-payer-mismatch': {
        readonly severity: "error";
        readonly rule: "A wage-payer claimant must be the employer named on the event.";
    };
    readonly 'attribution.tax-year-mismatch': {
        readonly severity: "error";
        readonly rule: "The attribution's tax year is not the claimant's taxable year containing the work date.";
    };
    readonly 'attribution.event-mismatch': {
        readonly severity: "error";
        readonly rule: "The attribution cites a different event or digest from its slice.";
    };
    readonly 'attribution.no-transfer': {
        readonly severity: "error";
        readonly rule: "A non-employer claimant needs a transfer leg of the event to it.";
    };
    readonly 'claimant.profile-missing': {
        readonly severity: "hold";
        readonly rule: "The claimant has no tax profile in the set.";
    };
    readonly 'claimant.outside-jurisdiction': {
        readonly severity: "error";
        readonly rule: "The claimant is not a taxpayer of the regime's country.";
    };
    readonly 'claimant.registration-unproven': {
        readonly severity: "hold";
        readonly rule: "The regime requires a registration the claimant has not evidenced.";
    };
    readonly 'group.unverified': {
        readonly severity: "hold";
        readonly rule: "The controlled group is undetermined; group-level outputs wait.";
    };
    readonly 'group.context-missing': {
        readonly severity: "hold";
        readonly rule: "A group-level regime needs a controlled-group context for the year.";
    };
    readonly 'group.context-mismatch': {
        readonly severity: "error";
        readonly rule: "The cited controlled group does not cover the claimant and year.";
    };
    readonly 'base-period.unknown': {
        readonly severity: "hold";
        readonly rule: "A base-period year is unknown; it is never treated as zero.";
    };
    readonly 'cost-base.unknown': {
        readonly severity: "hold";
        readonly rule: "A wage cost base is unknown for a person in the pool.";
    };
    readonly 'cost-base.not-wages': {
        readonly severity: "warning";
        readonly rule: "A payer's cost is a charge, not wages; it is not computed here.";
    };
};
/** @since 0.1.0 @category models */
export type IssueCode = keyof typeof IssueCodes;
/**
 * Raise an issue with the catalogued severity.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const raise: (code: IssueCode, subject: string, message: string) => ValidationIssue;
/**
 * Whether an issue blocks a candidate (error or hold).
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const blocks: (entry: ValidationIssue) => boolean;
//# sourceMappingURL=IssueCode.d.ts.map