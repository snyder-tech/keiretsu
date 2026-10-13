/** Portable ports. Hosts own authentication, transactional authority, domain writes and storage. */
import { Context, type Effect, Schema, type Stream } from 'effect';
import type { ExchangeErrorV03 } from './V03Bundle.ts';
import type { AuthenticatedContextV03, BundleContextV03, ChainV03, CommandV03, EnvelopeV03, RecordIdentityV03, RecordOutcomeV03, StoredInboundV03, UnsealedReceiptV03 } from './V03Contracts.ts';

export class StorageErrorV03 extends Schema.TaggedError<StorageErrorV03>()('StorageErrorV03', { reason: Schema.NonEmptyString }) {}
export class TransportErrorV03 extends Schema.TaggedError<TransportErrorV03>()('TransportErrorV03', {
  classification: Schema.Literals(['transient', 'permanent', 'ambiguous']),
  code: Schema.NonEmptyString,
}) {}
export class HostAuthorizationV03 extends Context.Service<HostAuthorizationV03, { readonly context: AuthenticatedContextV03; readonly self: EnvelopeV03['audience'] }>()(
  '@snyder-tech/keiretsu/exchange/HostAuthorizationV03',
) {}
export type AuthorizationDecisionV03 = { readonly allowed: true } | { readonly allowed: false; readonly reason: string };
export type StagingDecisionV03 =
  | { readonly outcome: 'staged'; readonly target: string; readonly expectedRevision: number; readonly operation: string; readonly payload: unknown }
  | { readonly outcome: 'held' | 'rejected'; readonly reason: string };
export interface TransactionV03 {
  readonly getChain: (pair: string) => ChainV03;
  readonly putChain: (pair: string, chain: ChainV03) => undefined;
  readonly getInbound: (key: string) => StoredInboundV03 | undefined;
  readonly putInbound: (inbound: StoredInboundV03) => undefined;
  readonly enqueueReceipt: (key: string, receipt: UnsealedReceiptV03) => undefined;
  /** Check authenticated principal, installation, counterparties and current policy in this transaction. */
  readonly authorizeBundle: (context: AuthenticatedContextV03, envelope: BundleContextV03, phase: 'validation' | 'application') => AuthorizationDecisionV03;
  readonly authorizeRecord: (context: AuthenticatedContextV03, envelope: BundleContextV03, identity: RecordIdentityV03, phase: 'validation' | 'application') => AuthorizationDecisionV03;
  readonly stage: (envelope: BundleContextV03, identity: RecordIdentityV03, record: unknown) => StagingDecisionV03;
  readonly currentRevision: (target: string) => number;
  /** Must implement the command and write its idempotency key in this same transaction. */
  readonly apply: (idempotencyKey: string, command: CommandV03) => undefined;
}
export class DurableInboxV03 extends Context.Service<
  DurableInboxV03,
  {
    /** Synchronous callback; no signing, network, Promise, or Effect execution in a transaction.
     * The adapter must serialize/CAS sequence and replay state, rollback throws and interruption,
     * and atomically join authority reads, domain writes, command idempotency, status and outbox.
     */
    readonly transaction: <A>(body: (transaction: TransactionV03) => { readonly result: A }) => Effect.Effect<A, StorageErrorV03 | ExchangeErrorV03>;
    readonly pendingReceipts: (limit: number) => Effect.Effect<ReadonlyArray<{ readonly key: string; readonly receipt: UnsealedReceiptV03; readonly signedText?: string }>, StorageErrorV03>;
    /** Atomically persist first signed bytes for a pending key and return the winner.
     * Concurrent signers and key rotation must never replace a previously frozen delivery.
     * Commit before returning; reject missing or acknowledged intents.
     */
    readonly freezeReceipt: (key: string, signedText: string) => Effect.Effect<string, StorageErrorV03>;
    readonly acknowledgeReceipt: (key: string) => Effect.Effect<void, StorageErrorV03>;
  }
>()('@snyder-tech/keiretsu/exchange/DurableInboxV03') {}
/** Pull one bounded delivery at a time. Implementations propagate interruption to their I/O. */
export class TransportV03 extends Context.Service<
  TransportV03,
  {
    readonly send: (delivery: { readonly key: string; readonly text: string }) => Effect.Effect<void, TransportErrorV03>;
    readonly receive: Stream.Stream<string, TransportErrorV03>;
  }
>()('@snyder-tech/keiretsu/exchange/TransportV03') {}
export type { BundleContextV03, ChainV03, RecordOutcomeV03, StoredInboundV03 };
