/**
 * Invariants over the ownership and control graph and declared tax groups.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `ownership.self` | error | an entity does not own itself |
 * | `ownership.over-allocated` | error | per owned entity and date, Σ shareBps ≤ 10,000 |
 * | `ownership.cycle` | error | the ownership graph is acyclic on every date |
 * | `ownership.unverified` | warning | unverified edges are surfaced and excluded from derivations |
 * | `control.self` | error | an entity does not control itself |
 * | `control.full-overlap` | error | no two `full` control edges for one entity overlap |
 * | `control.joint-single` | error | `joint` control needs two or more overlapping controllers |
 * | `control.equity-without-ownership` | error | an `equity` basis needs matching ownership throughout |
 * | `control.unverified` | warning | as for ownership |
 * | `edge.verified-without-evidence` | error | `verified` assurance carries evidence |
 * | `tax-group.ownership-unsupported` | warning | derived ownership does not support a declared group |
 * | `tax-group.member-duplicate` | error | members are listed once |
 *
 * @since 0.1.0
 * @module
 */
import { issue } from "../core/Issue.js";
import { contains, overlaps } from "../core/Temporal.js";
import { ownershipSupports, SCREEN_THRESHOLD_BPS } from "./TaxGroup.js";
const unique = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right));
const edgeSubject = (kind, index) => `${kind}[${index}]`;
const evidenceIssues = (kind, edges) => edges.flatMap((edge, index) => [
    ...(edge.assurance === 'verified' && edge.evidence.length === 0
        ? [issue('edge.verified-without-evidence', 'error', edgeSubject(kind, index), 'verified assurance requires evidence')]
        : []),
    ...(edge.assurance === 'unverified' ? [issue(`${kind}.unverified`, 'warning', edgeSubject(kind, index), 'unverified edge is excluded from derivations by default')] : []),
]);
const overAllocation = (edges) => unique(edges.map((edge) => edge.owned)).flatMap((owned) => {
    const mine = edges.filter((edge) => edge.owned === owned);
    const dates = unique(mine.map((edge) => edge.validFrom));
    return dates.flatMap((date) => {
        const total = mine.filter((edge) => contains(edge, date)).reduce((sum, edge) => sum + edge.shareBps, 0);
        return total > 10_000 ? [issue('ownership.over-allocated', 'error', `entities.${owned}`, `ownership sums to ${total} bps on ${date}`)] : [];
    });
});
const hasCycle = (edges) => {
    const next = new Map();
    edges.forEach((edge) => next.set(edge.owner, [...(next.get(edge.owner) ?? []), edge.owned]));
    const visiting = new Set();
    const done = new Set();
    const visit = (node, path) => {
        if (visiting.has(node))
            return [...path, node];
        if (done.has(node))
            return undefined;
        visiting.add(node);
        const found = (next.get(node) ?? []).reduce((acc, child) => acc ?? visit(child, [...path, node]), undefined);
        visiting.delete(node);
        done.add(node);
        return found;
    };
    return [...next.keys()].reduce((acc, node) => acc ?? visit(node, []), undefined);
};
const cycles = (edges) => {
    const found = unique(edges.map((edge) => edge.validFrom))
        .map((date) => ({ date, path: hasCycle(edges.filter((edge) => contains(edge, date))) }))
        .find((entry) => entry.path !== undefined);
    return found?.path === undefined ? [] : [issue('ownership.cycle', 'error', 'ownership', `ownership cycle ${found.path.join(' → ')} on ${found.date}`)];
};
const selfEdges = (model) => [
    ...model.ownership.flatMap((edge, index) => (edge.owner === edge.owned ? [issue('ownership.self', 'error', edgeSubject('ownership', index), 'an entity cannot own itself')] : [])),
    ...model.control.flatMap((edge, index) => edge.controller === edge.controlled ? [issue('control.self', 'error', edgeSubject('control', index), 'an entity cannot control itself')] : []),
];
const fullOverlaps = (control) => control.flatMap((edge, index) => control
    .slice(index + 1)
    .filter((other) => edge.scope === 'full' && other.scope === 'full' && other.controlled === edge.controlled && overlaps(edge, other))
    .map(() => issue('control.full-overlap', 'error', `entities.${edge.controlled}`, 'two full control edges overlap')));
const jointSingles = (control) => control.flatMap((edge, index) => {
    if (edge.scope !== 'joint')
        return [];
    const partner = control.some((other) => other.scope === 'joint' && other.controlled === edge.controlled && other.controller !== edge.controller && overlaps(edge, other));
    return partner ? [] : [issue('control.joint-single', 'error', edgeSubject('control', index), 'joint control needs at least two controllers')];
});
const equityBacked = (edge, ownership) => {
    const mine = ownership.filter((owned) => owned.owner === edge.controller && owned.owned === edge.controlled);
    const checkpoints = unique([edge.validFrom, ...mine.flatMap((owned) => [owned.validFrom, ...(owned.validTo === undefined ? [] : [owned.validTo])])]).filter((date) => contains(edge, date));
    return checkpoints.every((date) => mine.some((owned) => contains(owned, date) && owned.shareBps > 0));
};
const equityWithoutOwnership = (model) => model.control.flatMap((edge, index) => edge.bases.includes('equity') && !equityBacked(edge, model.ownership)
    ? [issue('control.equity-without-ownership', 'error', edgeSubject('control', index), `${edge.controller} claims equity control of ${edge.controlled} without ownership throughout`)]
    : []);
const taxGroupIssues = (model) => model.taxGroups.flatMap((group) => {
    const subject = `taxGroups.${group.key}`;
    if (new Set(group.members).size !== group.members.length)
        return [issue('tax-group.member-duplicate', 'error', subject, 'members must be unique')];
    const threshold = SCREEN_THRESHOLD_BPS[group.kind];
    if (threshold === undefined || ownershipSupports({ members: group.members, edges: model.ownership, date: group.validFrom, thresholdBps: threshold }))
        return [];
    return [issue('tax-group.ownership-unsupported', 'warning', subject, `declared ${group.kind} group is not supported by verified or asserted ownership on ${group.validFrom}; review required`)];
});
/**
 * Validate the ownership/control graph and tax groups.
 *
 * @since 0.1.0
 * @category validation
 */
export const validateGraph = (model) => [
    ...selfEdges(model),
    ...evidenceIssues('ownership', model.ownership),
    ...evidenceIssues('control', model.control),
    ...overAllocation(model.ownership),
    ...cycles(model.ownership),
    ...fullOverlaps(model.control),
    ...jointSingles(model.control),
    ...equityWithoutOwnership(model),
    ...taxGroupIssues(model),
];
//# sourceMappingURL=GraphInvariants.js.map