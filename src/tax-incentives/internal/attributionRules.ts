/**
 * Per-attribution screening rules. Each rule is a small pure function over an
 * attribution context returning zero or more issues.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue } from '../../core/Issue.ts';
import { contains } from '../../core/Temporal.ts';

import { hasProcessEvidence } from '../BusinessComponent.ts';
import type { ClaimantAttribution } from '../ClaimantAttribution.ts';
import { groupContaining } from '../ControlledGroupYear.ts';
import type { EntityTaxProfile } from '../EntityTaxProfile.ts';
import { payerBearsRiskAndHoldsRights } from '../FundingAssessment.ts';
import type { IncentiveRegime } from '../IncentiveRegime.ts';
import type { SetIndex } from '../IncentiveSet.ts';
import { raise } from '../IssueCode.ts';
import type { LabourFact } from '../LabourFact.ts';
import { categoryOn, type TaxActivitySlice } from '../TaxActivitySlice.ts';
import { containing } from '../TaxYear.ts';

/** @since 0.1.0 @category models */
export interface AttributionContext {
  readonly index: SetIndex;
  readonly attribution: ClaimantAttribution;
  readonly regime: IncentiveRegime;
  readonly slice: TaxActivitySlice;
  readonly labour: LabourFact;
  readonly claimant: EntityTaxProfile;
  readonly subject: string;
}

type Rule = (context: AttributionContext) => ReadonlyArray<ValidationIssue>;
type LabourAxis = 'qre' | 'sre';

const none: ReadonlyArray<ValidationIssue> = [];
const labourAxis = (regime: IncentiveRegime): LabourAxis | undefined => (regime.axis === 'export-proceeds' ? undefined : regime.axis);
const isEmployer = (context: AttributionContext): boolean => context.attribution.claimant === context.labour.employer;
const receivesLeg = (context: AttributionContext): boolean =>
  (context.index.transfersByEvent.get(context.labour.eventId) ?? []).some((transfer) => transfer.toEntity === context.attribution.claimant);

const foreignWorkCode = (context: AttributionContext): 'qre.foreign-research-excluded' | 'transfer.does-not-relocate-work' | 'situs.outside-regime' => {
  if (context.regime.axis === 'qre') return 'qre.foreign-research-excluded';
  return !isEmployer(context) && receivesLeg(context) ? 'transfer.does-not-relocate-work' : 'situs.outside-regime';
};

const situsRule: Rule = (context) => {
  const { regime, labour, subject } = context;
  const inCountry = labour.situs.country === regime.jurisdiction.country;
  const where = labour.situs.subdivision ?? labour.situs.country;
  if (regime.workSitus === 'outside') return inCountry ? [raise('situs.not-foreign', subject, `${regime.code} takes only work performed outside ${regime.jurisdiction.country}; work was in ${where}`)] : none;
  if (!inCountry) return [raise(foreignWorkCode(context), subject, `work performed in ${where} cannot count for ${regime.code}`)];
  const required = regime.jurisdiction.subdivision;
  if (required === undefined) return none;
  if (labour.situs.subdivision === undefined) return [raise('situs.subdivision-required', subject, `${regime.code} needs the work subdivision; the event records only ${labour.situs.country}`)];
  return labour.situs.subdivision === required ? none : [raise('situs.outside-regime', subject, `work in ${labour.situs.subdivision} is outside ${required}`)];
};

const resolveTestDate = (context: AttributionContext): string | undefined => {
  switch (context.regime.testDate) {
    case 'work-date':
      return context.labour.workDate;
    case 'claimant-taxable-year-start':
      return containing(context.claimant.fiscalYearEndMonth, context.labour.workDate).start;
    case 'unit-start':
    case 'cost-paid':
      return undefined;
  }
};

const effectiveRule: Rule = (context) => {
  const date = resolveTestDate(context);
  if (date === undefined) return [raise('regime.test-date-unresolved', context.subject, `${context.regime.code} tests ${context.regime.testDate}, which the facts do not supply`)];
  return contains(context.regime.effective, date) ? none : [raise('regime.not-effective', context.subject, `${context.regime.code} is not effective on its test date ${date} (${context.regime.testDate})`)];
};

const taxYearRule: Rule = (context) => {
  const expected = containing(context.claimant.fiscalYearEndMonth, context.labour.workDate).label;
  return context.attribution.taxYear === expected ? none : [raise('attribution.tax-year-mismatch', context.subject, `work on ${context.labour.workDate} falls in the claimant's taxable year ${expected}, not ${context.attribution.taxYear}`)];
};

const categoryRule: Rule = (context) => {
  const axis = labourAxis(context.regime);
  if (axis === undefined || categoryOn(context.slice, axis) !== undefined) return none;
  return [raise('slice.category-not-eligible', context.subject, `slice is not eligible on the ${axis} axis of ${context.regime.code}`)];
};

const basisRule: Rule = (context) => {
  const allowed: ReadonlyArray<string> = context.regime.claimantBases;
  return allowed.includes(context.attribution.basis) ? none : [raise('attribution.basis-not-allowed', context.subject, `${context.regime.code} does not admit ${context.attribution.basis} claims`)];
};

const jurisdictionRule: Rule = (context) =>
  context.claimant.situs.country === context.regime.jurisdiction.country
    ? none
    : [raise('claimant.outside-jurisdiction', context.subject, `claimant is resident in ${context.claimant.situs.country}, not ${context.regime.jurisdiction.country}`)];

const wagePayerRule: Rule = (context) => {
  if (context.attribution.basis !== 'wage-payer' || isEmployer(context)) return none;
  const code = receivesLeg(context) ? 'transfer.changes-wage-payer' : 'attribution.wage-payer-mismatch';
  return [raise(code, context.subject, `the wage payer for the event is ${context.labour.employer}, not ${context.attribution.claimant}`)];
};

const payerFundingIssues = (context: AttributionContext): ReadonlyArray<ValidationIssue> => {
  const id = context.attribution.fundingAssessmentId;
  const assessment = id === undefined ? undefined : context.index.fundings.get(id);
  const axis = labourAxis(context.regime);
  if (assessment === undefined) {
    return axis === 'sre'
      ? [raise('sre.foreign-risk-rights-unproven', context.subject, 'no funding assessment shows the payer bears the risk and holds the rights')]
      : [raise('funding.assessment-missing', context.subject, 'a payer claim needs a funding assessment of the agreement')];
  }
  if (assessment.performer !== context.labour.employer || assessment.payer !== context.attribution.claimant) return [raise('funding.parties-mismatch', context.subject, 'funding assessment parties differ from the employer and claimant')];
  if (axis === 'sre') return payerBearsRiskAndHoldsRights(assessment) ? none : [raise('sre.foreign-risk-rights-unproven', context.subject, 'the assessment does not show payer risk and payer rights')];
  if (assessment.payerVerdict === 'contract-research-candidate') return none;
  return assessment.payerVerdict === 'undetermined'
    ? [raise('funding.undetermined', context.subject, 'the payer verdict is undetermined')]
    : [raise('funding.payer-not-candidate', context.subject, 'the funding assessment gives the payer no contract research')];
};

const payerRule: Rule = (context) => {
  if (context.attribution.basis === 'wage-payer' || isEmployer(context)) return none;
  if (!receivesLeg(context)) return [raise('attribution.no-transfer', context.subject, `no transfer leg of the event reaches ${context.attribution.claimant}`)];
  const group = groupContaining(context.index.set.groups, context.attribution.taxYear, [context.labour.employer, context.attribution.claimant]);
  if (context.regime.axis === 'qre' && group?.status === 'established') return [raise('qre.intra-group-charge-disregarded', context.subject, 'performer and payer are one controlled group; the charge is disregarded')];
  if (context.regime.axis === 'qre' && group?.status === 'undetermined') return [raise('group.unverified', context.subject, 'whether performer and payer are one controlled group is undetermined')];
  return payerFundingIssues(context);
};

const outboundFundingIssue = (context: AttributionContext, toEntity: string, agreementId: string | undefined): ReadonlyArray<ValidationIssue> => {
  const group = groupContaining(context.index.set.groups, context.attribution.taxYear, [context.labour.employer, toEntity]);
  if (group?.status === 'established') return none;
  if (group?.status === 'undetermined') return [raise('group.unverified', context.subject, `whether ${toEntity} is in the performer's controlled group is undetermined`)];
  const assessment = context.index.set.fundings.find((entry) => entry.agreementId === agreementId && entry.performer === context.labour.employer);
  if (agreementId === undefined || assessment === undefined) return [raise('funding.assessment-missing', context.subject, `work billed to ${toEntity} needs a funding assessment`)];
  if (assessment.performerVerdict === 'not-funded') return none;
  if (assessment.performerVerdict === 'funded') return [raise('qre.funded-research-excluded', context.subject, `the performer is funded by ${toEntity} for this work`)];
  return [raise('funding.undetermined', context.subject, `performer funding verdict is ${assessment.performerVerdict}`)];
};

const performerFundingRule: Rule = (context) => {
  if (context.regime.axis !== 'qre' || !isEmployer(context)) return none;
  const outbound = (context.index.transfersByEvent.get(context.labour.eventId) ?? []).filter((transfer) => transfer.fromEntity === context.labour.employer);
  return outbound.flatMap((transfer) => outboundFundingIssue(context, transfer.toEntity, transfer.agreementId));
};

const componentRule: Rule = (context) => {
  const id = context.slice.businessComponentId;
  const component = id === undefined ? undefined : context.index.components.get(id);
  if (context.regime.axis !== 'qre' || component === undefined || categoryOn(context.slice, 'qre') === undefined) return none;
  const ready = component.commercialReadinessDate;
  if (ready !== undefined && context.labour.workDate >= ready) return [raise('qre.post-commercial-excluded', context.subject, `work on ${context.labour.workDate} follows commercial readiness on ${ready}`)];
  const issues: Array<ValidationIssue> = [];
  if (component.internalUseClass === 'undetermined') issues.push(raise('component.ius-undetermined', context.subject, `internal-use class of ${component.name} is undetermined`));
  if (component.internalUseClass === 'internal-use') issues.push(raise('component.internal-use-screen', context.subject, `${component.name} is internal-use software; additional tests apply`));
  if (!hasProcessEvidence(component)) issues.push(raise('component.evidence-missing', context.subject, `${component.name} lacks uncertainty, alternatives or experimentation evidence`));
  return issues;
};

const aiRule: Rule = (context) => {
  if (context.regime.axis !== 'qre' || context.slice.qreCategory !== 'qualified-research' || !context.labour.aiAssisted) return none;
  const independent = context.slice.evidence.some((entry) => !entry.kind.startsWith('ai-'));
  return independent ? none : [raise('slice.ai-assistance-alone', context.subject, 'AI-assisted work needs research evidence beyond AI usage records')];
};

const registrationRule: Rule = (context) => {
  const kind = context.regime.requiresRegistration;
  if (kind === undefined) return none;
  const held = context.claimant.registrations.some((entry) => entry.kind === kind && entry.evidence.length > 0 && contains(entry, context.labour.workDate));
  return held ? none : [raise('claimant.registration-unproven', context.subject, `${context.regime.code} requires ${kind} on ${context.labour.workDate}`)];
};

const groupRule: Rule = (context) => {
  if (context.regime.aggregation !== 'controlled-group') return none;
  const ref = context.attribution.controlledGroupRef;
  const group = ref === undefined ? undefined : context.index.groups.get(ref);
  if (group === undefined) return [raise('group.context-missing', context.subject, `${context.regime.code} is tested at group level; cite the controlled group for ${context.attribution.taxYear}`)];
  if (group.taxYear !== context.attribution.taxYear || !group.members.some((member) => member === context.attribution.claimant)) {
    return [raise('group.context-mismatch', context.subject, 'the cited controlled group does not cover the claimant and year')];
  }
  return group.status === 'established' ? none : [raise('group.unverified', context.subject, `controlled group for ${group.taxYear} is undetermined`)];
};

const rules: ReadonlyArray<Rule> = [
  situsRule,
  effectiveRule,
  taxYearRule,
  categoryRule,
  basisRule,
  jurisdictionRule,
  wagePayerRule,
  payerRule,
  performerFundingRule,
  componentRule,
  aiRule,
  registrationRule,
  groupRule,
];

type Resolved = { readonly _tag: 'context'; readonly context: AttributionContext } | { readonly _tag: 'issues'; readonly issues: ReadonlyArray<ValidationIssue> };

const stop = (issues: ReadonlyArray<ValidationIssue>): Resolved => ({ _tag: 'issues', issues });

const resolveContext = (index: SetIndex, attribution: ClaimantAttribution): Resolved => {
  const subject = `attribution:${attribution.id}`;
  const regime = index.regimes.get(attribution.regimeId);
  if (regime === undefined) return stop([raise('regime.unknown', subject, `regime ${attribution.regimeId} is not declared`)]);
  if (regime.axis === 'export-proceeds') return stop([raise('regime.base-not-labour', subject, `${regime.code} is based on export proceeds, not labour`)]);
  const slice = index.slices.get(attribution.sliceId);
  if (slice === undefined) return stop([raise('slice.unknown', subject, `slice ${attribution.sliceId} is not in the set`)]);
  if (slice.eventId !== attribution.eventId || slice.eventDigest !== attribution.eventDigest) return stop([raise('attribution.event-mismatch', subject, 'attribution and slice cite different events or digests')]);
  const labour = index.labour.get(slice.eventId);
  if (labour === undefined) return stop([raise('slice.event-missing', subject, `event ${slice.eventId} is not in the set`)]);
  const claimant = index.entities.get(attribution.claimant);
  if (claimant === undefined) return stop([raise('claimant.profile-missing', subject, `claimant ${attribution.claimant} has no tax profile`)]);
  return { _tag: 'context', context: { index, attribution, regime, slice, labour, claimant, subject } };
};

/**
 * Screen one attribution.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenAttribution = (index: SetIndex, attribution: ClaimantAttribution): ReadonlyArray<ValidationIssue> => {
  const resolved = resolveContext(index, attribution);
  if (resolved._tag === 'issues') return resolved.issues;
  return rules.flatMap((rule) => rule(resolved.context));
};
