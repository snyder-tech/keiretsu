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
import { EntityId } from "../core/Actor.js";
import { canonicalize, digestValue, digestWire, parseStrict, Sha256 } from "../core/CanonicalJson.js";
import { BundleId } from "../core/Ids.js";
import { Instant, Period } from "../core/Temporal.js";
import { Data, Effect, Schema } from 'effect';
import { Disclosure } from "./Disclosure.js";
import { isJsonObject } from "./internal/Json.js";
import { BUNDLE_TYP, DetachedJws, sign } from "./Jws.js";
import { PartyRef, partyKey } from "./Party.js";
import { CURRENT, negotiate, SpecVersion } from "./SpecVersion.js";
/**
 * Top-level members excluded from the content digest.
 *
 * @since 0.1.0
 * @category constants
 */
export const DIGEST_EXCLUDED = ['contentDigest', 'signature'];
/**
 * Extension member names: `x-` followed by a reverse-DNS-ish token.
 *
 * @since 0.1.0
 * @category patterns
 */
export const EXTENSION_PATTERN = /^x-[a-z0-9][a-z0-9.-]*(?:-[A-Za-z0-9]+)*$/;
/**
 * One record on the wire, opaque until classified against a profile.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RecordEntry = Schema.Struct({ kind: Schema.NonEmptyString, schema: Schema.optional(Schema.NonEmptyString), record: Schema.Unknown });
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
};
const notSelfAddressed = Schema.makeFilter((bundle) => bundle.audience._tag === 'entity' && bundle.audience.entityId.toLowerCase() === bundle.issuer.toLowerCase() ? 'a bundle is addressed to another party (bundle.self-addressed)' : undefined);
const chainLink = Schema.makeFilter((bundle) => bundle.seq > 1 === (bundle.prevBundleDigest !== undefined) ? undefined : 'prevBundleDigest is required exactly when seq > 1 (bundle.chain-link)');
/**
 * Envelope header a producer supplies (everything except records, digest and signature).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Header = Schema.Struct(headerFields).check(notSelfAddressed, chainLink);
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
const ENVELOPE_MEMBERS = new Set([...Object.keys(headerFields), 'records', 'contentDigest', 'signature']);
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
export const makeBundleSchema = (profile) => ({ profile, kinds: new Set(Object.keys(profile)), Envelope, Header });
/**
 * A bundle could not be sealed or signed.
 *
 * @since 0.1.0
 * @category errors
 */
export class SealError extends Data.TaggedError('SealError') {
}
/**
 * Received text is not a decodable bundle envelope.
 *
 * @since 0.1.0
 * @category errors
 */
export class BundleDecodeError extends Schema.TaggedError()('BundleDecodeError', { reason: Schema.String }) {
}
/**
 * The bundle's major version is not supported; the bundle is rejected unread.
 *
 * @since 0.1.0
 * @category errors
 */
export class UnsupportedMajor extends Schema.TaggedError()('UnsupportedMajor', {
    version: Schema.String,
    supportedMajors: Schema.Array(Schema.Number),
}) {
}
const sealFail = (reason) => new SealError({ reason });
const encodeEntry = (codec, entry, index) => {
    if (!Object.hasOwn(codec.profile, entry.kind))
        return Effect.fail(sealFail(`records[${index}]: kind ${entry.kind} is not in the profile`));
    const schema = codec.profile[entry.kind];
    if (schema === undefined)
        return Effect.fail(sealFail(`records[${index}]: kind ${entry.kind} has no schema`));
    const schemaId = codec.schemaIds?.[entry.kind];
    if (schemaId !== undefined && entry.schema !== undefined && entry.schema !== schemaId)
        return Effect.fail(sealFail(`records[${index}]: schema identity does not match ${schemaId}`));
    return Schema.encodeUnknownEffect(schema)(entry.record).pipe(Effect.mapError((error) => sealFail(`records[${index}]: ${error.message}`)), Effect.flatMap((record) => toJson({ kind: entry.kind, schema: schemaId ?? entry.schema, record }, `records[${index}]`)));
};
/** Round-trip through canonical JSON so only JSON values (no undefined, no class instances) reach the wire. */
const toJson = (value, at) => canonicalize(value).pipe(Effect.flatMap(parseStrict), Effect.mapError((error) => sealFail(`${at}: ${error.reason}`)));
const checkExtensions = (extensions) => {
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
export const seal = (codec, bundle) => Effect.gen(function* () {
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
export const bindingOf = (envelope) => ({
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
export const signBundle = (options) => Effect.gen(function* () {
    const parsed = yield* Effect.mapError(parseStrict(options.text), (error) => sealFail(error.reason));
    if (!isJsonObject(parsed))
        return yield* Effect.fail(sealFail('a bundle is a JSON object'));
    const envelope = yield* Schema.decodeUnknownEffect(Envelope)(parsed).pipe(Effect.mapError((error) => sealFail(error.message)));
    const digest = yield* Effect.mapError(digestWire(options.text, DIGEST_EXCLUDED), (error) => sealFail(error.reason));
    if (digest !== envelope.contentDigest)
        return yield* Effect.fail(sealFail('contentDigest does not match the text; reseal before signing'));
    const signature = yield* sign({ key: options.key, typ: BUNDLE_TYP, binding: bindingOf(envelope), payload: envelope.contentDigest }).pipe(Effect.mapError((error) => sealFail(error.reason)));
    return yield* Effect.mapError(canonicalize({ ...parsed, signature }), (error) => sealFail(error.reason));
});
const decodeFail = (reason) => new BundleDecodeError({ reason });
const classify = (codec, entry, index) => Effect.gen(function* () {
    const recordDigest = yield* Effect.mapError(digestValue(entry.record), (error) => decodeFail(`records[${index}]: ${error.reason}`));
    const base = { index, kind: entry.kind, recordDigest, raw: entry.record };
    const schema = Object.hasOwn(codec.profile, entry.kind) ? codec.profile[entry.kind] : undefined;
    if (schema === undefined)
        return { _tag: 'unknown-kind', ...base };
    const schemaId = codec.schemaIds?.[entry.kind];
    if (schemaId !== undefined && entry.schema !== schemaId)
        return { _tag: 'invalid', ...base, code: 'record.schema-mismatch', reason: `schema identity does not match ${schemaId}` };
    return yield* Schema.decodeUnknownEffect(schema)(entry.record).pipe(Effect.match({
        onFailure: (error) => ({ _tag: 'invalid', ...base, reason: error.message }),
        // SAFETY: `record` was decoded with the schema registered for `entry.kind`, so the pair is a RecordOf<P>.
        onSuccess: (record) => ({ _tag: 'known', ...base, entry: { kind: entry.kind, schema: entry.schema, record } }),
    }));
});
const negotiated = (parsed, supported) => {
    const version = parsed['specVersion'];
    if (typeof version !== 'string')
        return Effect.fail(decodeFail('specVersion is missing'));
    const negotiation = negotiate(version, supported);
    if (negotiation._tag === 'unsupported-major')
        return Effect.fail(new UnsupportedMajor({ version, supportedMajors: [...negotiation.supportedMajors] }));
    if (negotiation._tag === 'malformed')
        return Effect.fail(decodeFail(`specVersion ${version} is not major.minor`));
    if (negotiation._tag === 'unsupported-version')
        return Effect.fail(decodeFail(`pre-1.0 specVersion ${version} is not explicitly supported`));
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
export const open = (codec, text, options = {}) => Effect.gen(function* () {
    const parsed = yield* Effect.mapError(parseStrict(text), (error) => decodeFail(`${error.at}: ${error.reason}`));
    if (!isJsonObject(parsed))
        return yield* Effect.fail(decodeFail('a bundle is a JSON object'));
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
//# sourceMappingURL=Bundle.js.map