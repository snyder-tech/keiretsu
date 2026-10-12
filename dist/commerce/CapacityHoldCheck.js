/**
 * Capacity holds against their agreement: a hold (work package) is valid only
 * under a `hold-right` term of an agreement that is executed on the booking
 * date, between the right's holder and provider, inside its role scope,
 * minimum lead time, expiry and outstanding-minutes ceiling. The claimed
 * lead-time class must be the agreement's class for the hold's lead time.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `capacity-hold.agreement-unresolved` | warning | the cited agreement is in the set |
 * | `capacity-hold.agreement-not-executed` | error | the agreement is executed and in force on the booking date |
 * | `capacity-hold.right-unknown` | error | the agreement has a hold right with the cited key |
 * | `capacity-hold.right-parties` | error | holder and provider are the right's holder and provider |
 * | `capacity-hold.role-out-of-scope` | error | a role-scoped right covers the hold's role |
 * | `capacity-hold.lead-time-short` | error | lead days ≥ the right's minimum |
 * | `capacity-hold.expiry-exceeds-right` | error | expiry falls on or before booking + the right's business days |
 * | `capacity-hold.exceeds-right-minutes` | error | peak minutes held at once (overlapping windows) under one right ≤ its ceiling |
 * | `capacity-hold.agent-over-threshold` | error | an agent- or system-placed hold is below the right's `agentHoldBelowMinutes` |
 * | `capacity-hold.lead-time-class-unknown` | error | the agreement has a class for the hold's lead time |
 * | `capacity-hold.lead-time-class-mismatch` | error | the claimed class is that class |
 * | `capacity-hold.late-release` | warning | a released hold was released by the right's notice deadline |
 *
 * @since 0.1.0
 * @module
 */
import { issue } from "../core/Issue.js";
import { isOutstanding, latestHolds } from "../work/CapacityHold.js";
import { isExecutedOn } from "./Agreement.js";
import { addBusinessDays, classFor, leadDays, mondayToFriday, subtractBusinessDays } from "./CapacityTerms.js";
import { partyKey } from "./Party.js";
const roleOf = (hold) => hold.subject.roleKey;
const rightIssues = ({ hold, right }, isBusinessDay) => {
    const days = leadDays(hold.bookedOn, hold.window.start);
    const role = roleOf(hold);
    const latestExpiry = addBusinessDays(hold.bookedOn, right.expiryBusinessDays, isBusinessDay);
    return [
        ...(partyKey(right.holder) === partyKey(hold.holder) && partyKey(right.provider) === `entity:${hold.provider}`
            ? []
            : [issue('capacity-hold.right-parties', 'error', hold.id, `hold right ${right.key} does not let this holder reserve this provider’s capacity`)]),
        ...(right.roleKeys === undefined || (role !== undefined && right.roleKeys.includes(role))
            ? []
            : [issue('capacity-hold.role-out-of-scope', 'error', hold.id, `hold right ${right.key} does not cover role ${role ?? '(none stated)'}`)]),
        ...(days >= right.minLeadDays ? [] : [issue('capacity-hold.lead-time-short', 'error', hold.id, `booked ${days} days ahead; the right requires ${right.minLeadDays}`)]),
        ...(hold.expiresAt.slice(0, 10) <= latestExpiry
            ? []
            : [issue('capacity-hold.expiry-exceeds-right', 'error', hold.id, `expiry is later than ${right.expiryBusinessDays} business days after booking (${latestExpiry})`)]),
    ];
};
/** Humans decide: a non-human actor holds only below the right's agent threshold. */
const agentIssues = ({ hold, right }) => {
    const threshold = right.agentHoldBelowMinutes;
    if (threshold === undefined || hold.heldBy._tag === 'human' || hold.minutes < threshold)
        return [];
    return [
        issue('capacity-hold.agent-over-threshold', 'error', hold.id, `a ${hold.heldBy._tag} may hold under ${threshold} minutes under right ${right.key}; a human acting for the holder places larger holds`),
    ];
};
const classIssues = ({ hold, agreement }) => {
    const classes = agreement.leadTimeClasses ?? [];
    if (classes.length === 0)
        return [];
    const days = leadDays(hold.bookedOn, hold.window.start);
    const expected = classFor(classes, days);
    if (expected === undefined)
        return [issue('capacity-hold.lead-time-class-unknown', 'error', hold.id, `the agreement has no lead-time class for ${days} days`)];
    return expected.key === hold.leadTimeClass ? [] : [issue('capacity-hold.lead-time-class-mismatch', 'error', hold.id, `${days} lead days is class ${expected.key}, not ${hold.leadTimeClass}`)];
};
const releaseIssues = ({ hold, right }, isBusinessDay) => {
    if (hold.state !== 'released' || hold.closedAt === undefined)
        return [];
    const deadline = subtractBusinessDays(hold.window.start, right.releaseNoticeBusinessDays, isBusinessDay);
    return hold.closedAt.slice(0, 10) <= deadline ? [] : [issue('capacity-hold.late-release', 'warning', hold.id, `released after the notice deadline ${deadline}`)];
};
const resolve = (hold, agreements) => {
    const agreement = agreements.get(hold.holdRight.agreementId);
    if (agreement === undefined)
        return issue('capacity-hold.agreement-unresolved', 'warning', hold.id, `agreement ${hold.holdRight.agreementId} is not in the set`);
    if (!isExecutedOn(agreement, hold.bookedOn))
        return issue('capacity-hold.agreement-not-executed', 'error', hold.id, 'a hold is valid only under an agreement executed and in force on its booking date');
    const right = (agreement.holdRights ?? []).find((entry) => entry.key === hold.holdRight.key);
    return right === undefined ? issue('capacity-hold.right-unknown', 'error', hold.id, `the agreement has no hold right ${hold.holdRight.key}`) : { hold, agreement, right };
};
/**
 * The most minutes held at once: holds count together only while their
 * half-open windows overlap (a window ending on a date frees its minutes
 * before one starting that date takes them).
 */
const peakMinutes = (holds) => {
    const events = holds
        .flatMap((hold) => [
        { on: hold.window.start, delta: hold.minutes },
        { on: hold.window.end, delta: -hold.minutes },
    ])
        .sort((left, right) => left.on.localeCompare(right.on) || left.delta - right.delta);
    let current = 0;
    let peak = { minutes: 0, on: '' };
    for (const event of events) {
        current += event.delta;
        if (current > peak.minutes)
            peak = { minutes: current, on: event.on };
    }
    return peak;
};
const ceilingIssues = (resolved) => {
    const outstanding = new Map();
    for (const entry of resolved.filter((candidate) => isOutstanding(candidate.hold))) {
        const key = `${entry.agreement.id}|${entry.right.key}`;
        outstanding.set(key, { right: entry.right, holds: [...(outstanding.get(key)?.holds ?? []), entry.hold] });
    }
    return [...outstanding].flatMap(([key, group]) => {
        const peak = peakMinutes(group.holds);
        return peak.minutes > group.right.maxOutstandingMinutes
            ? [issue('capacity-hold.exceeds-right-minutes', 'error', key, `${peak.minutes} minutes are held at once from ${peak.on}; the right allows ${group.right.maxOutstandingMinutes}`)]
            : [];
    });
};
/**
 * Check the latest revision of each hold against its agreement's hold right and lead-time classes.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateCapacityHolds = (holds, agreements, options = {}) => {
    const calendarFor = options.calendarFor ?? (() => mondayToFriday);
    const byId = new Map(agreements.map((agreement) => [agreement.id, agreement]));
    const outcomes = latestHolds(holds).map((hold) => resolve(hold, byId));
    const resolved = outcomes.filter((outcome) => 'right' in outcome);
    return [
        ...outcomes.filter((outcome) => 'code' in outcome),
        ...resolved.flatMap((entry) => [...rightIssues(entry, calendarFor(entry.right)), ...agentIssues(entry), ...classIssues(entry), ...releaseIssues(entry, calendarFor(entry.right))]),
        ...ceilingIssues(resolved),
    ];
};
//# sourceMappingURL=CapacityHoldCheck.js.map