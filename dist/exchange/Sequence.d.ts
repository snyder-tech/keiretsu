import type { PartyRef } from '../core/PartyRef.ts';
/**
 * Delivery semantics: idempotency and the per-pair hash chain.
 *
 * Delivery is at-least-once; the effect is exactly-once through the
 * idempotency table keyed by `(issuer, audience, bundleId)`:
 * - same key, same digest → `duplicate` (answer with the stored receipt);
 * - same key, different digest → {@link ReplayConflict}, never processed.
 *
 * Bundles between a pair form a chain: `seq` contiguous from 1 and
 * `prevBundleDigest` equal to the previous bundle's `contentDigest`.
 * - a gap (`seq` ahead of the next expected) → `hold`; request a resend;
 * - a fork (a second bundle at an occupied `seq`, or a `prevBundleDigest` that
 *   does not match) → {@link ChainFork}; the pair halts until a human resolves it.
 *
 * Receivers call {@link SequenceStore} `admit` before applying records and
 * `commit` only after their own durable write, then acknowledge.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Option, Schema } from 'effect';
declare const ReplayConflict_base: Schema.Class<ReplayConflict, Schema.TaggedStruct<"ReplayConflict", {
    readonly pair: Schema.String;
    readonly bundleId: Schema.String;
    readonly storedDigest: Schema.String;
    readonly receivedDigest: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Same bundle id, different content: a replay or tampering, never processed.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ReplayConflict extends ReplayConflict_base {
}
declare const ChainFork_base: Schema.Class<ChainFork, Schema.TaggedStruct<"ChainFork", {
    readonly pair: Schema.String;
    readonly seq: Schema.Number;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Two histories for one pair. The pair is halted for human resolution.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ChainFork extends ChainFork_base {
}
/**
 * The chain coordinates of one bundle.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChainPosition {
    readonly issuer: string;
    readonly audience: PartyRef;
    readonly bundleId: string;
    readonly seq: number;
    readonly prevBundleDigest?: string | undefined;
    readonly contentDigest: string;
}
/**
 * What the receiver may do with a bundle.
 *
 * @since 0.1.0
 * @category models
 */
export type Admission = {
    readonly _tag: 'admit';
} | {
    readonly _tag: 'duplicate';
    readonly receipt: Option.Option<string>;
} | {
    readonly _tag: 'hold';
    readonly expectedSeq: number;
    readonly reason: string;
} | {
    readonly _tag: 'halted';
    readonly reason: string;
};
/**
 * Chain state of one pair.
 *
 * @since 0.1.0
 * @category models
 */
export interface PairStatus {
    readonly pair: string;
    readonly nextSeq: number;
    readonly headDigest: Option.Option<string>;
    readonly halted: Option.Option<string>;
}
declare const SequenceStore_base: Context.ServiceClass<SequenceStore, "@snyder-tech/keiretsu/exchange/SequenceStore", {
    readonly admit: (position: ChainPosition) => Effect.Effect<Admission, ReplayConflict | ChainFork>;
    /** Record an admitted bundle and its receipt text after the receiver's durable write. */
    readonly commit: (input: {
        readonly position: ChainPosition;
        readonly receipt: string;
    }) => Effect.Effect<void, ChainFork>;
    readonly status: (pair: {
        readonly issuer: string;
        readonly audience: PartyRef;
    }) => Effect.Effect<PairStatus>;
}>;
/**
 * Idempotency table and per-pair chain heads.
 *
 * @since 0.1.0
 * @category services
 */
export declare class SequenceStore extends SequenceStore_base {
}
/**
 * Pair key `issuer→audience`.
 *
 * @since 0.1.0
 * @category keys
 */
export declare const pairKey: (pair: {
    readonly issuer: string;
    readonly audience: PartyRef;
}) => string;
/**
 * In-memory store (tests, single-process adopters). Durable adapters (SQL, KV, file) ship separately.
 *
 * @since 0.1.0
 * @category layers
 */
export declare const layerMemory: Layer.Layer<SequenceStore>;
export {};
//# sourceMappingURL=Sequence.d.ts.map