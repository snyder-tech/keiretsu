import type { PartyRef } from '../core/PartyRef.ts';
/**
 * Delivery semantics: idempotency and the per-pair hash chain.
 *
 * Delivery is at-least-once. Serialized calls track validated receipts through
 * an idempotency table keyed by `(issuer, audience, bundleId)`:
 * - same key, same digest → `duplicate` (answer with the stored receipt);
 * - same key, different digest → {@link ReplayConflict}, never processed.
 *
 * Bundles between a pair form a chain: `seq` contiguous from 1 and
 * `prevBundleDigest` equal to the previous bundle's `contentDigest`.
 * - a gap (`seq` ahead of the next expected) → `hold`; request a resend;
 * - a fork (a second bundle at an occupied `seq`, or a `prevBundleDigest` that
 *   does not match) → {@link ChainFork}; the pair halts until a human resolves it.
 *
 * The memory store provides process-local receipt tracking, with no reservation
 * between `admit` and `commit`. It does not apply business records or provide a
 * durable transaction. Hosts own atomic application writes, durable idempotency
 * and acknowledgment together.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Option, Schema } from 'effect';

import { partyKey } from './Party.ts';

/**
 * Same bundle id, different content: a replay or tampering, never processed.
 *
 * @since 0.1.0
 * @category errors
 */
export class ReplayConflict extends Schema.TaggedError<ReplayConflict>()('ReplayConflict', {
  pair: Schema.String,
  bundleId: Schema.String,
  storedDigest: Schema.String,
  receivedDigest: Schema.String,
}) {}

/**
 * Two histories for one pair. The pair is halted for human resolution.
 *
 * @since 0.1.0
 * @category errors
 */
export class ChainFork extends Schema.TaggedError<ChainFork>()('ChainFork', {
  pair: Schema.String,
  seq: Schema.Number,
  reason: Schema.String,
}) {}

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
export type Admission =
  | { readonly _tag: 'admit' }
  | { readonly _tag: 'duplicate'; readonly receipt: Option.Option<string> }
  | { readonly _tag: 'hold'; readonly expectedSeq: number; readonly reason: string }
  | { readonly _tag: 'halted'; readonly reason: string };

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

/**
 * Idempotency table and per-pair chain heads.
 *
 * @since 0.1.0
 * @category services
 */
export class SequenceStore extends Context.Service<
  SequenceStore,
  {
    readonly admit: (position: ChainPosition) => Effect.Effect<Admission, ReplayConflict | ChainFork>;
    /** Record an admitted bundle and its receipt text; host application writes remain separate. */
    readonly commit: (input: { readonly position: ChainPosition; readonly receipt: string }) => Effect.Effect<void, ChainFork>;
    readonly status: (pair: { readonly issuer: string; readonly audience: PartyRef }) => Effect.Effect<PairStatus>;
  }
>()('@snyder-tech/keiretsu/exchange/SequenceStore') {}

/**
 * Pair key `issuer→audience`.
 *
 * @since 0.1.0
 * @category keys
 */
export const pairKey = (pair: { readonly issuer: string; readonly audience: PartyRef }): string => `${`entity:${pair.issuer.toLowerCase()}`}->${partyKey(pair.audience)}`;

interface PairState {
  nextSeq: number;
  halted: string | undefined;
  readonly bySeq: Map<number, string>;
  readonly byBundle: Map<string, { readonly digest: string; readonly receipt: string | undefined }>;
}

const emptyPair = (): PairState => ({ nextSeq: 1, halted: undefined, bySeq: new Map(), byBundle: new Map() });

const forkOf = (state: PairState, pair: string, position: ChainPosition): ChainFork | undefined => {
  if (position.seq < state.nextSeq) return new ChainFork({ pair, seq: position.seq, reason: `seq ${position.seq} is already held by another bundle` });
  if (position.seq !== state.nextSeq || position.seq === 1) return undefined;
  const previous = state.bySeq.get(position.seq - 1);
  return position.prevBundleDigest === previous ? undefined : new ChainFork({ pair, seq: position.seq, reason: 'prevBundleDigest does not match the previous bundle' });
};

const admitIn = (state: PairState, pair: string, position: ChainPosition): Effect.Effect<Admission, ReplayConflict | ChainFork> => {
  const bundleId = position.bundleId.toLowerCase();
  const seen = state.byBundle.get(bundleId);
  if (seen !== undefined) {
    return seen.digest === position.contentDigest
      ? Effect.succeed({ _tag: 'duplicate', receipt: Option.fromNullishOr(seen.receipt) })
      : Effect.fail(new ReplayConflict({ pair, bundleId, storedDigest: seen.digest, receivedDigest: position.contentDigest }));
  }
  if (state.halted !== undefined) return Effect.succeed({ _tag: 'halted', reason: state.halted });
  const fork = forkOf(state, pair, position);
  if (fork !== undefined) {
    state.halted = fork.reason;
    return Effect.fail(fork);
  }
  if (position.seq > state.nextSeq) return Effect.succeed({ _tag: 'hold', expectedSeq: state.nextSeq, reason: `gap: expected seq ${state.nextSeq}, received ${position.seq}` });
  return Effect.succeed({ _tag: 'admit' });
};

/**
 * In-memory store (tests, single-process adopters). Durable adapters (SQL, KV, file) ship separately.
 *
 * @since 0.1.0
 * @category layers
 */
export const layerMemory: Layer.Layer<SequenceStore> = Layer.sync(SequenceStore, () => {
  const pairs = new Map<string, PairState>();
  const stateOf = (key: string): PairState => {
    const existing = pairs.get(key);
    if (existing !== undefined) return existing;
    const created = emptyPair();
    pairs.set(key, created);
    return created;
  };
  return {
    admit: (position) => Effect.suspend(() => admitIn(stateOf(pairKey(position)), pairKey(position), position)),
    commit: ({ position, receipt }) =>
      Effect.suspend(() => {
        const key = pairKey(position);
        const state = stateOf(key);
        if (state.halted !== undefined || position.seq !== state.nextSeq) return Effect.fail(new ChainFork({ pair: key, seq: position.seq, reason: 'the chain moved between admit and commit' }));
        state.bySeq.set(position.seq, position.contentDigest);
        state.byBundle.set(position.bundleId.toLowerCase(), { digest: position.contentDigest, receipt });
        state.nextSeq += 1;
        return Effect.void;
      }),
    status: (pair) =>
      Effect.sync(() => {
        const key = pairKey(pair);
        const state = stateOf(key);
        return { pair: key, nextSeq: state.nextSeq, headDigest: Option.fromNullishOr(state.bySeq.get(state.nextSeq - 1)), halted: Option.fromNullishOr(state.halted) };
      }),
  };
});
