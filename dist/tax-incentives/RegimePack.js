/**
 * Example regime data pack: US federal research credit and research
 * expenditure rules, the Pennsylvania research credit, India's s. 35 scientific
 * research deduction and Pakistan's reduced final tax on IT export proceeds.
 *
 * Every regime is `needs-verification`. Rates, dates and conditions are
 * illustrative data with citations for a reviewer to confirm; adopters pin,
 * override or extend them in private configuration. Nothing here is advice.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { IncentiveRegime } from "./IncentiveRegime.js";
/**
 * Stable ids of the example regimes.
 *
 * @since 0.1.0
 * @category constants
 */
export const ExampleRegimeIds = {
    usIrc41: '01920000-0000-7000-8000-000000000041',
    usIrc174A: '01920000-0000-7000-8000-00000000174a',
    usIrc174Foreign: '01920000-0000-7000-8000-00000000174f',
    usPaResearchCredit: '01920000-0000-7000-8000-00000000a001',
    inSection35: '01920000-0000-7000-8000-000000000035',
    pkSection154A: '01920000-0000-7000-8000-00000000154a',
};
const REVIEWED_ON = '2026-10-09';
const NEEDS_VERIFICATION = { _tag: 'needs-verification' };
const US = { country: 'US' };
const usIrc41 = {
    id: ExampleRegimeIds.usIrc41,
    code: 'us.irc41',
    title: 'Credit for increasing research activities',
    jurisdiction: US,
    workSitus: 'within',
    kind: 'credit',
    axis: 'qre',
    categories: ['wages', 'supplies', 'contract-research', 'computer-use'],
    claimantBases: ['wage-payer', 'risk-bearer'],
    aggregation: 'controlled-group',
    effective: { validFrom: '2015-01-01' },
    testDate: 'claimant-taxable-year-start',
    parameters: [
        { key: 'regular-credit-rate', value: '0.2', unit: 'ratio', citation: '26 U.S.C. § 41(a)(1)' },
        { key: 'asc-rate', value: '0.14', unit: 'ratio', citation: '26 U.S.C. § 41(c)(4)' },
        { key: 'contract-research-pct', value: '0.65', unit: 'ratio', citation: '26 U.S.C. § 41(b)(3)(A)' },
    ],
    costBase: { includedWageKinds: ['us-3401-box1'], source: 'Wages as defined in 26 U.S.C. § 3401(a) (Form W-2 box 1), per § 41(b)(2)(D); no employer tax, benefits or overhead' },
    basePeriodYears: 3,
    citations: [
        { source: 'statute', locator: '26 U.S.C. § 41(a)–(d), (f)', url: 'https://www.law.cornell.edu/uscode/text/26/41' },
        { source: 'regulation', locator: 'Treas. Reg. §§ 1.41-2, 1.41-4, 1.41-4A(d), 1.41-6(i)', url: 'https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1' },
        { source: 'form-instructions', locator: 'Instructions for Form 6765', url: 'https://www.irs.gov/forms-pubs/about-form-6765' },
    ],
    notes: [
        'Research conducted outside the United States (§ 41(d)(4)(F)) and funded research (§ 41(d)(4)(H)) are excluded.',
        'Members of a § 41(f) controlled group are treated as a single taxpayer; charges between members are disregarded.',
        'The four-part test of § 41(d)(1) applies per business component; AI assistance does not by itself make work qualified research.',
    ],
    reviewedOn: REVIEWED_ON,
    status: NEEDS_VERIFICATION,
};
const usIrc174A = {
    id: ExampleRegimeIds.usIrc174A,
    code: 'us.irc174a',
    title: 'Domestic research or experimental expenditures',
    jurisdiction: US,
    workSitus: 'within',
    kind: 'deduction',
    axis: 'sre',
    categories: ['software-development', 'research-experimental'],
    claimantBases: ['wage-payer', 'cost-bearer'],
    aggregation: 'entity',
    effective: { validFrom: '2025-01-01' },
    testDate: 'claimant-taxable-year-start',
    parameters: [],
    costBase: { includedWageKinds: ['us-3401-box1', 'benefits', 'employer-tax', 'overhead'], source: 'Direct and allocable indirect costs of domestic research (needs verification against final guidance)' },
    basePeriodYears: 0,
    citations: [
        { source: 'statute', locator: '26 U.S.C. § 174A', url: 'https://www.law.cornell.edu/uscode/text/26/174A' },
        { source: 'public-law', locator: 'Pub. L. 119-21, § 70302' },
    ],
    notes: ['Applies to taxable years beginning after 31 December 2024.', 'All software development is a research or experimental expenditure for this purpose, including routine development.'],
    reviewedOn: REVIEWED_ON,
    status: NEEDS_VERIFICATION,
};
const usIrc174Foreign = {
    id: ExampleRegimeIds.usIrc174Foreign,
    code: 'us.irc174-foreign',
    title: 'Foreign research or experimental expenditures (15-year amortisation)',
    jurisdiction: US,
    workSitus: 'outside',
    kind: 'amortisation',
    axis: 'sre',
    categories: ['software-development', 'research-experimental'],
    claimantBases: ['wage-payer', 'cost-bearer', 'risk-bearer', 'rights-holder'],
    aggregation: 'entity',
    effective: { validFrom: '2022-01-01' },
    testDate: 'claimant-taxable-year-start',
    parameters: [{ key: 'amortisation-months', value: '180', unit: 'months', citation: '26 U.S.C. § 174(a)(2)(B)' }],
    costBase: { includedWageKinds: ['us-3401-box1', 'benefits', 'employer-tax', 'overhead'], source: 'Direct and allocable indirect costs of foreign research' },
    basePeriodYears: 0,
    citations: [
        { source: 'statute', locator: '26 U.S.C. § 174(a)', url: 'https://www.law.cornell.edu/uscode/text/26/174' },
        { source: 'notice', locator: 'Notice 2023-63', url: 'https://www.irs.gov/pub/irs-drop/n-23-63.pdf' },
    ],
    notes: [
        'Research performed outside the United States is amortised over 15 years from the midpoint of the taxable year.',
        'A US recipient of a charge for foreign research is a candidate only if it bears the financial risk of failure and holds the rights to the results; a US invoice does not relocate the work.',
    ],
    reviewedOn: REVIEWED_ON,
    status: NEEDS_VERIFICATION,
};
const usPaResearchCredit = {
    id: ExampleRegimeIds.usPaResearchCredit,
    code: 'us-pa.rd-credit',
    title: 'Pennsylvania research and development tax credit',
    jurisdiction: { country: 'US', subdivision: 'US-PA' },
    workSitus: 'within',
    kind: 'credit',
    axis: 'qre',
    categories: ['wages', 'supplies', 'contract-research'],
    claimantBases: ['wage-payer', 'risk-bearer'],
    aggregation: 'entity',
    effective: { validFrom: '2015-01-01' },
    testDate: 'claimant-taxable-year-start',
    parameters: [
        { key: 'credit-rate', value: '0.1', unit: 'ratio' },
        { key: 'small-business-credit-rate', value: '0.2', unit: 'ratio' },
        { key: 'carryforward-years', value: '15', unit: 'years' },
    ],
    costBase: { includedWageKinds: ['us-3401-box1'], source: 'Federal § 41 wage definitions applied to research performed in Pennsylvania' },
    basePeriodYears: 4,
    citations: [
        { source: 'statute', locator: 'Tax Reform Code of 1971, Article XVII-B (72 P.S. § 8701-B et seq.)' },
        { source: 'official-guidance', locator: 'Department of Community and Economic Development, Research and Development Tax Credit program guidelines', url: 'https://dced.pa.gov/programs/research-and-development-rd-tax-credit/' },
    ],
    notes: [
        'Only research performed in Pennsylvania counts; Pennsylvania and non-Pennsylvania amounts must reconcile to the federal claim.',
        'The claimant must be the applicant by the application deadline; the base-period definition needs verification.',
    ],
    reviewedOn: REVIEWED_ON,
    status: NEEDS_VERIFICATION,
};
const inSection35 = {
    id: ExampleRegimeIds.inSection35,
    code: 'in.s35',
    title: 'Deduction for expenditure on scientific research',
    jurisdiction: { country: 'IN' },
    workSitus: 'within',
    kind: 'deduction',
    axis: 'sre',
    categories: ['research-experimental', 'wages'],
    claimantBases: ['wage-payer', 'cost-bearer'],
    aggregation: 'entity',
    effective: { validFrom: '2020-04-01', validTo: '2026-04-01' },
    testDate: 'claimant-taxable-year-start',
    parameters: [{ key: 'weighted-deduction-pct', value: '1', unit: 'ratio', citation: 'Income-tax Act, 1961, s. 35(2AB)' }],
    costBase: { includedWageKinds: ['foreign-local-payroll', 'statutory', 'bonus'], source: 'Salaries of research staff as reported for the approved facility' },
    basePeriodYears: 0,
    requiresRegistration: 'dsir-in-house-approval',
    citations: [
        { source: 'statute', locator: 'Income-tax Act, 1961, s. 35(1)(i) and s. 35(2AB)', url: 'https://incometaxindia.gov.in' },
        { source: 'statute', locator: 'Income-tax Act, 1961, s. 115BAA' },
        { source: 'statute', locator: 'Income-tax Act, 2025 (in force from 1 April 2026; renumbered provisions)' },
    ],
    notes: [
        'History: the s. 35(2AB) weighted deduction was 200%, reduced to 150% from FY 2017-18 and to 100% from FY 2020-21.',
        'A company that opts for the s. 115BAA concessional rate forgoes s. 35(2AB) and other specified deductions; that choice is a human decision.',
        'From 1 April 2026 the Income-tax Act, 2025 replaces the 1961 Act; citations must be mapped to the new section numbers.',
    ],
    reviewedOn: REVIEWED_ON,
    status: NEEDS_VERIFICATION,
};
const pkSection154A = {
    id: ExampleRegimeIds.pkSection154A,
    code: 'pk.s154a',
    title: 'Reduced final tax on export proceeds of IT and IT-enabled services',
    jurisdiction: { country: 'PK' },
    workSitus: 'not-applicable',
    kind: 'reduced-rate',
    axis: 'export-proceeds',
    categories: ['export-proceeds'],
    claimantBases: ['registered-exporter'],
    aggregation: 'entity',
    effective: { validFrom: '2021-07-01' },
    testDate: 'claimant-taxable-year-start',
    parameters: [{ key: 'final-tax-rate', value: '0.0025', unit: 'ratio', citation: 'Income Tax Ordinance, 2001, s. 154A (rate set by the Finance Act of each year)' }],
    basePeriodYears: 0,
    requiresRegistration: 'pseb-registration',
    citations: [
        { source: 'statute', locator: 'Income Tax Ordinance, 2001, s. 154A', url: 'https://www.fbr.gov.pk' },
        { source: 'official-guidance', locator: 'Pakistan Software Export Board registration', url: 'https://www.pseb.org.pk' },
    ],
    notes: [
        'The rate and conditions change with each Finance Act and must be confirmed for the tax year concerned.',
        'Proceeds must be realised in foreign exchange through normal banking channels; netting or third-party settlement can disqualify them.',
        'The earlier Second Schedule exemption is historical; provincial sales tax on IT exports is not modelled.',
    ],
    reviewedOn: REVIEWED_ON,
    status: NEEDS_VERIFICATION,
};
/**
 * Decode the example pack. Evaluated on call so importing the module costs nothing.
 *
 * @since 0.1.0
 * @category data
 */
export const examplePack = () => Schema.decodeUnknownSync(Schema.Array(IncentiveRegime))([usIrc41, usIrc174A, usIrc174Foreign, usPaResearchCredit, inSection35, pkSection154A]);
//# sourceMappingURL=RegimePack.js.map