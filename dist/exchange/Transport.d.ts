/**
 * Transport: moves raw bundle and receipt text between parties.
 *
 * A transport never decodes, re-serialises or "fixes" what it carries; the
 * receiver digests the exact text it gets. Delivery is at-least-once, so the
 * receiver's `SequenceStore` supplies idempotency. Adapters (HTTPS POST
 * with `Idempotency-Key`, queue via CloudEvents, MCP tool) ship separately;
 * {@link layerMemory} is a file-drop-like in-memory mailbox for tests.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer } from 'effect';
/**
 * One delivered message.
 *
 * @since 0.1.0
 * @category models
 */
export interface Delivery {
    /** File-like name, e.g. `<bundleId>.kwx.json`. */
    readonly name: string;
    readonly from: string;
    readonly text: string;
}
declare const Transport_base: Context.ServiceClass<Transport, "@snyder-tech/keiretsu/exchange/Transport", {
    readonly send: (message: {
        readonly to: string;
        readonly from: string;
        readonly name: string;
        readonly text: string;
    }) => Effect.Effect<void>;
    /** Drain a mailbox in arrival order. */
    readonly receive: (mailbox: string) => Effect.Effect<ReadonlyArray<Delivery>>;
}>;
/**
 * Send and receive raw text by mailbox (a party key).
 *
 * @since 0.1.0
 * @category services
 */
export declare class Transport extends Transport_base {
}
/**
 * In-memory drop directory per mailbox. Re-sending identical text under the
 * same name is a no-op (like overwriting a file with the same bytes); different
 * text under a taken name is kept under a suffixed name so nothing is lost.
 *
 * @since 0.1.0
 * @category layers
 */
export declare const layerMemory: Layer.Layer<Transport>;
export {};
//# sourceMappingURL=Transport.d.ts.map