/** Restart-safe two-stage admission/application. No domain writes occur on classification. */
import { Clock, Effect, Option, Schema } from 'effect';
import { Instant } from '../core/Temporal.ts';
import { BUNDLE_TYP, verify } from './Jws.ts';
import type { KeyResolver } from './KeyResolver.ts';
import { partyKey } from './Party.ts';
import type { DescriptorMap } from './Profile.ts';
import { bindingOfV03, type ExchangeErrorV03, failV03, openV03, type OpenedV03 } from './V03Bundle.ts';
import { aggregateV03, AuthenticatedContextV03, CommandV03, type LimitsV03, type RecordIdentityV03, RecordOutcomeV03, type RecordV03, type UnsealedReceiptV03 } from './V03Contracts.ts';
import { DurableInboxV03, HostAuthorizationV03, type StoredInboundV03, type TransactionV03 } from './V03Ports.ts';
import { sealReceiptV03 } from './V03Receipt.ts';
import { validateJwsV03 } from './internal/V03Jws.ts';

export const pairKeyV03 = (envelope: OpenedV03['envelope']) => JSON.stringify([envelope.issuer.toLowerCase(), partyKey(envelope.audience)]);
export const inboundKeyV03 = (envelope: OpenedV03['envelope']) => JSON.stringify([envelope.issuer.toLowerCase(), partyKey(envelope.audience), envelope.bundleId.toLowerCase()]);
const row = (identity: RecordIdentityV03, outcome: RecordOutcomeV03['outcome'], reason: string): RecordOutcomeV03 => {
  const checked = Schema.decodeUnknownOption(RecordOutcomeV03)({ index: identity.index, kind: identity.kind, schema: identity.schema, recordDigest: identity.recordDigest, outcome, reason });
  if (Option.isNone(checked)) throw failV03('v03.adapter.command', 'host returned an invalid public record outcome');
  return checked.value;
};
const now = Effect.map(Clock.currentTimeMillis, (millis) => Schema.decodeUnknownSync(Instant)(new Date(Number(millis)).toISOString()));
const receipt = (input: { readonly opened: OpenedV03; readonly at: Instant; readonly phase: UnsealedReceiptV03['phase']; readonly rows: ReadonlyArray<RecordOutcomeV03> }): UnsealedReceiptV03 => ({
  specVersion: '0.3',
  bundleId: input.opened.envelope.bundleId,
  issuer: input.opened.envelope.issuer,
  receiver: input.opened.envelope.audience,
  seq: input.opened.envelope.seq,
  contentDigest: input.opened.envelope.contentDigest,
  receivedAt: input.at,
  phase: input.phase,
  records: input.rows,
  outcome: aggregateV03(input.rows),
});
interface Classified {
  readonly identity: RecordIdentityV03;
  readonly row: RecordOutcomeV03;
  readonly value?: unknown;
}
const classify = (opened: OpenedV03, descriptors: DescriptorMap): Effect.Effect<ReadonlyArray<Classified>> =>
  Effect.forEach(
    opened.identities,
    (identity) => {
      const entry = opened.envelope.records[identity.index];
      const descriptor = Object.hasOwn(descriptors, identity.kind) ? descriptors[identity.kind] : undefined;
      if (entry === undefined || descriptor === undefined || descriptor.schemaId !== identity.schema)
        return Effect.succeed({ identity, row: row(identity, 'rejected', 'record kind or schema identity is not supported') });
      return Schema.decodeUnknownEffect(descriptor.jsonCodec)(entry.record, { onExcessProperty: 'error' }).pipe(
        Effect.map((value) => ({ identity, value, row: row(identity, 'classified', 'record matches its registered schema') })),
        Effect.catch(() => Effect.succeed({ identity, row: row(identity, 'invalid', 'record does not match its registered schema') })),
      );
    },
    { concurrency: 1 },
  );

interface Admission {
  readonly tag: 'admitted' | 'duplicate' | 'held' | 'rejected';
  readonly classification: UnsealedReceiptV03;
  readonly validation: UnsealedReceiptV03;
}
const validateRecord = (input: {
  readonly tx: TransactionV03;
  readonly host: typeof HostAuthorizationV03.Service;
  readonly opened: OpenedV03;
  readonly classified: Classified;
}): { readonly row: RecordOutcomeV03; readonly command?: CommandV03 } => {
  const { tx, host, opened, classified } = input;
  if (classified.row.outcome !== 'classified') return { row: classified.row };
  const authority = tx.authorizeRecord(host.context, opened.envelope, classified.identity, 'validation');
  if (!authority.allowed) return { row: row(classified.identity, 'unauthorized', authority.reason) };
  const cohort = opened.envelope.records[classified.identity.index]?.cohort;
  if (cohort?.mode === 'dependency') return { row: row(classified.identity, 'held', 'dependency cohorts are unsupported by the independent-record profile') };
  const staged = tx.stage(opened.envelope, classified.identity, classified.value);
  if (staged.outcome !== 'staged') return { row: row(classified.identity, staged.outcome, staged.reason) };
  const command = Schema.decodeUnknownOption(CommandV03)({
    ...classified.identity,
    target: staged.target,
    expectedRevision: staged.expectedRevision,
    operation: staged.operation,
    payload: staged.payload,
    ...(cohort === undefined ? {} : { cohort }),
  });
  if (Option.isNone(command)) throw failV03('v03.adapter.command', 'host staging returned an invalid command');
  return { row: row(classified.identity, 'staged', 'authorized command staged; business application is pending'), command: command.value };
};
type StagedRow = { row: RecordOutcomeV03; command?: CommandV03 };
const repeatedCorrectionTargets = (staged: ReadonlyArray<StagedRow>): ReadonlySet<string> => {
  const blocked = new Set<string>();
  const targets = new Map<string, Set<string>>();
  for (const value of staged) {
    const command = value.command;
    if (command?.cohort === undefined) continue;
    const seen = targets.get(command.cohort.id) ?? new Set<string>();
    if (seen.has(command.target)) blocked.add(command.cohort.id);
    seen.add(command.target);
    targets.set(command.cohort.id, seen);
  }
  return blocked;
};
const failedCorrection = (entry: RecordV03, staged: StagedRow | undefined): string | undefined => {
  if (entry.cohort?.mode !== 'atomic-correction') return undefined;
  return staged?.row.outcome !== 'staged' ? entry.cohort.id : undefined;
};
const holdCorrectionCohorts = (opened: OpenedV03, staged: Array<StagedRow>) => {
  const blocked = new Set(repeatedCorrectionTargets(staged));
  for (const [index, entry] of opened.envelope.records.entries()) {
    const id = failedCorrection(entry, staged[index]);
    if (id !== undefined) blocked.add(id);
  }
  for (const [index, entry] of opened.envelope.records.entries()) {
    const value = staged[index];
    if (value !== undefined && entry.cohort?.mode === 'atomic-correction' && blocked.has(entry.cohort.id))
      staged[index] = { row: row(value.row, 'held', 'atomic correction cohort has an invalid, denied or held member') };
  }
};
const admit = (input: {
  readonly tx: TransactionV03;
  readonly host: typeof HostAuthorizationV03.Service;
  readonly opened: OpenedV03;
  readonly classified: ReadonlyArray<Classified>;
  readonly at: Instant;
}): Admission => {
  const { tx, opened, host } = input;
  const classification = receipt({ opened, at: input.at, phase: 'classification', rows: input.classified.map((value) => value.row) });
  const denied = tx.authorizeBundle(host.context, opened.envelope, 'validation');
  if (!denied.allowed)
    return {
      tag: 'rejected',
      classification,
      validation: receipt({ opened, at: input.at, phase: 'validation', rows: opened.identities.map((identity) => row(identity, 'unauthorized', denied.reason)) }),
    };
  const key = inboundKeyV03(opened.envelope);
  const existing = tx.getInbound(key);
  if (existing !== undefined) {
    if (existing.envelope.contentDigest !== opened.envelope.contentDigest) throw failV03('v03.sequence.replay', 'bundle id already binds different content');
    return { tag: 'duplicate', classification: existing.classification, validation: existing.validation };
  }
  const pair = pairKeyV03(opened.envelope);
  const chain = tx.getChain(pair);
  const held = (reason: string): Admission => ({
    tag: 'held',
    classification,
    validation: receipt({ opened, at: input.at, phase: 'validation', rows: opened.identities.map((identity) => row(identity, 'held', reason)) }),
  });
  if (chain.halted) return held('chain is halted pending host resolution');
  if (opened.envelope.seq > chain.seq + 1) return held('sequence gap; resend the preceding bundle');
  if (opened.envelope.seq !== chain.seq + 1 || opened.envelope.prevBundleDigest !== chain.digest) {
    tx.putChain(pair, { ...chain, halted: true });
    return held('sequence fork; chain halted');
  }
  const staged = input.classified.map((classified) => validateRecord({ tx, host, opened, classified }));
  holdCorrectionCohorts(opened, staged);
  const validation = receipt({ opened, at: input.at, phase: 'validation', rows: staged.map((value) => value.row) });
  const { records: _records, signature: _signature, ...envelope } = opened.envelope;
  tx.putInbound({ key, envelope, identities: opened.identities, classification, validation, commands: staged.flatMap((value) => (value.command === undefined ? [] : [value.command])) });
  tx.putChain(pair, { seq: envelope.seq, digest: envelope.contentDigest, halted: false });
  tx.enqueueReceipt(`${key}:classification`, classification);
  tx.enqueueReceipt(`${key}:validation`, validation);
  return { tag: 'admitted', classification, validation };
};

/** Tx1 atomically stores sequence/replay state, permitted payload, commands and receipt intents. */
export const receiveV03 = (options: { readonly text: string; readonly limits: LimitsV03; readonly descriptors: DescriptorMap }) =>
  Effect.gen(function* () {
    const host = yield* HostAuthorizationV03;
    yield* Schema.decodeUnknownEffect(AuthenticatedContextV03)(host.context).pipe(Effect.mapError(() => failV03('v03.authorization.context', 'authenticated host context is required')));
    const opened = yield* openV03(options.text, options.limits);
    if (partyKey(host.self) !== partyKey(opened.envelope.audience)) return yield* Effect.fail(failV03('v03.bundle.audience', 'bundle is addressed to another installation'));
    if (opened.envelope.signature === undefined) return yield* Effect.fail(failV03('v03.bundle.signature', '0.3 admission requires authenticated issuer signatures'));
    yield* validateJwsV03({ jws: opened.envelope.signature, typ: BUNDLE_TYP, limits: options.limits });
    const issues = yield* verify(opened.envelope.signature, {
      signer: opened.envelope.issuer,
      typ: BUNDLE_TYP,
      binding: bindingOfV03(opened.envelope),
      payload: opened.envelope.contentDigest,
      subject: opened.envelope.bundleId,
    });
    if (issues.length !== 0) return yield* Effect.fail(failV03('v03.bundle.signature', 'issuer signature verification failed'));
    const classified = yield* classify(opened, options.descriptors);
    const store = yield* DurableInboxV03;
    const at = yield* now;
    const result = yield* store.transaction((tx) => ({ result: admit({ tx, host, opened, classified, at }) }));
    const original = yield* sealReceiptV03(result.validation);
    const validation = result.tag === 'duplicate' ? yield* sealReceiptV03({ ...result.validation, originalReceiptDigest: original.receipt.receiptDigest }) : original;
    return { tag: result.tag, key: inboundKeyV03(opened.envelope), classification: yield* sealReceiptV03(result.classification), validation };
  });

const checkCommand = (tx: TransactionV03, inbound: StoredInboundV03, host: typeof HostAuthorizationV03.Service, command: CommandV03): RecordOutcomeV03 => {
  const authority = tx.authorizeRecord(host.context, inbound.envelope, command, 'application');
  if (!authority.allowed) return row(command, 'unauthorized', authority.reason);
  if (tx.currentRevision(command.target) !== command.expectedRevision) return row(command, 'conflict', 'expected domain revision changed since validation');
  return row(command, 'applied', 'authorized command applied in the application transaction');
};
const applyGroup = (input: {
  readonly tx: TransactionV03;
  readonly inbound: StoredInboundV03;
  readonly host: typeof HostAuthorizationV03.Service;
  readonly commands: ReadonlyArray<CommandV03>;
  readonly applicationId: string;
}): ReadonlyArray<RecordOutcomeV03> => {
  if (new Set(input.commands.map((command) => command.target)).size !== input.commands.length)
    return input.commands.map((command) => row(command, 'held', 'atomic correction commands must address distinct domain targets'));
  const results = input.commands.map((command) => checkCommand(input.tx, input.inbound, input.host, command));
  if (results.some((value) => value.outcome !== 'applied'))
    return results.map((value) => (value.outcome === 'applied' ? row(value, 'held', 'atomic correction cohort did not pass current authority and revision checks') : value));
  for (const command of input.commands) input.tx.apply(`${input.inbound.key}:${command.index}`, command);
  return results;
};
const applicationGroups = (commands: ReadonlyArray<CommandV03>): ReadonlyArray<ReadonlyArray<CommandV03>> => {
  const groups = new Map<string, Array<CommandV03>>();
  for (const command of commands) {
    const key = command.cohort === undefined ? `record:${command.index}` : `cohort:${command.cohort.id}`;
    const group = groups.get(key) ?? [];
    group.push(command);
    groups.set(key, group);
  }
  return [...groups.values()];
};
/** Tx2 survives restarts and rechecks current host authority and expected revisions before writes. */
export const applyV03 = (options: { readonly key: string; readonly applicationId: string }) =>
  Effect.gen(function* () {
    const host = yield* HostAuthorizationV03;
    yield* Schema.decodeUnknownEffect(AuthenticatedContextV03)(host.context).pipe(Effect.mapError(() => failV03('v03.authorization.context', 'authenticated host context is required')));
    if (options.applicationId.length === 0) return yield* Effect.fail(failV03('v03.application.identity', 'application identity is required'));
    const store = yield* DurableInboxV03;
    const at = yield* now;
    const applied = yield* store.transaction((tx) => {
      const inbound = tx.getInbound(options.key);
      if (inbound === undefined) throw failV03('v03.application.missing', 'no durable staged bundle');
      if (partyKey(host.self) !== partyKey(inbound.envelope.audience)) throw failV03('v03.authorization.installation', 'application belongs to another installation');
      const authority = tx.authorizeBundle(host.context, inbound.envelope, 'application');
      if (!authority.allowed) throw failV03('v03.authorization.denied', authority.reason);
      if (inbound.application !== undefined) return { result: inbound.application };
      const outcomes = new Map<number, RecordOutcomeV03>();
      for (const group of applicationGroups(inbound.commands))
        for (const result of applyGroup({ tx, inbound, host, commands: group, applicationId: options.applicationId })) outcomes.set(result.index, result);
      const rows = inbound.validation.records.map((value) => outcomes.get(value.index) ?? value);
      const application: UnsealedReceiptV03 = { ...inbound.validation, phase: 'application', applicationId: options.applicationId, receivedAt: at, records: rows, outcome: aggregateV03(rows) };
      tx.putInbound({ ...inbound, application });
      tx.enqueueReceipt(`${options.key}:application`, application);
      return { result: application };
    });
    return yield* sealReceiptV03(applied);
  });
/** Public error/service channels remain inferred, including mandatory KeyResolver on ingress. */
export type ReceiveRequirementsV03 = DurableInboxV03 | HostAuthorizationV03 | KeyResolver;
export type ReceiveFailureV03 = ExchangeErrorV03 | import('./V03Ports.ts').StorageErrorV03;
