import { issue } from "../core/Issue.js";
/**
 * Codes, severities and the rule each enforces.
 *
 * @since 0.1.0
 * @category constants
 */
export const IssueCodes = {
    'regime.unknown': { severity: 'hold', rule: 'An attribution names a regime the adopter has not declared.' },
    'regime.needs-verification': { severity: 'warning', rule: 'Regime data has not been verified by a human reviewer.' },
    'regime.citation-stale': { severity: 'warning', rule: 'Regime citations were last reviewed longer ago than the staleness window.' },
    'regime.not-effective': { severity: 'error', rule: "The regime's test date falls outside its effective interval." },
    'regime.test-date-unresolved': { severity: 'hold', rule: "The regime's test date cannot be resolved from the facts supplied." },
    'regime.base-not-labour': { severity: 'error', rule: 'The regime is based on receipts, not labour; slices cannot be attributed to it.' },
    'situs.outside-regime': { severity: 'error', rule: "Work was performed outside the regime's jurisdiction." },
    'situs.subdivision-required': { severity: 'hold', rule: 'A sub-national regime needs the subdivision where the work was performed.' },
    'situs.not-foreign': { severity: 'error', rule: 'A foreign-research regime only takes work performed outside its country.' },
    'transfer.does-not-relocate-work': { severity: 'error', rule: 'A transfer leg to a domestic payer does not move where foreign work happened.' },
    'transfer.changes-wage-payer': { severity: 'error', rule: 'A transfer leg recipient is not the wage payer; wage-payer claims stay with the employer.' },
    'transfer.event-missing': { severity: 'warning', rule: 'A transfer leg refers to an event not in the set.' },
    'qre.foreign-research-excluded': { severity: 'error', rule: 'Research performed outside the country is excluded from the research credit.' },
    'qre.funded-research-excluded': { severity: 'error', rule: 'The performer is funded for this work and cannot claim it.' },
    'qre.intra-group-charge-disregarded': { severity: 'error', rule: 'Charges between members of one controlled group are disregarded; no contract research arises.' },
    'qre.post-commercial-excluded': { severity: 'error', rule: 'Work after the component reached commercial readiness is excluded from the credit.' },
    'sre.foreign-risk-rights-unproven': { severity: 'hold', rule: 'A payer of research needs evidence that it bears the risk and holds the rights.' },
    'slice.unknown': { severity: 'error', rule: 'An attribution names a slice not in the set.' },
    'slice.duplicate-id': { severity: 'error', rule: 'Two slices share an id.' },
    'slice.event-missing': { severity: 'hold', rule: 'The labour event a slice was cut from is not in the set.' },
    'slice.event-digest-mismatch': { severity: 'error', rule: 'The slice was cut from a different revision of the event.' },
    'slice.minutes-exceed-event': { severity: 'error', rule: "Slices of one event sum to more than the event's minutes." },
    'slice.quarter-mismatch': { severity: 'error', rule: "The slice quarter is not the work date's calendar quarter." },
    'slice.component-missing': { severity: 'hold', rule: 'A research-candidate slice needs a business component.' },
    'slice.component-unknown': { severity: 'error', rule: 'The slice names a business component not in the set.' },
    'slice.substantiation-weak': { severity: 'warning', rule: 'The slice is reconstructed or estimated rather than contemporaneous.' },
    'slice.attester-not-employer': { severity: 'warning', rule: 'The attesting human was not acting for the employer.' },
    'slice.ai-assistance-alone': { severity: 'hold', rule: 'AI assistance alone never qualifies work; research evidence beyond AI usage is required.' },
    'slice.category-not-eligible': { severity: 'error', rule: "The slice's category on the regime's axis is not eligible." },
    'component.ius-undetermined': { severity: 'hold', rule: 'The internal-use class of the component is undetermined.' },
    'component.internal-use-screen': { severity: 'warning', rule: 'Internal-use software faces additional tests; flag for review.' },
    'component.evidence-missing': { severity: 'hold', rule: 'The component lacks uncertainty, alternatives or experimentation evidence.' },
    'funding.verdicts-not-exclusive': { severity: 'error', rule: 'Performer and payer verdicts contradict each other.' },
    'funding.verdict-without-decision': { severity: 'error', rule: 'A funding verdict other than undetermined must cite a human decision.' },
    'funding.payer-candidate-unsupported': { severity: 'error', rule: 'A payer contract-research candidate needs a prior agreement and payer risk.' },
    'funding.verdict-contradicts-facts': { severity: 'warning', rule: 'The performer verdict contradicts the recorded test answers.' },
    'funding.assessment-missing': { severity: 'hold', rule: 'Work billed to another party needs a funding assessment.' },
    'funding.parties-mismatch': { severity: 'error', rule: 'The funding assessment names different performer or payer entities.' },
    'funding.undetermined': { severity: 'hold', rule: 'The funding verdict is undetermined or partial.' },
    'funding.payer-not-candidate': { severity: 'error', rule: 'The funding assessment gives the payer no contract research.' },
    'attribution.double-claim': { severity: 'error', rule: 'More than one claimant per (event, digest, slice, regime).' },
    'attribution.basis-not-allowed': { severity: 'error', rule: 'The regime does not admit claims on this basis.' },
    'attribution.wage-payer-mismatch': { severity: 'error', rule: 'A wage-payer claimant must be the employer named on the event.' },
    'attribution.tax-year-mismatch': { severity: 'error', rule: "The attribution's tax year is not the claimant's taxable year containing the work date." },
    'attribution.event-mismatch': { severity: 'error', rule: 'The attribution cites a different event or digest from its slice.' },
    'attribution.no-transfer': { severity: 'error', rule: 'A non-employer claimant needs a transfer leg of the event to it.' },
    'claimant.profile-missing': { severity: 'hold', rule: 'The claimant has no tax profile in the set.' },
    'claimant.outside-jurisdiction': { severity: 'error', rule: "The claimant is not a taxpayer of the regime's country." },
    'claimant.registration-unproven': { severity: 'hold', rule: 'The regime requires a registration the claimant has not evidenced.' },
    'group.unverified': { severity: 'hold', rule: 'The controlled group is undetermined; group-level outputs wait.' },
    'group.context-missing': { severity: 'hold', rule: 'A group-level regime needs a controlled-group context for the year.' },
    'group.context-mismatch': { severity: 'error', rule: 'The cited controlled group does not cover the claimant and year.' },
    'base-period.unknown': { severity: 'hold', rule: 'A base-period year is unknown; it is never treated as zero.' },
    'cost-base.unknown': { severity: 'hold', rule: 'A wage cost base is unknown for a person in the pool.' },
    'cost-base.not-wages': { severity: 'warning', rule: "A payer's cost is a charge, not wages; it is not computed here." },
};
/**
 * Raise an issue with the catalogued severity.
 *
 * @since 0.1.0
 * @category constructors
 */
export const raise = (code, subject, message) => issue(code, IssueCodes[code].severity, subject, message);
/**
 * Whether an issue blocks a candidate (error or hold).
 *
 * @since 0.1.0
 * @category predicates
 */
export const blocks = (entry) => entry.severity !== 'warning';
//# sourceMappingURL=IssueCode.js.map