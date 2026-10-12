/**
 * Cross-record invariants for capacity holds and firm schedules, over every
 * revision supplied (not only the latest). `validateWork` runs them; they are
 * exported for callers that validate planning records alone. Checks against
 * the agreement's `hold-right` live in `@snyder-tech/keiretsu/commerce/CapacityHoldCheck`.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `work.capacity-hold.revision-sequence` | error | a hold's revisions are 1..n, one record each |
 * | `work.capacity-hold.illegal-transition` | error | each revision moves `held → converted / released / lapsed` |
 * | `work.capacity-hold.terms-changed` | error | parties, subject, window, minutes, booking, class, right, link and expiry never change |
 * | `work.capacity-hold.converted-order-unknown` | warning | the work order a hold converted into is in the set |
 * | `work.capacity-hold.conversion-mismatch` | error | that order is performed by the provider for the holder |
 * | `work.schedule.revision-sequence` | error | a schedule's revisions are 1..n, one record each |
 * | `work.schedule.not-daily` | error | each revision is for a later civil day than the one before |
 * | `work.schedule.parties-changed` | error | provider and audience never change |
 * | `work.schedule.assignment-mutated` | error | an assignment id keeps its content; moving work is a reassignment |
 * | `work.schedule.undeclared-change` | error | every assignment added or removed inside both horizons is declared |
 * | `work.schedule.unknown-change` | error | every declared change matches an actual addition or removal |
 *
 * @since 0.1.0
 * @module
 */
import { issue } from "../core/Issue.js";
import { canTransitionCapacityHold, holdTermsKey } from "./CapacityHold.js";
import { assignmentKey, horizonEnd } from "./FirmSchedule.js";
import { partyKey } from "./PartyRef.js";
const chains = (records) => {
    const grouped = new Map();
    for (const record of records)
        grouped.set(record.id, [...(grouped.get(record.id) ?? []), record]);
    return [...grouped.values()].map((chain) => [...chain].sort((left, right) => left.revision - right.revision));
};
const contiguous = (chain) => chain.every((record, index) => record.revision === index + 1);
const pairs = (chain) => chain.slice(1).flatMap((next, index) => {
    const previous = chain[index];
    return previous === undefined ? [] : [[previous, next]];
});
const holdPairIssues = (previous, next) => [
    ...(canTransitionCapacityHold(previous.state, next.state)
        ? []
        : [issue('work.capacity-hold.illegal-transition', 'error', next.id, `revision ${next.revision} moves ${previous.state} to ${next.state}`)]),
    ...(holdTermsKey(previous) === holdTermsKey(next) ? [] : [issue('work.capacity-hold.terms-changed', 'error', next.id, `revision ${next.revision} changes the terms of the hold`)]),
];
const conversionIssues = (hold, orders) => {
    if (hold.convertedTo === undefined)
        return [];
    const order = orders.get(hold.convertedTo);
    if (order === undefined)
        return [issue('work.capacity-hold.converted-order-unknown', 'warning', hold.id, 'the work order the hold converted into is not in the set')];
    return order.performer === hold.provider && partyKey(order.requestingParty) === partyKey(hold.holder)
        ? []
        : [issue('work.capacity-hold.conversion-mismatch', 'error', hold.id, 'a hold converts into an order the provider performs for the holder')];
};
const holdIssues = (holds, orders) => chains(holds).flatMap((chain) => {
    const first = chain[0];
    if (first === undefined)
        return [];
    if (!contiguous(chain))
        return [issue('work.capacity-hold.revision-sequence', 'error', first.id, 'revisions are numbered 1..n with one record each')];
    return [...pairs(chain).flatMap(([previous, next]) => holdPairIssues(previous, next)), ...chain.flatMap((hold) => conversionIssues(hold, orders))];
});
const inWindow = (assignment, window) => assignment.date >= window.from && assignment.date < window.to;
/** Additions and removals between two consecutive revisions. */
const diff = (previous, next) => {
    const window = { from: next.asOf, to: horizonEnd(previous) };
    const before = new Map(previous.assignments.map((entry) => [entry.assignmentId, entry]));
    const after = new Set(next.assignments.map((entry) => entry.assignmentId));
    const fresh = next.assignments.filter((entry) => !before.has(entry.assignmentId));
    return {
        added: new Set(fresh.filter((entry) => inWindow(entry, window)).map((entry) => entry.assignmentId)),
        new: new Set(fresh.map((entry) => entry.assignmentId)),
        removed: new Set(previous.assignments.filter((entry) => inWindow(entry, window) && !after.has(entry.assignmentId)).map((entry) => entry.assignmentId)),
        mutated: next.assignments.flatMap((entry) => {
            const prior = before.get(entry.assignmentId);
            return prior !== undefined && assignmentKey(prior) !== assignmentKey(entry) ? [entry.assignmentId] : [];
        }),
    };
};
const declared = (changes) => ({
    added: new Set(changes.flatMap((change) => (change._tag === 'removed' ? [] : [change.assignmentId]))),
    removed: new Set(changes.flatMap((change) => (change._tag === 'removed' ? [change.assignmentId] : change._tag === 'reassigned' ? [change.replaces] : []))),
});
const changeIssues = (next, found) => {
    const stated = declared(next.changes);
    const undeclared = [...[...found.added].filter((id) => !stated.added.has(id)), ...[...found.removed].filter((id) => !stated.removed.has(id))];
    const unknown = [...[...stated.added].filter((id) => !found.new.has(id)), ...[...stated.removed].filter((id) => !found.removed.has(id))];
    return [
        ...undeclared.map((id) => issue('work.schedule.undeclared-change', 'error', next.id, `revision ${next.revision} changes assignment ${id} without declaring it`)),
        ...unknown.map((id) => issue('work.schedule.unknown-change', 'error', next.id, `revision ${next.revision} declares a change to ${id} that did not happen`)),
    ];
};
const schedulePairIssues = (previous, next) => {
    const found = diff(previous, next);
    return [
        ...(next.asOf > previous.asOf ? [] : [issue('work.schedule.not-daily', 'error', next.id, `revision ${next.revision} is not for a later day than revision ${previous.revision}`)]),
        ...(previous.provider === next.provider && partyKey(previous.audience) === partyKey(next.audience)
            ? []
            : [issue('work.schedule.parties-changed', 'error', next.id, 'provider and audience never change across revisions')]),
        ...found.mutated.map((id) => issue('work.schedule.assignment-mutated', 'error', next.id, `assignment ${id} changed in place; remove it and add a reassignment`)),
        ...changeIssues(next, found),
    ];
};
const scheduleIssues = (schedules) => chains(schedules).flatMap((chain) => {
    const first = chain[0];
    if (first === undefined)
        return [];
    if (!contiguous(chain))
        return [issue('work.schedule.revision-sequence', 'error', first.id, 'revisions are numbered 1..n with one record each')];
    return pairs(chain).flatMap(([previous, next]) => schedulePairIssues(previous, next));
});
/**
 * Validate capacity holds and firm schedules (every revision).
 *
 * @since 0.1.0
 * @category validation
 */
export const planningIssues = (set) => [
    ...holdIssues(set.holds ?? [], new Map((set.workOrders ?? []).map((order) => [order.id, order]))),
    ...scheduleIssues(set.schedules ?? []),
];
//# sourceMappingURL=ValidatePlanning.js.map