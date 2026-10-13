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

import { compareInstants } from '../core/Temporal.ts';

import type { EconomicEvent } from './EconomicEvent.ts';

/**
 * One page of events and the cursor to resume from (`undefined` when caught up).
 *
 * @since 0.1.0
 * @category models
 */
export interface SourcePage {
  readonly events: ReadonlyArray<EconomicEvent>;
  readonly nextCursor: string | undefined;
}

/**
 * A source system could not be read or a record could not be mapped.
 *
 * @since 0.1.0
 * @category errors
 */
export class WorkSourceError extends Schema.TaggedError<WorkSourceError>()('WorkSourceError', { system: Schema.String, reason: Schema.String }) {}

/**
 * The adapter contract.
 *
 * @since 0.1.0
 * @category models
 */
export interface WorkSourceShape {
  readonly system: string;
  readonly fetchSince: (cursor: string | undefined) => Effect.Effect<SourcePage, WorkSourceError>;
}

/**
 * The work source service.
 *
 * @since 0.1.0
 * @category services
 */
export class WorkSource extends Context.Service<WorkSource, WorkSourceShape>()('@snyder-tech/keiretsu/work/WorkSource') {}

const order = (left: EconomicEvent, right: EconomicEvent): number => {
  const time = compareInstants(left.recordedAt, right.recordedAt);
  return time === 0 ? (left.id < right.id ? -1 : left.id > right.id ? 1 : left.revision - right.revision) : time;
};

const parseCursor = (system: string, cursor: string | undefined): Effect.Effect<number, WorkSourceError> => {
  if (cursor === undefined) return Effect.succeed(0);
  return /^(?:0|[1-9]\d*)$/.test(cursor) && Number.isSafeInteger(Number(cursor)) ? Effect.succeed(Number(cursor)) : Effect.fail(new WorkSourceError({ system, reason: `invalid cursor ${cursor}` }));
};

/**
 * An in-memory source for tests: events ordered by recorded time, paged by position.
 *
 * @since 0.1.0
 * @category layers
 */
export const layerInMemory = (options: { readonly system: string; readonly events: ReadonlyArray<EconomicEvent>; readonly pageSize: number }): Layer.Layer<WorkSource> => {
  const sorted = [...options.events].sort(order);
  if (!Number.isSafeInteger(options.pageSize) || options.pageSize <= 0) throw new RangeError('pageSize must be a positive safe integer');
  const pageSize = options.pageSize;
  return Layer.succeed(WorkSource, {
    system: options.system,
    fetchSince: (cursor) =>
      Effect.map(parseCursor(options.system, cursor), (start) => {
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
export const fetchAll = (cursor?: string): Effect.Effect<ReadonlyArray<EconomicEvent>, WorkSourceError, WorkSource> =>
  Effect.gen(function* () {
    const source = yield* WorkSource;
    const events: Array<EconomicEvent> = [];
    let next: string | undefined = cursor;
    do {
      const page: SourcePage = yield* source.fetchSince(next);
      events.push(...page.events);
      next = page.nextCursor;
    } while (next !== undefined);
    return events;
  });
