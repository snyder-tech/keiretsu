/**
 * The exchange bundle: a generic envelope over a domain-supplied record profile.
 *
 * {@link makeBundleSchema} takes a profile `{ [kind]: recordSchema }` and
 * returns a codec. The package imports no domain: domains export profiles and
 * adopters combine them. On the wire every record is `{ kind, schema?, record }`.
 *
 * Digests follow memo P7: `contentDigest` is SHA-256 over the RFC 8785 form of
 * the **received** envelope minus `contentDigest` and `signature`, computed
 * from the received text with core `digestWire`, never from decoded values.
 * Decoding is a separate step whose losses (unknown members, normalisation)
 * cannot affect the digest. Producers use {@link seal}, which canonically
 * encodes and digests through the same path a receiver uses.
 *
 * Forward compatibility (memo rule 9): unknown record kinds decode as opaque
 * entries and are reported per record, never as a bundle failure; top-level
 * `x-` members and unknown members of a newer minor are preserved in `raw`.
 *
 * @since 0.1.0
 * @module
 */
import { EntityId } from '../core/Actor.ts';
import { canonicalize, digestValue, digestWire, type JsonValue, parseStrict, Sha256 } from '../core/CanonicalJson.ts';
import { BundleId } from '../core/Ids.ts';
import { Instant, Period } from '../core/Temporal.ts';
import { Data, Effect, Schema } from 'effect';

import { Disclosure } from './Disclosure.ts';
import { isJsonObject, type JsonObject } from './internal/Json.ts';
import { BUNDLE_TYP, type Binding, DetachedJws, sign, type SigningKey } from './Jws.ts';
import { PartyRef, partyKey } from './Party.ts';
import { CURRENT, type Negotiation, negotiate, SpecVersion } from './SpecVersion.ts';

/**
 * Top-level members excluded from the content digest.
 *
 * @since 0.1.0
 * @category constants
 */
export const DIGEST_EXCLUDED: ReadonlyArray<string> = ['contentDigest', 'signature'];

/**
 * Extension member names: `x-` followed by a reverse-DNS-ish token.
 *
 * @since 0.1.0
 * @category patterns
 */
export const EXTENSION_PATTERN: RegExp = /^x-[a-z0-9][a-z0-9.-]*(?:-[A-Za-z0-9]+)*$/;

/**
 * One record on the wire, opaque until classified against a profile.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RecordEntry = Schema.Struct({ kind: Schema.NonEmptyString, schema: Schema.optional(Schema.NonEmptyString), record: Schema.Unknown });
/** @since 0.1.0 @category models */
export type RecordEntry = typeof RecordEntry.Type;

const headerFields = {
  specVersion: SpecVersion,
  bundleId: BundleId,
  issuer: EntityId,
  audience: PartyRef,
  /** Monotonic per (issuer, audience), from 1. */
  seq: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  prevBundleDigest: Schema.optional(Sha256),
  period: Period,
  issuedAt: Instant,
  disclosure: Disclosure,
} as const;

const notSelfAddressed = Schema.makeFilter<{ readonly issuer: string; readonly audience: PartyRef }>((bundle) =>
  bundle.audience._tag === 'entity' && bundle.audience.entityId.toLowerCase() === bundle.issuer.toLowerCase() ? 'a bundle is addressed to another party (bundle.self-addressed)' : undefined,
);

const chainLink = Schema.makeFilter<{ readonly seq: number; readonly prevBundleDigest?: string | undefined }>((bundle) =>
  bundle.seq > 1 === (bundle.prevBundleDigest !== undefined) ? undefined : 'prevBundleDigest is required exactly when seq > 1 (bundle.chain-link)',
);

/**
 * Envelope header a producer supplies (everything except records, digest and signature).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Header = Schema.Struct(headerFields).check(notSelfAddressed, chainLink);
/** @since 0.1.0 @category models */
export type Header = typeof Header.Type;

/**
 * The received envelope with opaque records (the decoding schema).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Envelope = Schema.Struct({
  ...headerFields,
  records: Schema.Array(RecordEntry),
  contentDigest: Sha256,
  signature: Schema.optional(DetachedJws),
}).check(notSelfAddressed, chainLink);
/** @since 0.1.0 @category models */
export type Envelope = typeof Envelope.Type;

const ENVELOPE_MEMBERS: ReadonlySet<string> = new Set([...Object.keys(headerFields), 'records', 'contentDigest', 'signature']);

/**
 * Record schemas by kind, exported by domain packages.
 *
 * @since 0.1.0
 * @category models
 */
export type Profile = { readonly [kind: string]: Schema.ConstraintCodec<unknown, unknown, never, never> };

/**
 * A typed record entry of a profile.
 *
 * @since 0.1.0
 * @category models
 */
export type RecordOf<P extends Profile> = {
  readonly [K in keyof P & string]: { readonly kind: K; readonly schema?: string; readonly record: P[K]['Type'] };
}[keyof P & string];

/**
 * Codec for bundles over one profile.
 *
 * @since 0.1.0
 * @category models
 */
export interface BundleCodec<P extends Profile> {
  readonly profile: P;
  /** Exact schema identities for opt-in strict descriptor profiles. */
  readonly schemaIds?: Readonly<Record<string, string>>;
  readonly kinds: ReadonlySet<string>;
  readonly Envelope: typeof Envelope;
  readonly Header: typeof Header;
}

/**
 * Build a bundle codec over a record profile.
 *
 * @example
 * ```ts
 * const codec = makeBundleSchema({ 'kwx.time': TimeRecord, 'kwx.charge': ChargeLine })
 * ```
 * @since 0.1.0
 * @category constructors
 */
export const makeBundleSchema = <const P extends Profile>(profile: P): BundleCodec<P> => ({ profile, kinds: new Set(Object.keys(profile)), Envelope, Header });

/**
 * A producer's bundle before sealing.
 *
 * @since 0.1.0
 * @category models
 */
export type UnsealedBundle<P extends Profile> = Header & {
  readonly records: ReadonlyArray<RecordOf<P>>;
  /** Top-level extension members; names must match {@link EXTENSION_PATTERN}. */
  readonly extensions?: Readonly<Record<string, JsonValue>>;
};

/**
 * Sealed wire text and its content digest.
 *
 * @since 0.1.0
 * @category models
 */
export interface Sealed {
  readonly text: string;
  readonly contentDigest: Sha256;
}

/**
 * A bundle could not be sealed or signed.
 *
 * @since 0.1.0
 * @category errors
 */
export class SealError extends Data.TaggedError('SealError')<{ readonly reason: string }> {}

/**
 * Received text is not a decodable bundle envelope.
 *
 * @since 0.1.0
 * @category errors
 */
export class BundleDecodeError extends Schema.TaggedError<BundleDecodeError>()('BundleDecodeError', { reason: Schema.String }) {}

/**
 * The bundle's major version is not supported; the bundle is rejected unread.
 *
 * @since 0.1.0
 * @category errors
 */
export class UnsupportedMajor extends Schema.TaggedError<UnsupportedMajor>()('UnsupportedMajor', {
  version: Schema.String,
  supportedMajors: Schema.Array(Schema.Number),
}) {}

const sealFail = (reason: string): SealError => new SealError({ reason });

const encodeEntry = <P extends Profile>(codec: BundleCodec<P>, entry: RecordOf<P>, index: number): Effect.Effect<JsonValue, SealError> => {
  if (!Object.hasOwn(codec.profile, entry.kind)) return Effect.fail(sealFail(`records[${index}]: kind ${entry.kind} is not in the profile`));
  const schema = codec.profile[entry.kind];
  if (schema === undefined) return Effect.fail(sealFail(`records[${index}]: kind ${entry.kind} has no schema`));
  const schemaId = codec.schemaIds?.[entry.kind];
  if (schemaId !== undefined && entry.schema !== undefined && entry.schema !== schemaId) return Effect.fail(sealFail(`records[${index}]: schema identity does not match ${schemaId}`));
  return Schema.encodeUnknownEffect(schema)(entry.record).pipe(
    Effect.mapError((error) => sealFail(`records[${index}]: ${error.message}`)),
    Effect.flatMap((record) => toJson({ kind: entry.kind, schema: schemaId ?? entry.schema, record }, `records[${index}]`)),
  );
};

/** Round-trip through canonical JSON so only JSON values (no undefined, no class instances) reach the wire. */
const toJson = (value: unknown, at: string): Effect.Effect<JsonValue, SealError> =>
  canonicalize(value).pipe(
    Effect.flatMap(parseStrict),
    Effect.mapError((error) => sealFail(`${at}: ${error.reason}`)),
  );

const checkExtensions = (extensions: Readonly<Record<string, JsonValue>>): Effect.Effect<void, SealError> => {
  const bad = Object.keys(extensions).filter((key) => !EXTENSION_PATTERN.test(key));
  return bad.length === 0 ? Effect.void : Effect.fail(sealFail(`extension members must be named x-…: ${bad.join(', ')}`));
};

/**
 * Seal a bundle: encode the header and every record with its kind's schema,
 * canonicalise, digest through the receiver's path and render canonical text.
 * The result is decoded once more as a self-check.
 *
 * @since 0.1.0
 * @category producing
 */
export const seal = <P extends Profile>(codec: BundleCodec<P>, bundle: UnsealedBundle<P>): Effect.Effect<Sealed, SealError> =>
  Effect.gen(function* () {
    const { records, extensions = {}, ...header } = bundle;
    yield* checkExtensions(extensions);
    const wireHeader = yield* Schema.encodeUnknownEffect(Header)(header).pipe(Effect.mapError((error) => sealFail(error.message)));
    const wireRecords = yield* Effect.forEach(records, (entry, index) => encodeEntry(codec, entry, index), { concurrency: 1 });
    const unsealed = { ...extensions, ...wireHeader, records: wireRecords };
    const unsealedText = yield* Effect.mapError(canonicalize(unsealed), (error) => sealFail(error.reason));
    const contentDigest = yield* Effect.mapError(digestWire(unsealedText, DIGEST_EXCLUDED), (error) => sealFail(error.reason));
    const text = yield* Effect.mapError(canonicalize({ ...unsealed, contentDigest }), (error) => sealFail(error.reason));
    yield* Schema.decodeUnknownEffect(Envelope)(JSON.parse(text)).pipe(Effect.mapError((error) => sealFail(`sealed envelope does not decode: ${error.message}`)));
    return { text, contentDigest };
  });

/**
 * Claims a bundle signature binds.
 *
 * @since 0.1.0
 * @category signing
 */
export const bindingOf = (envelope: Pick<Envelope, 'issuer' | 'audience' | 'bundleId' | 'seq' | 'specVersion'>): Binding => ({
  issuer: envelope.issuer.toLowerCase(),
  audience: partyKey(envelope.audience),
  bundleId: envelope.bundleId.toLowerCase(),
  seq: envelope.seq,
  specVersion: envelope.specVersion,
});

/**
 * Add a detached JWS over `contentDigest` to sealed text. The digest does not
 * change: `signature` is excluded from it. The digest is recomputed from the
 * text first, so stale or edited text is refused rather than signed.
 *
 * @since 0.1.0
 * @category producing
 */
export const signBundle = (options: { readonly text: string; readonly key: SigningKey }): Effect.Effect<string, SealError> =>
  Effect.gen(function* () {
    const parsed = yield* Effect.mapError(parseStrict(options.text), (error) => sealFail(error.reason));
    if (!isJsonObject(parsed)) return yield* Effect.fail(sealFail('a bundle is a JSON object'));
    const envelope = yield* Schema.decodeUnknownEffect(Envelope)(parsed).pipe(Effect.mapError((error) => sealFail(error.message)));
    const digest = yield* Effect.mapError(digestWire(options.text, DIGEST_EXCLUDED), (error) => sealFail(error.reason));
    if (digest !== envelope.contentDigest) return yield* Effect.fail(sealFail('contentDigest does not match the text; reseal before signing'));
    const signature = yield* sign({ key: options.key, typ: BUNDLE_TYP, binding: bindingOf(envelope), payload: envelope.contentDigest }).pipe(Effect.mapError((error) => sealFail(error.reason)));
    return yield* Effect.mapError(canonicalize({ ...parsed, signature }), (error) => sealFail(error.reason));
  });

/**
 * Classification of one received record.
 *
 * @since 0.1.0
 * @category models
 */
export type EntryOutcome<P extends Profile> =
  | { readonly _tag: 'known'; readonly index: number; readonly kind: string; readonly recordDigest: Sha256; readonly raw: unknown; readonly entry: RecordOf<P> }
  | { readonly _tag: 'unknown-kind'; readonly index: number; readonly kind: string; readonly recordDigest: Sha256; readonly raw: unknown }
  | { readonly _tag: 'invalid'; readonly index: number; readonly kind: string; readonly recordDigest: Sha256; readonly raw: unknown; readonly reason: string; readonly code?: string };

/**
 * A received bundle: the exact text, the strictly parsed JSON, the decoded
 * envelope, the digest computed from the text and the classified records.
 *
 * @since 0.1.0
 * @category models
 */
export interface Opened<P extends Profile> {
  readonly text: string;
  readonly raw: JsonObject;
  readonly envelope: Envelope;
  readonly digest: Sha256;
  readonly negotiation: Negotiation;
  /** Top-level `x-` members, preserved verbatim. */
  readonly extensions: Readonly<Record<string, JsonValue>>;
  /** Top-level members this version does not define and that are not `x-` (preserved in `raw`). */
  readonly unknownMembers: ReadonlyArray<string>;
  readonly entries: ReadonlyArray<EntryOutcome<P>>;
}

const decodeFail = (reason: string): BundleDecodeError => new BundleDecodeError({ reason });

const classify = <P extends Profile>(codec: BundleCodec<P>, entry: RecordEntry, index: number): Effect.Effect<EntryOutcome<P>, BundleDecodeError> =>
  Effect.gen(function* () {
    const recordDigest = yield* Effect.mapError(digestValue(entry.record), (error) => decodeFail(`records[${index}]: ${error.reason}`));
    const base = { index, kind: entry.kind, recordDigest, raw: entry.record };
    const schema = Object.hasOwn(codec.profile, entry.kind) ? codec.profile[entry.kind] : undefined;
    if (schema === undefined) return { _tag: 'unknown-kind', ...base } as const;
    const schemaId = codec.schemaIds?.[entry.kind];
    if (schemaId !== undefined && entry.schema !== schemaId) return { _tag: 'invalid', ...base, code: 'record.schema-mismatch', reason: `schema identity does not match ${schemaId}` } as const;
    return yield* Schema.decodeUnknownEffect(schema)(entry.record).pipe(
      Effect.match({
        onFailure: (error): EntryOutcome<P> => ({ _tag: 'invalid', ...base, reason: error.message }),
        // SAFETY: `record` was decoded with the schema registered for `entry.kind`, so the pair is a RecordOf<P>.
        onSuccess: (record): EntryOutcome<P> => ({ _tag: 'known', ...base, entry: { kind: entry.kind, schema: entry.schema, record } as RecordOf<P> }),
      }),
    );
  });

const negotiated = (parsed: JsonObject, supported: ReadonlyArray<string>): Effect.Effect<Negotiation, BundleDecodeError | UnsupportedMajor> => {
  const version = parsed['specVersion'];
  if (typeof version !== 'string') return Effect.fail(decodeFail('specVersion is missing'));
  const negotiation = negotiate(version, supported);
  if (negotiation._tag === 'unsupported-major') return Effect.fail(new UnsupportedMajor({ version, supportedMajors: [...negotiation.supportedMajors] }));
  if (negotiation._tag === 'malformed') return Effect.fail(decodeFail(`specVersion ${version} is not major.minor`));
  if (negotiation._tag === 'unsupported-version') return Effect.fail(decodeFail(`pre-1.0 specVersion ${version} is not explicitly supported`));
  return Effect.succeed(negotiation);
};

/**
 * Open received text: strict parse (no duplicate members, no lone
 * surrogates), negotiate the version, digest the text, decode the envelope
 * and classify each record against the profile.
 *
 * @since 0.1.0
 * @category receiving
 */
export const open = <P extends Profile>(
  codec: BundleCodec<P>,
  text: string,
  options: { readonly supported?: ReadonlyArray<string> } = {},
): Effect.Effect<Opened<P>, BundleDecodeError | UnsupportedMajor> =>
  Effect.gen(function* () {
    const parsed = yield* Effect.mapError(parseStrict(text), (error) => decodeFail(`${error.at}: ${error.reason}`));
    if (!isJsonObject(parsed)) return yield* Effect.fail(decodeFail('a bundle is a JSON object'));
    const negotiation = yield* negotiated(parsed, options.supported ?? [CURRENT]);
    const digest = yield* Effect.mapError(digestWire(text, DIGEST_EXCLUDED), (error) => decodeFail(error.reason));
    const envelope = yield* Schema.decodeUnknownEffect(Envelope)(parsed).pipe(Effect.mapError((error) => decodeFail(error.message)));
    const entries = yield* Effect.forEach(envelope.records, (entry, index) => classify(codec, entry, index), { concurrency: 1 });
    const members = Object.keys(parsed);
    return {
      text,
      raw: parsed,
      envelope,
      digest,
      negotiation,
      extensions: Object.fromEntries(Object.entries(parsed).filter(([key]) => key.startsWith('x-'))),
      unknownMembers: members.filter((key) => !key.startsWith('x-') && !ENVELOPE_MEMBERS.has(key)),
      entries,
    };
  });
