import { issue, report } from "../core/Issue.js";
import { contains } from "../core/Temporal.js";
import { currentRevisions, labourEvents } from "./EconomicEvent.js";
import { employersOn } from "./Employment.js";
import { isAffirmed } from "./JournalEntry.js";
import { partyKey } from "./PartyRef.js";
import { identifiedId, personKey } from "./PersonRef.js";
import { covers } from "./StandingAuthority.js";
import { civilDate } from "./TimeZone.js";
import { planningIssues } from "./ValidatePlanning.js";
import { conflictedPeople } from "./WorkOrder.js";
const byId = (records) => new Map(records.map((record) => [record.id, record]));
const sumBy = (records, key, amount) => {
    const totals = new Map();
    for (const record of records)
        totals.set(key(record), (totals.get(key(record)) ?? 0) + amount(record));
    return totals;
};
const duplicateRevisions = (events) => {
    const seen = new Set();
    const issues = [];
    for (const event of events) {
        const key = `${event.id}@${event.revision}`;
        if (seen.has(key))
            issues.push(issue('work.event.duplicate-revision', 'error', key, 'two records share an event id and revision'));
        seen.add(key);
    }
    return issues;
};
const dayCap = (labour) => [
    ...sumBy(labour, (event) => `${personKey(event.person)}|${event.workDate}`, (event) => event.minutes),
]
    .filter(([, minutes]) => minutes > 1440)
    .map(([key, minutes]) => issue('work.labour.day-cap', 'error', key, `${minutes} minutes on one civil date exceeds 1440 across all systems`));
const promotionIssue = (event, proposals) => {
    if (event.origin._tag !== 'agent-proposal')
        return undefined;
    const { promotedBy, proposalId } = event.origin;
    const owner = identifiedId(event.person);
    if (promotedBy._tag !== 'human' || (owner !== undefined && promotedBy.personId !== owner)) {
        return issue('work.labour.agent-origin-unpromoted', 'error', event.id, 'agent-proposed time must be promoted by the human who owns it');
    }
    const proposal = proposals.get(proposalId);
    return proposal !== undefined && proposal.state !== 'promoted' ? issue('work.labour.proposal-not-promoted', 'error', event.id, `proposal ${proposalId} is ${proposal.state}`) : undefined;
};
const employerIssue = (event, employments) => {
    const person = identifiedId(event.person);
    if (person === undefined || !employments.some((fact) => fact.person === person))
        return undefined;
    return employersOn(employments, person, event.workDate).includes(event.employer)
        ? undefined
        : issue('work.labour.employer-unconfirmed', 'hold', event.id, 'the employer named on the event does not match employment facts for the work date');
};
const labourIssues = (labour, context) => {
    const issues = [];
    if (labour.startedAt !== undefined && civilDate(labour.startedAt, labour.timeZone) !== labour.workDate) {
        issues.push(issue('work.labour.work-date-not-civil', 'error', labour.id, `workDate is not the civil date of startedAt in ${labour.timeZone}`));
    }
    if (labour.attestedBy._tag !== 'human')
        issues.push(issue('work.labour.attester-not-human', 'error', labour.id, 'labour minutes are attested by a human'));
    issues.push(promotionIssue(labour, context.proposals), employerIssue(labour, context.employments));
    return issues.filter((entry) => entry !== undefined);
};
const journalIssues = (journals) => {
    const ids = byId(journals);
    return journals
        .filter((entry) => entry.supersedes !== undefined && !ids.has(entry.supersedes))
        .map((entry) => issue('work.journal.supersedes-unknown', 'error', entry.id, 'the superseded entry is not in the set'));
};
const proposalIssues = (proposals, journals) => proposals
    .filter((proposal) => proposal.proposedBy._tag === 'agent')
    .filter((proposal) => proposal.journalIds.some((id) => !isAffirmedIn(journals, id)))
    .map((proposal) => issue('work.proposal.unaffirmed-evidence', 'hold', proposal.id, 'an agent proposal cites a journal entry that is missing or not affirmed by its owner'));
const isAffirmedIn = (journals, id) => {
    const entry = journals.get(id);
    return entry !== undefined && isAffirmed(entry);
};
const explicitApprovalIssues = (order, chains) => {
    if (order.authorization._tag !== 'explicit')
        return [];
    const { approvals } = order.authorization;
    const chain = chains.get(order.authorization.chain);
    const issues = [];
    if (chain === undefined)
        issues.push(issue('work.work-order.chain-undeclared', 'hold', order.id, `approval chain ${order.authorization.chain} is not declared`));
    const conflicted = conflictedPeople(order);
    const seen = new Set();
    for (const [index, approval] of approvals.entries()) {
        if (approval.by._tag !== 'human') {
            issues.push(issue('work.work-order.approver-not-human', 'error', order.id, `stage ${approval.stage} was approved by a ${approval.by._tag}`));
            continue;
        }
        if (conflicted.includes(approval.by.personId))
            issues.push(issue('work.work-order.self-approval', 'error', order.id, 'the requester or drafter approved the order'));
        if (seen.has(approval.by.personId))
            issues.push(issue('work.work-order.duplicate-approver', 'error', order.id, 'one person approved two stages'));
        if (chain !== undefined && chain.stages[index] !== approval.stage) {
            issues.push(issue('work.work-order.stage-order', 'error', order.id, `approval ${index + 1} is ${approval.stage}, expected ${chain.stages[index] ?? 'none'}`));
        }
        seen.add(approval.by.personId);
    }
    return issues;
};
const standingIssues = (order, authorities) => {
    if (order.authorization._tag !== 'standing')
        return [];
    const authority = authorities.get(order.authorization.authorityId);
    if (authority === undefined)
        return [issue('work.work-order.standing-unknown', 'hold', order.id, 'the cited standing authority is not in the set')];
    const fits = contains(authority, order.validFrom) && covers(authority.scope, order) && order.budgetMinutes < authority.autoApproveBelowMinutes;
    return fits ? [] : [issue('work.work-order.standing-exceeded', 'error', order.id, 'the standing authority is inactive, out of scope or below the order budget')];
};
const workOrderIssues = (set) => {
    const chains = new Map(set.chains.map((chain) => [chain.key, chain]));
    const authorities = byId(set.authorities);
    return set.workOrders.flatMap((order) => [
        ...(order.requester._tag === 'human' ? [] : [issue('work.work-order.requester-not-human', 'error', order.id, 'a work order is requested by a human')]),
        ...explicitApprovalIssues(order, chains),
        ...standingIssues(order, authorities),
    ]);
};
const acceptanceIssues = (acceptances, context) => acceptances.flatMap((acceptance) => {
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
const requestIssues = (requests, offers) => requests.flatMap((request) => {
    const offer = offers.get(request.offerId);
    if (offer === undefined)
        return [issue('work.capacity.unknown-offer', 'error', request.id, 'the request names an offer not in the set')];
    return [
        ...(partyKey(offer.audience) === partyKey(request.requestingParty) ? [] : [issue('work.capacity.request-not-audience', 'error', request.id, 'only the offer audience requests against it')]),
        ...(request.minutes > offer.offeredMinutes ? [issue('work.capacity.request-exceeds-offer', 'error', request.id, 'requested minutes exceed the offer')] : []),
    ];
});
const commitmentIssues = (set) => {
    const offers = byId(set.offers);
    const requests = byId(set.requests);
    const perRequest = sumBy(set.commitments, (commitment) => commitment.requestId, (commitment) => commitment.minutes);
    const perOffer = sumBy(set.commitments, (commitment) => commitment.offerId, (commitment) => commitment.minutes);
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
const humanDecisions = (set) => [
    ...(set.workOrders ?? []).flatMap((order) => order.authorization._tag === 'explicit' ? order.authorization.approvals.map((approval) => ({ subject: order.id, by: approval.by, at: approval.at })) : []),
    ...(set.authorities ?? []).map((authority) => ({ subject: authority.id, by: authority.grantor, at: authority.validFrom })),
    ...(set.acceptances ?? []).map((acceptance) => ({ subject: acceptance.id, by: acceptance.decidedBy, at: acceptance.decidedAt })),
    ...(set.commitments ?? []).map((commitment) => ({ subject: commitment.id, by: commitment.committedBy, at: commitment.recordedAt })),
    ...(set.projectLinks ?? []).flatMap((link) => link.acceptances.map((acceptance) => ({ subject: link.id, by: acceptance.by, at: acceptance.at }))),
    ...(set.schedules ?? []).map((schedule) => ({ subject: schedule.id, by: schedule.revisedBy, at: schedule.recordedAt })),
];
const actingForIssues = (set) => {
    const employments = set.employments ?? [];
    return humanDecisions(set).flatMap((decision) => {
        if (decision.by._tag !== 'human')
            return [];
        const employers = employersOn(employments, decision.by.personId, decision.at.slice(0, 10));
        return employers.length > 0 && (decision.by.actingFor._tag !== 'entity' || !employers.includes(decision.by.actingFor.entityId))
            ? [issue('work.pe.acting-for-not-employer', 'warning', decision.subject, 'a person decided for an entity other than their employer; screen for dependent-agent permanent establishment')]
            : [];
    });
};
const workAuthorityIssues = (set, current) => [
    ...workOrderIssues({ workOrders: set.workOrders ?? [], chains: set.chains ?? [], authorities: set.authorities ?? [] }),
    ...acceptanceIssues(set.acceptances ?? [], { events: byId(current), orders: byId(set.workOrders ?? []) }),
];
const capacityTradeIssues = (set) => [
    ...requestIssues(set.requests ?? [], byId(set.offers ?? [])),
    ...commitmentIssues({ offers: set.offers ?? [], requests: set.requests ?? [], commitments: set.commitments ?? [] }),
];
/**
 * Validate a set of work records together.
 *
 * @since 0.1.0
 * @category validation
 */
export const validateWork = (set) => {
    const events = set.events ?? [];
    const current = currentRevisions(events);
    const journals = set.journals ?? [];
    const proposals = byId(set.proposals ?? []);
    const employments = set.employments ?? [];
    const labour = labourEvents(current);
    const assistance = labour.flatMap((event) => event.assistedBy.flatMap((id) => {
        const source = current.find((candidate) => candidate.id === id);
        return source?._tag === 'compute' ? [] : [issue('work.labour.assistance-unresolved', 'error', event.id, `assistance ${id} must name a recorded compute event`)];
    }));
    return report([
        ...duplicateRevisions(events),
        ...assistance,
        ...dayCap(labour),
        ...labour.flatMap((event) => labourIssues(event, { proposals, employments })),
        ...journalIssues(journals),
        ...proposalIssues(set.proposals ?? [], byId(journals)),
        ...workAuthorityIssues(set, current),
        ...capacityTradeIssues(set),
        ...planningIssues(set),
        ...actingForIssues(set),
    ]);
};
//# sourceMappingURL=ValidateWork.js.map