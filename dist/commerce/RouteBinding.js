/**
 * Route bindings: a work object (and everything logged against it) bound to a
 * transfer route for an interval, with the share of each minute the route takes.
 *
 * Routes live here, never on time records: re-routing changes bindings and
 * allocations, not attested time.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { EntityId, RouteId } from "../core/Ids.js";
import { contains, Instant, IsoDate } from "../core/Temporal.js";
import { RouteBindingId } from "./CommerceIds.js";
import { fault } from "./Invariant.js";
import { PartyRef } from "./Party.js";
import { WorkObjectRef, workObjectKey } from "./WorkObjectRef.js";
/**
 * Who ultimately benefits. `unknown` is a legitimate answer at capture time
 * (internal investment may later be sold); it is never defaulted.
 *
 * @since 0.1.0
 * @category schemas
 */
export const EndCustomer = Schema.TaggedUnion({
    external: { party: PartyRef },
    internal: { owner: EntityId },
    unknown: {},
});
/**
 * A binding.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RouteBinding = Schema.Struct({
    id: RouteBindingId,
    ...RevisionFields,
    workObject: WorkObjectRef,
    routeId: RouteId,
    endCustomer: EndCustomer,
    /** Share of each bound minute this route takes. Bindings in force on one work object sum to at most 10000. */
    shareBps: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 10_000 })),
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    recordedAt: Instant,
}).check(revisionChain, validInterval);
/**
 * Keep the highest revision of each binding id.
 *
 * @since 0.1.0
 * @category combinators
 */
export const latestBindings = (bindings) => {
    const latest = new Map();
    for (const binding of bindings) {
        const current = latest.get(binding.id);
        if (current === undefined || binding.revision > current.revision)
            latest.set(binding.id, binding);
    }
    return [...latest.values()];
};
/**
 * Bindings in force on any day share out at most the whole minute
 * (`binding.shares-exceed-whole`). Half-open intervals change only at start
 * dates, so testing every start date is exhaustive.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateBindings = (bindings) => {
    const byObject = new Map();
    for (const binding of latestBindings(bindings)) {
        const key = workObjectKey(binding.workObject);
        byObject.set(key, [...(byObject.get(key) ?? []), binding]);
    }
    return [...byObject.entries()].flatMap(([key, group]) => {
        const starts = [...new Set(group.map((binding) => binding.validFrom))].sort();
        const breach = starts.find((date) => group.filter((binding) => contains(binding, date)).reduce((sum, binding) => sum + binding.shareBps, 0) > 10_000);
        return breach === undefined ? [] : [fault('binding.shares-exceed-whole', key, `bindings in force on ${breach} share more than 10000 bps`)];
    });
};
/**
 * Bindings for a work object in force on a date.
 *
 * @since 0.1.0
 * @category lookups
 */
export const bindingsOn = (bindings, options) => latestBindings(bindings).filter((binding) => workObjectKey(binding.workObject) === workObjectKey(options.workObject) && contains(binding, options.date));
//# sourceMappingURL=RouteBinding.js.map