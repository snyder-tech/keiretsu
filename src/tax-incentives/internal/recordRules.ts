import { actsForEntity } from '../../core/PartyRef.ts';
/**
 * Record-level screening rules: regimes, slices, funding assessments,
 * transfers and attribution uniqueness.
 *
 * @since 0.1.0
 * @module
 */
import type { ValidationIssue } from '../../core/Issue.ts';

import { type ClaimantAttribution, uniquenessKey } from '../ClaimantAttribution.ts';
import { type FundingAssessment, verdictsExclusive } from '../FundingAssessment.ts';
import type { IncentiveRegime } from '../IncentiveRegime.ts';
import type { SetIndex } from '../IncentiveSet.ts';
import { raise } from '../IssueCode.ts';
import { isResearchCandidate, type TaxActivitySlice } from '../TaxActivitySlice.ts';
import { calendarQuarter } from '../TaxYear.ts';

const DAY_MS = 86_400_000;
const none: ReadonlyArray<ValidationIssue> = [];

/**
 * Regime data checks: verification status and citation staleness.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenRegime = (regime: IncentiveRegime, options: { readonly asOf: string; readonly staleAfterDays: number }): ReadonlyArray<ValidationIssue> => {
  const subject = `regime:${regime.id}`;
  const issues: Array<ValidationIssue> = [];
  if (regime.status._tag === 'needs-verification') issues.push(raise('regime.needs-verification', subject, `${regime.code} is reference data that needs verification before reliance`));
  const age = Math.floor((Date.parse(options.asOf) - Date.parse(regime.reviewedOn)) / DAY_MS);
  if (age > options.staleAfterDays) issues.push(raise('regime.citation-stale', subject, `${regime.code} citations were last reviewed ${age} days before ${options.asOf}`));
  return issues;
};

const sliceComponentIssues = (index: SetIndex, slice: TaxActivitySlice, subject: string): ReadonlyArray<ValidationIssue> => {
  if (slice.businessComponentId === undefined) return isResearchCandidate(slice) ? [raise('slice.component-missing', subject, 'research-candidate slice names no business component')] : none;
  return index.components.has(slice.businessComponentId) ? none : [raise('slice.component-unknown', subject, `component ${slice.businessComponentId} is not in the set`)];
};

const sliceIssues = (index: SetIndex, slice: TaxActivitySlice): ReadonlyArray<ValidationIssue> => {
  const subject = `slice:${slice.id}`;
  const labour = index.labour.get(slice.eventId);
  if (labour === undefined) return [raise('slice.event-missing', subject, `event ${slice.eventId} is not in the set`)];
  if (labour.eventDigest !== slice.eventDigest) return [raise('slice.event-digest-mismatch', subject, 'the slice was cut from a superseded revision of the event')];
  const issues: Array<ValidationIssue> = [...sliceComponentIssues(index, slice, subject)];
  const quarter = calendarQuarter(labour.workDate);
  if (slice.quarter !== quarter) issues.push(raise('slice.quarter-mismatch', subject, `work on ${labour.workDate} is in ${quarter}, not ${slice.quarter}`));
  if (slice.substantiation !== 'contemporaneous') issues.push(raise('slice.substantiation-weak', subject, `slice is ${slice.substantiation}`));
  if (!actsForEntity(slice.attestedBy.actingFor, labour.employer)) issues.push(raise('slice.attester-not-employer', subject, 'the attesting human was acting for an entity other than the employer'));
  return issues;
};

const minuteIssues = (index: SetIndex): ReadonlyMap<string, ReadonlyArray<ValidationIssue>> => {
  const byEvent = new Map<string, Array<TaxActivitySlice>>();
  for (const slice of index.set.slices) byEvent.set(slice.eventId, [...(byEvent.get(slice.eventId) ?? []), slice]);
  const result = new Map<string, ReadonlyArray<ValidationIssue>>();
  for (const [eventId, slices] of byEvent) {
    const labour = index.labour.get(eventId);
    const total = slices.reduce((sum, slice) => sum + slice.minutes, 0);
    if (labour === undefined || total <= labour.minutes) continue;
    for (const slice of slices) result.set(slice.id, [raise('slice.minutes-exceed-event', `slice:${slice.id}`, `slices of event ${eventId} sum to ${total} minutes; the event has ${labour.minutes}`)]);
  }
  return result;
};

/**
 * Slice checks keyed by slice id.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenSlices = (index: SetIndex): ReadonlyMap<string, ReadonlyArray<ValidationIssue>> => {
  const overflow = minuteIssues(index);
  const seen = new Set<string>();
  const result = new Map<string, ReadonlyArray<ValidationIssue>>();
  for (const slice of index.set.slices) {
    const duplicate = seen.has(slice.id) ? [raise('slice.duplicate-id', `slice:${slice.id}`, 'another slice has this id')] : none;
    seen.add(slice.id);
    result.set(slice.id, [...(result.get(slice.id) ?? []), ...duplicate, ...sliceIssues(index, slice), ...(overflow.get(slice.id) ?? none)]);
  }
  return result;
};

const payerFundingSupported = (assessment: FundingAssessment): boolean => assessment.agreementPredatesWork === 'yes' && assessment.economicRiskBearer === 'payer';
const factsIndicateFunded = (assessment: FundingAssessment): boolean =>
  assessment.paymentContingentOnSuccess === 'no' && assessment.economicRiskBearer === 'payer' && assessment.performerRetainsSubstantialRights === 'no';

/**
 * Funding assessment checks.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenFunding = (assessment: FundingAssessment): ReadonlyArray<ValidationIssue> => {
  const subject = `funding:${assessment.id}`;
  const issues: Array<ValidationIssue> = [];
  if (!verdictsExclusive(assessment)) issues.push(raise('funding.verdicts-not-exclusive', subject, `performer ${assessment.performerVerdict} and payer ${assessment.payerVerdict} cannot both hold`));
  const decided = assessment.performerVerdict !== 'undetermined' || assessment.payerVerdict !== 'undetermined';
  if (decided && assessment.decisionId === undefined) issues.push(raise('funding.verdict-without-decision', subject, 'a funding verdict must cite the human decision that made it'));
  const payerSupported = payerFundingSupported(assessment);
  if (assessment.payerVerdict === 'contract-research-candidate' && !payerSupported)
    issues.push(raise('funding.payer-candidate-unsupported', subject, 'payer contract research needs a prior agreement and payer risk'));
  const factsSayFunded = factsIndicateFunded(assessment);
  if (assessment.performerVerdict === 'not-funded' && factsSayFunded) issues.push(raise('funding.verdict-contradicts-facts', subject, 'the test answers point to funded research'));
  return issues;
};

/**
 * Transfer checks keyed by event id.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenTransfers = (index: SetIndex): ReadonlyArray<ValidationIssue> =>
  index.set.transfers.flatMap((transfer) =>
    index.labour.has(transfer.eventId) ? none : [raise('transfer.event-missing', `transfer:${transfer.eventId}`, 'transfer leg refers to an event not in the set')],
  );

/**
 * Uniqueness of `(eventId, eventDigest, sliceId, regimeId)` across all claimants.
 *
 * @since 0.1.0
 * @category screening
 */
export const screenUniqueness = (attributions: ReadonlyArray<ClaimantAttribution>): ReadonlyMap<string, ReadonlyArray<ValidationIssue>> => {
  const byKey = new Map<string, Array<ClaimantAttribution>>();
  for (const attribution of attributions) byKey.set(uniquenessKey(attribution), [...(byKey.get(uniquenessKey(attribution)) ?? []), attribution]);
  const result = new Map<string, ReadonlyArray<ValidationIssue>>();
  for (const claims of byKey.values()) {
    if (claims.length < 2) continue;
    const claimants = claims.map((claim) => `${claim.claimant} (${claim.basis})`).join(', ');
    for (const claim of claims) result.set(claim.id, [raise('attribution.double-claim', `attribution:${claim.id}`, `one slice, one regime, one claimant: claimed by ${claimants}`)]);
  }
  return result;
};
