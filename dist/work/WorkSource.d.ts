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
declare const WorkSourceError_base: Schema.Class<WorkSourceError, Schema.TaggedStruct<"WorkSourceError", {
    readonly system: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A source system could not be read or a record could not be mapped.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class WorkSourceError extends WorkSourceError_base {
}
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
declare const WorkSource_base: Context.ServiceClass<WorkSource, "@snyder-tech/keiretsu/work/WorkSource", WorkSourceShape>;
/**
 * The work source service.
 *
 * @since 0.1.0
 * @category services
 */
export declare class WorkSource extends WorkSource_base {
}
/**
 * An in-memory source for tests: events ordered by recorded time, paged by position.
 *
 * @since 0.1.0
 * @category layers
 */
export declare const layerInMemory: (options: {
    readonly system: string;
    readonly events: ReadonlyArray<EconomicEvent>;
    readonly pageSize: number;
}) => Layer.Layer<WorkSource>;
/**
 * Read every page from a cursor until caught up.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const fetchAll: (cursor?: string) => Effect.Effect<ReadonlyArray<EconomicEvent>, WorkSourceError, WorkSource>;
export {};
//# sourceMappingURL=WorkSource.d.ts.map