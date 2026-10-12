/**
 * Source adapter port. Each work system (PSA, time sheet, task tracker, work
 * journal) is a `Layer` providing {@link WorkSource}: fetch economic events
 * recorded since a cursor. Adapters map vendor records to events and never
 * invent missing facts; a record that cannot be mapped fails with
 * {@link WorkSourceError} (or the adapter emits a hold upstream).
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Schema } from 'effect';
/**
 * A source system could not be read or a record could not be mapped.
 *
 * @since 0.1.0
 * @category errors
 */
export class WorkSourceError extends Schema.TaggedError()('WorkSourceError', { system: Schema.String, reason: Schema.String }) {
}
/**
 * The work source service.
 *
 * @since 0.1.0
 * @category services
 */
export class WorkSource extends Context.Service()('@snyder-tech/keiretsu/work/WorkSource') {
}
const order = (left, right) => left.recordedAt === right.recordedAt ? (left.id < right.id ? -1 : left.id > right.id ? 1 : left.revision - right.revision) : left.recordedAt < right.recordedAt ? -1 : 1;
const parseCursor = (system, cursor) => {
    if (cursor === undefined)
        return Effect.succeed(0);
    return /^(?:0|[1-9]\d*)$/.test(cursor) ? Effect.succeed(Number(cursor)) : Effect.fail(new WorkSourceError({ system, reason: `invalid cursor ${cursor}` }));
};
/**
 * An in-memory source for tests: events ordered by recorded time, paged by position.
 *
 * @since 0.1.0
 * @category layers
 */
export const layerInMemory = (options) => {
    const sorted = [...options.events].sort(order);
    const pageSize = Math.max(1, Math.trunc(options.pageSize));
    return Layer.succeed(WorkSource, {
        system: options.system,
        fetchSince: (cursor) => Effect.map(parseCursor(options.system, cursor), (start) => {
            const end = Math.min(start + pageSize, sorted.length);
            return { events: sorted.slice(start, end), nextCursor: end < sorted.length ? String(end) : undefined };
        }),
    });
};
/**
 * Read every page from a cursor until caught up.
 *
 * @since 0.1.0
 * @category combinators
 */
export const fetchAll = (cursor) => Effect.gen(function* () {
    const source = yield* WorkSource;
    const events = [];
    let next = cursor;
    do {
        const page = yield* source.fetchSince(next);
        events.push(...page.events);
        next = page.nextCursor;
    } while (next !== undefined);
    return events;
});
//# sourceMappingURL=WorkSource.js.map