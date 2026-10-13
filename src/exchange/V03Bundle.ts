/** Bounded 0.3 ingress using the canonical JSON and signature implementation. */
import { Effect, Schema } from 'effect';
import { canonicalize, digestValue, digestWire, parseStrict } from '../core/CanonicalJson.ts';
import { bindingOf, DIGEST_EXCLUDED } from './Bundle.ts';
import { BUNDLE_TYP, sign, type SigningKey } from './Jws.ts';
import { SpecVersion } from './SpecVersion.ts';
import { isJsonObject } from './internal/Json.ts';
import { numericWireReasonV03 } from './internal/V03Numbers.ts';
import { EnvelopeV03, LimitsV03, type RecordIdentityV03 } from './V03Contracts.ts';

export const ExchangeErrorCodeV03 = Schema.Literals([
  'core.json-duplicate-member',
  'core.json-lone-surrogate',
  'core.json-invalid',
  'v03.limits.invalid',
  'v03.limits.bytes',
  'v03.limits.depth',
  'v03.limits.records',
  'v03.number.invalid',
  'v03.bundle.invalid',
  'v03.bundle.digest',
  'v03.bundle.audience',
  'v03.bundle.signature',
  'v03.signature.failed',
  'v03.adapter.command',
  'v03.sequence.replay',
  'v03.authorization.context',
  'v03.authorization.installation',
  'v03.authorization.denied',
  'v03.application.identity',
  'v03.application.missing',
  'v03.outbox.limit',
  'v03.transport.limit',
  'v03.receipt.aggregate',
  'v03.receipt.phase',
  'v03.receipt.application-id',
  'v03.receipt.invalid',
  'v03.receipt.digest',
  'v03.receipt.coverage',
  'v03.receipt.record',
  'v03.receipt.duplicate',
  'v03.receipt.context',
  'v03.receipt.signature',
]);
export class ExchangeErrorV03 extends Schema.TaggedError<ExchangeErrorV03>()('ExchangeErrorV03', { code: ExchangeErrorCodeV03, reason: Schema.NonEmptyString }) {}
export const failV03 = (code: typeof ExchangeErrorCodeV03.Type, reason: string) => new ExchangeErrorV03({ code, reason });

const bracketDepth = (character: string): number => {
  switch (character) {
    case '{':
    case '[':
      return 1;
    case '}':
    case ']':
      return -1;
    default:
      return 0;
  }
};
const exceedsDepth = (text: string, ceiling: number): boolean => {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (const character of text) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    depth += bracketDepth(character);
    if (depth > ceiling) return true;
  }
  return false;
};
/** Scan before recursive strict parsing, bounding bytes and nesting without interpreting JSON. */
export const checkBoundsV03 = (text: string, limits: LimitsV03): Effect.Effect<void, ExchangeErrorV03> =>
  Effect.gen(function* () {
    yield* Schema.decodeUnknownEffect(LimitsV03)(limits).pipe(Effect.mapError(() => failV03('v03.limits.invalid', 'invalid receiver ceilings')));
    if (text.length > limits.maxBytes || new TextEncoder().encode(text).byteLength > limits.maxBytes) return yield* Effect.fail(failV03('v03.limits.bytes', 'message exceeds byte ceiling'));
    if (exceedsDepth(text, limits.maxDepth)) return yield* Effect.fail(failV03('v03.limits.depth', 'message exceeds nesting ceiling'));
    const numericReason = numericWireReasonV03(text);
    if (numericReason !== undefined) return yield* Effect.fail(failV03('v03.number.invalid', numericReason));
  });

export interface OpenedV03 {
  readonly envelope: EnvelopeV03;
  readonly identities: ReadonlyArray<RecordIdentityV03>;
  readonly text: string;
}
export const openV03 = (text: string, limits: LimitsV03): Effect.Effect<OpenedV03, ExchangeErrorV03> =>
  Effect.gen(function* () {
    yield* checkBoundsV03(text, limits);
    const raw = yield* parseStrict(text).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    if (!isJsonObject(raw)) return yield* Effect.fail(failV03('v03.bundle.invalid', 'envelope must be an object'));
    const rawRecords = raw['records'];
    if (Array.isArray(rawRecords) && rawRecords.length > limits.maxRecords) return yield* Effect.fail(failV03('v03.limits.records', 'message exceeds record ceiling'));
    const envelope = yield* Schema.decodeUnknownEffect(EnvelopeV03)(raw, { onExcessProperty: 'error' }).pipe(Effect.mapError(() => failV03('v03.bundle.invalid', 'invalid 0.3 envelope')));
    const digest = yield* digestWire(text, DIGEST_EXCLUDED).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    if (digest !== envelope.contentDigest) return yield* Effect.fail(failV03('v03.bundle.digest', 'content digest does not match received wire'));
    const identities = yield* Effect.forEach(
      envelope.records,
      (entry, index) =>
        digestValue(Array.isArray(rawRecords) ? rawRecords[index] : null).pipe(
          Effect.map((recordDigest) => ({ index, kind: entry.kind, schema: entry.schema, recordDigest })),
          Effect.mapError((error) => failV03(error.code, error.reason)),
        ),
      { concurrency: 1 },
    );
    return { envelope, identities, text };
  });

/** Producers encode domain payloads before supplying this JSON wire input. */
export const sealV03 = (input: Omit<EnvelopeV03, 'contentDigest' | 'signature'>, limits: LimitsV03): Effect.Effect<OpenedV03, ExchangeErrorV03> =>
  Effect.gen(function* () {
    const unsealed = yield* canonicalize(input).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    yield* checkBoundsV03(unsealed, limits);
    const contentDigest = yield* digestWire(unsealed, DIGEST_EXCLUDED).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    const text = yield* canonicalize({ ...input, contentDigest }).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    return yield* openV03(text, limits);
  });
export const bindingOfV03 = (envelope: EnvelopeV03) => bindingOf({ ...envelope, specVersion: Schema.decodeUnknownSync(SpecVersion)(envelope.specVersion) });
export const signBundleV03 = (options: { readonly text: string; readonly key: SigningKey; readonly limits: LimitsV03 }): Effect.Effect<string, ExchangeErrorV03> =>
  Effect.gen(function* () {
    const opened = yield* openV03(options.text, options.limits);
    const signature = yield* sign({ key: options.key, typ: BUNDLE_TYP, binding: bindingOfV03(opened.envelope), payload: opened.envelope.contentDigest }).pipe(
      Effect.mapError((error) => failV03('v03.signature.failed', error.reason)),
    );
    const raw = yield* parseStrict(options.text).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    if (!isJsonObject(raw)) return yield* Effect.fail(failV03('v03.bundle.invalid', 'envelope must be an object'));
    const text = yield* canonicalize({ ...raw, signature }).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    yield* checkBoundsV03(text, options.limits);
    return text;
  });
