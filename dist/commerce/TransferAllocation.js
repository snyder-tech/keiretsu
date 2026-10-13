/**
 * Transfer allocations: minutes of one attested labour event moved along one
 * route under one binding.
 *
 * Allocations are revisioned (event id + event revision, allocation revision).
 * Re-routing reverses an allocation and creates a replacement that names it;
 * attested time is never touched. Conservation: active minutes allocated from
 * an event revision never exceed the event's minutes.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Sha256 } from "../core/CanonicalJson.js";
import { revisionChain, RevisionFields } from "../core/Envelope.js";
import { EventId, RouteId } from "../core/Ids.js";
import { Period } from "../core/Temporal.js";
import { AllocationId, RouteBindingId } from "./CommerceIds.js";
import { fault, rule, toCheck } from "./Invariant.js";
const Revision = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1));
/**
 * Allocation invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const allocationRules = {
    positive: rule('allocation.minutes-not-positive', (allocation) => (allocation.minutes > 0 ? undefined : 'an allocation moves at least one minute')),
    reversalSelf: rule('allocation.reverses-itself', (allocation) => allocation.reversesAllocationId === allocation.id ? 'a replacement names a different allocation' : undefined),
};
/**
 * An allocation.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TransferAllocation = Schema.Struct({
    id: AllocationId,
    ...RevisionFields,
    period: Period,
    eventId: EventId,
    eventRevision: Revision,
    eventDigest: Schema.optional(Sha256),
    routeId: RouteId,
    routeRevision: Revision,
    bindingId: RouteBindingId,
    minutes: Schema.Number.check(Schema.isInt()),
    state: Schema.Literals(['active', 'reversed']),
    /** Set on a replacement: the allocation it replaces, which must be reversed. */
    reversesAllocationId: Schema.optional(AllocationId),
}).check(revisionChain, toCheck(allocationRules.positive), toCheck(allocationRules.reversalSelf));
/**
 * Keep the highest revision of each allocation id, independent of input order.
 *
 * @since 0.1.0
 * @category combinators
 */
export const latestAllocations = (allocations) => {
    const latest = new Map();
    for (const allocation of allocations) {
        const current = latest.get(allocation.id);
        if (current === undefined || allocation.revision > current.revision)
            latest.set(allocation.id, allocation);
    }
    return [...latest.values()];
};
const checkReversal = (byId, allocation) => {
    if (allocation.reversesAllocationId === undefined)
        return [];
    const target = byId.get(allocation.reversesAllocationId);
    if (target === undefined)
        return [fault('allocation.reversal-target-unresolved', allocation.id, `allocation ${allocation.reversesAllocationId} is not in the set`, 'warning')];
    return target.state === 'reversed'
        ? []
        : [fault('allocation.reversal-target-active', allocation.id, `allocation ${allocation.reversesAllocationId} is still active; a replacement may only point at a reversed allocation`)];
};
const checkEvent = (events, allocation) => {
    const event = events.get(allocation.eventId);
    if (event === undefined)
        return [fault('allocation.event-unresolved', allocation.id, `event ${allocation.eventId} is not in the set`, 'warning')];
    return allocation.state === 'active' && allocation.eventRevision !== event.revision
        ? [fault('allocation.stale-event-revision', allocation.id, `allocates event revision ${allocation.eventRevision}; latest is ${event.revision}`)]
        : [];
};
const checkConservation = (events, active) => {
    const totals = new Map();
    for (const allocation of active) {
        const key = `${allocation.eventId}#${allocation.eventRevision}`;
        totals.set(key, (totals.get(key) ?? 0) + allocation.minutes);
    }
    return [...totals.entries()].flatMap(([key, allocated]) => {
        const [eventId = '', revision = ''] = key.split('#');
        const event = events.get(eventId);
        return event !== undefined && String(event.revision) === revision && allocated > event.minutes
            ? [fault('allocation.minutes-over-allocated', eventId, `${allocated} minutes allocated from a ${event.minutes}-minute event`)]
            : [];
    });
};
/**
 * Cross-record checks: conservation, reversal chains and stale event revisions.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateAllocations = (options) => {
    const latest = latestAllocations(options.allocations);
    const byId = new Map(latest.map((allocation) => [allocation.id, allocation]));
    const events = new Map(options.events.map((event) => [event.id, event]));
    const active = latest.filter((allocation) => allocation.state === 'active');
    return [...latest.flatMap((allocation) => [...checkReversal(byId, allocation), ...checkEvent(events, allocation)]), ...checkConservation(events, active)];
};
/**
 * Active minutes allocated for a set of allocation ids (latest revisions).
 *
 * @since 0.1.0
 * @category accessors
 */
export const activeMinutes = (allocations, ids) => {
    const wanted = new Set(ids);
    return latestAllocations(allocations)
        .filter((allocation) => wanted.has(allocation.id) && allocation.state === 'active')
        .reduce((sum, allocation) => sum + allocation.minutes, 0);
};
//# sourceMappingURL=TransferAllocation.js.map