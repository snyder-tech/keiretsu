/**
 * Cross-record invariants over a set of work records, reported as core
 * validation issues with stable codes. Single-record shape rules live on the
 * schemas; these rules need more than one record.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `work.event.duplicate-revision` | error | one record per (event id, revision) |
 * | `work.labour.day-cap` | error | per person and civil date, ≤ 1,440 minutes across all systems |
 * | `work.labour.work-date-not-civil` | error | `workDate` is the civil date of `startedAt` in `timeZone` |
 * | `work.labour.attester-not-human` | error | labour is attested by a human |
 * | `work.labour.agent-origin-unpromoted` | error | agent-proposal lineage names a promoting human who owns the time |
 * | `work.labour.proposal-not-promoted` | error | a cited proposal (when present) is in state `promoted` |
 * | `work.labour.employer-unconfirmed` | hold | the named employer matches the person's employment facts |
 * | `work.journal.supersedes-unknown` | error | a correction names an entry in the set |
 * | `work.proposal.unaffirmed-evidence` | hold | an agent proposal cites only affirmed journal entries |
 * | `work.work-order.requester-not-human` | error | a work order is requested by a human |
 * | `work.work-order.chain-undeclared` | hold | explicit approvals follow a declared chain |
 * | `work.work-order.approver-not-human` | error | approvals are human |
 * | `work.work-order.self-approval` | error | requester and drafter never approve |
 * | `work.work-order.duplicate-approver` | error | each stage has a distinct human |
 * | `work.work-order.stage-order` | error | approvals follow the chain's stage order |
 * | `work.work-order.standing-unknown` | hold | the cited standing authority is in the set |
 * | `work.work-order.standing-exceeded` | error | the authority is active, covers the order, and the budget is under its threshold |
 * | `work.acceptance.unknown-event` | error | an acceptance cites events in the set |
 * | `work.acceptance.unknown-work-order` | error | a cited work order is in the set |
 * | `work.acceptance.ai-only` | warning | AI compute alone does not substantiate human labour |
 * | `work.capacity.unknown-offer` / `unknown-request` | error | capacity records reference records in the set |
 * | `work.capacity.request-not-audience` | error | only the offer's audience requests against it |
 * | `work.capacity.request-exceeds-offer` | error | requested ≤ offered |
 * | `work.capacity.commit-exceeds-request` | error | Σ committed per request ≤ requested |
 * | `work.capacity.commit-exceeds-offer` | error | Σ committed per offer ≤ offered |
 * | `work.capacity.committer-not-employer` | error | only the employer commits its staff |
 * | `work.pe.acting-for-not-employer` | warning | a human decision for an entity other than the person's employer (PE screening input) |
 * | `work.capacity-hold.*`, `work.schedule.*` | — | capacity-hold lifecycles and firm-schedule revisions (see `ValidatePlanning`) |
 *
 * @since 0.1.0
 * @module
 */
import type { Actor } from '../core/Actor.ts';
import { issue, report, type ValidationIssue, type ValidationReport } from '../core/Issue.ts';
import { contains } from '../core/Temporal.ts';

import type { Acceptance } from './Acceptance.ts';
import type { ApprovalChain } from './ApprovalChain.ts';
import type { CapacityCommitment } from './CapacityCommitment.ts';
import type { CapacityHold } from './CapacityHold.ts';
import type { CapacityOffer } from './CapacityOffer.ts';
import type { CapacityRequest } from './CapacityRequest.ts';
import { currentRevisions, type EconomicEvent, labourEvents, type LabourEvent } from './EconomicEvent.ts';
import { type EmploymentFact, employersOn } from './Employment.ts';
import type { FirmSchedule } from './FirmSchedule.ts';
import { isAffirmed, type JournalEntry } from './JournalEntry.ts';
import { partyKey } from './PartyRef.ts';
import type { ProjectLink } from './ProjectLink.ts';
import { identifiedId, personKey } from './PersonRef.ts';
import { covers, type StandingAuthority } from './StandingAuthority.ts';
import type { TimeProposal } from './TimeProposal.ts';
import { civilDate } from './TimeZone.ts';
import { planningIssues } from './ValidatePlanning.ts';
import { conflictedPeople, type WorkOrder } from './WorkOrder.ts';

/**
 * Records to validate together. Omitted collections are empty. `employments`
 * is the port supplied by `keiretsu-entity`; without it, employer checks are skipped
 * (unknown, not a mismatch).
 *
 * @since 0.1.0
 * @category models
 */
export interface WorkSet {
  readonly events?: ReadonlyArray<EconomicEvent>;
  readonly journals?: ReadonlyArray<JournalEntry>;
  readonly proposals?: ReadonlyArray<TimeProposal>;
  readonly workOrders?: ReadonlyArray<WorkOrder>;
  readonly chains?: ReadonlyArray<ApprovalChain>;
  readonly authorities?: ReadonlyArray<StandingAuthority>;
  readonly acceptances?: ReadonlyArray<Acceptance>;
  readonly projectLinks?: ReadonlyArray<ProjectLink>;
  readonly offers?: ReadonlyArray<CapacityOffer>;
  readonly requests?: ReadonlyArray<CapacityRequest>;
  readonly commitments?: ReadonlyArray<CapacityCommitment>;
  /** Every revision of each capacity hold. */
  readonly holds?: ReadonlyArray<CapacityHold>;
  /** Every daily revision of each firm schedule. */
  readonly schedules?: ReadonlyArray<FirmSchedule>;
  readonly employments?: ReadonlyArray<EmploymentFact>;
}

const byId = <A extends { readonly id: string }>(records: ReadonlyArray<A>): ReadonlyMap<string, A> => new Map(records.map((record) => [record.id, record]));

const sumBy = <A>(records: ReadonlyArray<A>, key: (record: A) => string, amount: (record: A) => number): ReadonlyMap<string, number> => {
  const totals = new Map<string, number>();
  for (const record of records) totals.set(key(record), (totals.get(key(record)) ?? 0) + amount(record));
  return totals;
};

const duplicateRevisions = (events: ReadonlyArray<EconomicEvent>): ReadonlyArray<ValidationIssue> => {
  const seen = new Set<string>();
  const issues: Array<ValidationIssue> = [];
  for (const event of events) {
    const key = `${event.id}@${event.revision}`;
    if (seen.has(key)) issues.push(issue('work.event.duplicate-revision', 'error', key, 'two records share an event id and revision'));
    seen.add(key);
  }
  return issues;
};

const dayCap = (labour: ReadonlyArray<LabourEvent>): ReadonlyArray<ValidationIssue> =>
  [
    ...sumBy(
      labour,
      (event) => `${personKey(event.person)}|${event.workDate}`,
      (event) => event.minutes,
    ),
  ]
    .filter(([, minutes]) => minutes > 1440)
    .map(([key, minutes]) => issue('work.labour.day-cap', 'error', key, `${minutes} minutes on one civil date exceeds 1440 across all systems`));

const promotionIssue = (event: LabourEvent, proposals: ReadonlyMap<string, TimeProposal>): ValidationIssue | undefined => {
  if (event.origin._tag !== 'agent-proposal') return undefined;
  const { promotedBy, proposalId } = event.origin;
  const owner = identifiedId(event.person);
  if (promotedBy._tag !== 'human' || (owner !== undefined && promotedBy.personId !== owner)) {
    return issue('work.labour.agent-origin-unpromoted', 'error', event.id, 'agent-proposed time must be promoted by the human who owns it');
  }
  const proposal = proposals.get(proposalId);
  return proposal !== undefined && proposal.state !== 'promoted' ? issue('work.labour.proposal-not-promoted', 'error', event.id, `proposal ${proposalId} is ${proposal.state}`) : undefined;
};

const employerIssue = (event: LabourEvent, employments: ReadonlyArray<EmploymentFact>): ValidationIssue | undefined => {
  const person = identifiedId(event.person);
  if (person === undefined || !employments.some((fact) => fact.person === person)) return undefined;
  return employersOn(employments, person, event.workDate).includes(event.employer)
    ? undefined
    : issue('work.labour.employer-unconfirmed', 'hold', event.id, 'the employer named on the event does not match employment facts for the work date');
};

const labourIssues = (labour: LabourEvent, context: { readonly proposals: ReadonlyMap<string, TimeProposal>; readonly employments: ReadonlyArray<EmploymentFact> }) => {
  const issues: Array<ValidationIssue | undefined> = [];
  if (labour.startedAt !== undefined && civilDate(labour.startedAt, labour.timeZone) !== labour.workDate) {
    issues.push(issue('work.labour.work-date-not-civil', 'error', labour.id, `workDate is not the civil date of startedAt in ${labour.timeZone}`));
  }
  if (labour.attestedBy._tag !== 'human') issues.push(issue('work.labour.attester-not-human', 'error', labour.id, 'labour minutes are attested by a human'));
  issues.push(promotionIssue(labour, context.proposals), employerIssue(labour, context.employments));
  return issues.filter((entry): entry is ValidationIssue => entry !== undefined);
};

const journalIssues = (journals: ReadonlyArray<JournalEntry>): ReadonlyArray<ValidationIssue> => {
  const ids = byId(journals);
  return journals
    .filter((entry) => entry.supersedes !== undefined && !ids.has(entry.supersedes))
    .map((entry) => issue('work.journal.supersedes-unknown', 'error', entry.id, 'the superseded entry is not in the set'));
};

const proposalIssues = (proposals: ReadonlyArray<TimeProposal>, journals: ReadonlyMap<string, JournalEntry>): ReadonlyArray<ValidationIssue> =>
  proposals
    .filter((proposal) => proposal.proposedBy._tag === 'agent')
    .filter((proposal) => proposal.journalIds.some((id) => !isAffirmedIn(journals, id)))
    .map((proposal) => issue('work.proposal.unaffirmed-evidence', 'hold', proposal.id, 'an agent proposal cites a journal entry that is missing or not affirmed by its owner'));

const isAffirmedIn = (journals: ReadonlyMap<string, JournalEntry>, id: string): boolean => {
  const entry = journals.get(id);
  return entry !== undefined && isAffirmed(entry);
};

const explicitApprovalIssues = (order: WorkOrder, chains: ReadonlyMap<string, ApprovalChain>): ReadonlyArray<ValidationIssue> => {
  if (order.authorization._tag !== 'explicit') return [];
  const { approvals } = order.authorization;
  const chain = chains.get(order.authorization.chain);
  const issues: Array<ValidationIssue> = [];
  if (chain === undefined) issues.push(issue('work.work-order.chain-undeclared', 'hold', order.id, `approval chain ${order.authorization.chain} is not declared`));
  const conflicted = conflictedPeople(order);
  const seen = new Set<string>();
  for (const [index, approval] of approvals.entries()) {
    if (approval.by._tag !== 'human') {
      issues.push(issue('work.work-order.approver-not-human', 'error', order.id, `stage ${approval.stage} was approved by a ${approval.by._tag}`));
      continue;
    }
    if (conflicted.includes(approval.by.personId)) issues.push(issue('work.work-order.self-approval', 'error', order.id, 'the requester or drafter approved the order'));
    if (seen.has(approval.by.personId)) issues.push(issue('work.work-order.duplicate-approver', 'error', order.id, 'one person approved two stages'));
    if (chain !== undefined && chain.stages[index] !== approval.stage) {
      issues.push(issue('work.work-order.stage-order', 'error', order.id, `approval ${index + 1} is ${approval.stage}, expected ${chain.stages[index] ?? 'none'}`));
    }
    seen.add(approval.by.personId);
  }
  return issues;
};

const standingIssues = (order: WorkOrder, authorities: ReadonlyMap<string, StandingAuthority>): ReadonlyArray<ValidationIssue> => {
  if (order.authorization._tag !== 'standing') return [];
  const authority = authorities.get(order.authorization.authorityId);
  if (authority === undefined) return [issue('work.work-order.standing-unknown', 'hold', order.id, 'the cited standing authority is not in the set')];
  const fits = contains(authority, order.validFrom) && covers(authority.scope, order) && order.budgetMinutes < authority.autoApproveBelowMinutes;
  return fits ? [] : [issue('work.work-order.standing-exceeded', 'error', order.id, 'the standing authority is inactive, out of scope or below the order budget')];
};

const workOrderIssues = (set: Required<Pick<WorkSet, 'workOrders' | 'chains' | 'authorities'>>): ReadonlyArray<ValidationIssue> => {
  const chains = new Map(set.chains.map((chain) => [chain.key, chain]));
  const authorities = byId(set.authorities);
  return set.workOrders.flatMap((order) => [
    ...(order.requester._tag === 'human' ? [] : [issue('work.work-order.requester-not-human', 'error', order.id, 'a work order is requested by a human')]),
    ...explicitApprovalIssues(order, chains),
    ...standingIssues(order, authorities),
  ]);
};

const acceptanceIssues = (acceptances: ReadonlyArray<Acceptance>, context: { readonly events: ReadonlyMap<string, EconomicEvent>; readonly orders: ReadonlyMap<string, WorkOrder> }) =>
  acceptances.flatMap((acceptance) => {
    const missing = acceptance.eventIds.filter((id) => !context.events.has(id));
    const cited = acceptance.eventIds.flatMap((id) => context.events.get(id) ?? []);
    return [
      ...missing.map((id) => issue('work.acceptance.unknown-event', 'error', acceptance.id, `cited event ${id} is not in the set`)),
      ...(acceptance.workOrderId !== undefined && !context.orders.has(acceptance.workOrderId)
        ? [issue('work.acceptance.unknown-work-order', 'error', acceptance.id, 'the cited work order is not in the set')]
        : []),
      ...(cited.length > 0 && cited.every((event) => event._tag === 'compute')
        ? [issue('work.acceptance.ai-only', 'warning', acceptance.id, 'only AI compute produced this deliverable; it substantiates no human labour')]
        : []),
    ];
  });

const requestIssues = (requests: ReadonlyArray<CapacityRequest>, offers: ReadonlyMap<string, CapacityOffer>): ReadonlyArray<ValidationIssue> =>
  requests.flatMap((request) => {
    const offer = offers.get(request.offerId);
    if (offer === undefined) return [issue('work.capacity.unknown-offer', 'error', request.id, 'the request names an offer not in the set')];
    return [
      ...(partyKey(offer.audience) === partyKey(request.requestingParty) ? [] : [issue('work.capacity.request-not-audience', 'error', request.id, 'only the offer audience requests against it')]),
      ...(request.minutes > offer.offeredMinutes ? [issue('work.capacity.request-exceeds-offer', 'error', request.id, 'requested minutes exceed the offer')] : []),
    ];
  });

const commitmentIssues = (set: Required<Pick<WorkSet, 'offers' | 'requests' | 'commitments'>>): ReadonlyArray<ValidationIssue> => {
  const offers = byId(set.offers);
  const requests = byId(set.requests);
  const perRequest = sumBy(
    set.commitments,
    (commitment) => commitment.requestId,
    (commitment) => commitment.minutes,
  );
  const perOffer = sumBy(
    set.commitments,
    (commitment) => commitment.offerId,
    (commitment) => commitment.minutes,
  );
  const references = set.commitments.flatMap((commitment) => {
    const offer = offers.get(commitment.offerId);
    return [
      ...(offer === undefined ? [issue('work.capacity.unknown-offer', 'error', commitment.id, 'the commitment names an offer not in the set')] : []),
      ...(requests.get(commitment.requestId)?.offerId === commitment.offerId
        ? []
        : [issue('work.capacity.unknown-request', 'error', commitment.id, 'the commitment names a request not in the set for this offer')]),
      ...(offer !== undefined && offer.employer !== commitment.committingEntity ? [issue('work.capacity.committer-not-employer', 'error', commitment.id, 'only the employer commits its staff')] : []),
    ];
  });
  const overRequest = [...perRequest].filter(([id, minutes]) => minutes > (requests.get(id)?.minutes ?? Infinity));
  const overOffer = [...perOffer].filter(([id, minutes]) => minutes > (offers.get(id)?.offeredMinutes ?? Infinity));
  return [
    ...references,
    ...overRequest.map(([id, minutes]) => issue('work.capacity.commit-exceeds-request', 'error', id, `${minutes} committed minutes exceed the request`)),
    ...overOffer.map(([id, minutes]) => issue('work.capacity.commit-exceeds-offer', 'error', id, `${minutes} committed minutes exceed the offer`)),
  ];
};

interface HumanDecision {
  readonly subject: string;
  readonly by: Actor;
  readonly at: string;
}

const humanDecisions = (set: WorkSet): ReadonlyArray<HumanDecision> => [
  ...(set.workOrders ?? []).flatMap((order) =>
    order.authorization._tag === 'explicit' ? order.authorization.approvals.map((approval) => ({ subject: order.id, by: approval.by, at: approval.at })) : [],
  ),
  ...(set.authorities ?? []).map((authority) => ({ subject: authority.id, by: authority.grantor, at: authority.validFrom })),
  ...(set.acceptances ?? []).map((acceptance) => ({ subject: acceptance.id, by: acceptance.decidedBy, at: acceptance.decidedAt })),
  ...(set.commitments ?? []).map((commitment) => ({ subject: commitment.id, by: commitment.committedBy, at: commitment.recordedAt })),
  ...(set.projectLinks ?? []).flatMap((link) => link.acceptances.map((acceptance) => ({ subject: link.id, by: acceptance.by, at: acceptance.at }))),
  ...(set.schedules ?? []).map((schedule) => ({ subject: schedule.id, by: schedule.revisedBy, at: schedule.recordedAt })),
];

const actingForIssues = (set: WorkSet): ReadonlyArray<ValidationIssue> => {
  const employments = set.employments ?? [];
  return humanDecisions(set).flatMap((decision) => {
    if (decision.by._tag !== 'human') return [];
    const employers = employersOn(employments, decision.by.personId, decision.at.slice(0, 10));
    return employers.length > 0 && (decision.by.actingFor._tag !== 'entity' || !employers.includes(decision.by.actingFor.entityId))
      ? [issue('work.pe.acting-for-not-employer', 'warning', decision.subject, 'a person decided for an entity other than their employer; screen for dependent-agent permanent establishment')]
      : [];
  });
};

/**
 * Validate a set of work records together.
 *
 * @since 0.1.0
 * @category validation
 */
export const validateWork = (set: WorkSet): ValidationReport => {
  const events = set.events ?? [];
  const current = currentRevisions(events);
  const journals = set.journals ?? [];
  const proposals = byId(set.proposals ?? []);
  const employments = set.employments ?? [];
  const labour = labourEvents(current);
  const assistance = labour.flatMap((event) =>
    event.assistedBy.flatMap((id) => {
      const source = current.find((candidate) => candidate.id === id);
      return source?._tag === 'compute' ? [] : [issue('work.labour.assistance-unresolved', 'error', event.id, `assistance ${id} must name a recorded compute event`)];
    }),
  );
  return report([
    ...duplicateRevisions(events),
    ...assistance,
    ...dayCap(labour),
    ...labour.flatMap((event) => labourIssues(event, { proposals, employments })),
    ...journalIssues(journals),
    ...proposalIssues(set.proposals ?? [], byId(journals)),
    ...workOrderIssues({ workOrders: set.workOrders ?? [], chains: set.chains ?? [], authorities: set.authorities ?? [] }),
    ...acceptanceIssues(set.acceptances ?? [], { events: byId(current), orders: byId(set.workOrders ?? []) }),
    ...requestIssues(set.requests ?? [], byId(set.offers ?? [])),
    ...commitmentIssues({ offers: set.offers ?? [], requests: set.requests ?? [], commitments: set.commitments ?? [] }),
    ...planningIssues(set),
    ...actingForIssues(set),
  ]);
};
