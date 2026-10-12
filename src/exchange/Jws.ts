/**
 * Detached JWS signatures (RFC 7515) with unencoded payload (RFC 7797) and
 * EdDSA over Ed25519 (RFC 8032, RFC 8037), using Web Crypto only.
 *
 * The compact form is `BASE64URL(protected) . "" . BASE64URL(signature)`; the
 * payload is the 64-hex content digest, signed as raw ASCII (`b64:false`,
 * `crit:["b64"]`). The protected header binds the key id, the media `typ`
 * (domain separation between bundles and receipts) and a `kwx` claim set
 * naming issuer, audience, bundle id, sequence and spec version, so a
 * signature cannot be replayed to another audience or bundle.
 *
 * Verification fails closed: every malformed, unknown or mismatching element
 * produces an issue; a missing key is an issue, never a pass.
 *
 * @since 0.1.0
 * @module
 */
import { canonicalize, parseStrict } from '../core/CanonicalJson.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { Data, Effect, Exit, Option, Schema } from 'effect';

import { decodeUrl, encodeUrl, fromUtf8, utf8 } from './internal/Base64.ts';
import { KeyResolver, PublicJwk } from './KeyResolver.ts';

/**
 * `typ` of a bundle signature.
 *
 * @since 0.1.0
 * @category constants
 */
export const BUNDLE_TYP = 'kwx-bundle+jws';

/**
 * `typ` of a receipt signature.
 *
 * @since 0.1.0
 * @category constants
 */
export const RECEIPT_TYP = 'kwx-receipt+jws';

/**
 * Compact detached JWS (`header..signature`); the Ed25519 signature is 86 base64url characters.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DetachedJws = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]+\.\.[A-Za-z0-9_-]{86}$/));
/** @since 0.1.0 @category models */
export type DetachedJws = typeof DetachedJws.Type;

/**
 * Claims bound into the protected header under `kwx`.
 *
 * @since 0.1.0
 * @category models
 */
export type Binding = Readonly<Record<string, string | number>>;

/**
 * Protected header.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ProtectedHeader = Schema.Struct({
  alg: Schema.String,
  kid: Schema.NonEmptyString,
  typ: Schema.String,
  b64: Schema.Boolean,
  crit: Schema.Array(Schema.String),
  kwx: Schema.Record(Schema.String, Schema.Union([Schema.String, Schema.Number])),
});
/** @since 0.1.0 @category models */
export type ProtectedHeader = typeof ProtectedHeader.Type;

/**
 * A private signing key the holder never exports.
 *
 * @since 0.1.0
 * @category models
 */
export interface SigningKey {
  readonly kid: string;
  readonly privateKey: CryptoKey;
}

/**
 * Signing failed (Web Crypto refused the key or the header was not canonicalisable).
 *
 * @since 0.1.0
 * @category errors
 */
export class JwsError extends Data.TaggedError('JwsError')<{ readonly reason: string }> {}

const ED25519 = { name: 'Ed25519' } as const;

/**
 * Generate an Ed25519 key pair (non-extractable private key) and its public JWK.
 *
 * @since 0.1.0
 * @category keys
 */
export const generateEd25519 = (kid: string): Effect.Effect<{ readonly signingKey: SigningKey; readonly publicJwk: PublicJwk }, JwsError> =>
  Effect.tryPromise({
    try: async () => {
      const pair = await crypto.subtle.generateKey(ED25519, false, ['sign', 'verify']);
      if (!('privateKey' in pair)) throw new Error('Ed25519 generateKey did not return a key pair');
      const exported = await crypto.subtle.exportKey('jwk', pair.publicKey);
      const publicJwk = Schema.decodeUnknownSync(PublicJwk)({ ...exported, kid });
      return { signingKey: { kid, privateKey: pair.privateKey }, publicJwk };
    },
    catch: (cause) => new JwsError({ reason: String(cause) }),
  });

const signingInput = (protectedPart: string, payload: string): Uint8Array<ArrayBuffer> => utf8(`${protectedPart}.${payload}`);

/**
 * Sign `payload` (ASCII, unencoded) with a bound protected header; returns the compact detached JWS.
 *
 * @since 0.1.0
 * @category signing
 */
export const sign = (options: { readonly key: SigningKey; readonly typ: string; readonly binding: Binding; readonly payload: string }): Effect.Effect<DetachedJws, JwsError> =>
  Effect.gen(function* () {
    const header: ProtectedHeader = { alg: 'EdDSA', kid: options.key.kid, typ: options.typ, b64: false, crit: ['b64'], kwx: options.binding };
    const json = yield* Effect.mapError(canonicalize(header), (error) => new JwsError({ reason: error.reason }));
    const protectedPart = encodeUrl(utf8(json));
    const signature = yield* Effect.tryPromise({
      try: () => crypto.subtle.sign(ED25519, options.key.privateKey, signingInput(protectedPart, options.payload)),
      catch: (cause) => new JwsError({ reason: String(cause) }),
    });
    // SAFETY: an Ed25519 signature is 64 bytes, i.e. 86 base64url characters, matching DetachedJws.
    return `${protectedPart}..${encodeUrl(new Uint8Array(signature))}` as DetachedJws;
  });

/**
 * What a verifier expects: who signed, the media type, the bound claims and the payload.
 *
 * @since 0.1.0
 * @category models
 */
export interface Expectation {
  /** Signer key space for {@link KeyResolver} (issuer entity id, or receiver party key). */
  readonly signer: string;
  readonly typ: string;
  readonly binding: Binding;
  readonly payload: string;
  /** Issue subject (e.g. the bundle id). */
  readonly subject: string;
}

const fail = (code: string, subject: string, message: string): ReadonlyArray<ValidationIssue> => [issue(code, 'error', subject, message)];

const decodeHeader = (part: string): Option.Option<ProtectedHeader> => {
  const bytes = decodeUrl(part);
  if (bytes === undefined) return Option.none();
  const text = Exit.getSuccess(Effect.runSyncExit(Effect.try(() => fromUtf8(bytes))));
  if (Option.isNone(text)) return Option.none();
  const parsed = Effect.runSyncExit(parseStrict(text.value));
  if (Exit.isFailure(parsed)) return Option.none();
  return Exit.getSuccess(Schema.decodeUnknownExit(ProtectedHeader)(parsed.value));
};

/**
 * Parse the protected header of a compact detached JWS without verifying it.
 *
 * @since 0.1.0
 * @category parsing
 */
export const readHeader = (jws: string): Option.Option<ProtectedHeader> => {
  const parts = jws.split('.');
  if (parts.length !== 3 || parts[1] !== '') return Option.none();
  return decodeHeader(parts[0] ?? '');
};

const headerIssues = (header: ProtectedHeader, expected: Expectation): ReadonlyArray<ValidationIssue> => {
  const at = expected.subject;
  if (header.alg !== 'EdDSA') return fail('jws.alg-unsupported', at, `alg ${header.alg} is not accepted; use EdDSA`);
  if (header.b64 || header.crit.length !== 1 || header.crit[0] !== 'b64') return fail('jws.crit', at, 'the header must set b64:false with crit:["b64"] and no other critical parameters');
  if (header.typ !== expected.typ) return fail('jws.typ-mismatch', at, `typ ${header.typ} is not ${expected.typ}`);
  return Object.entries(expected.binding)
    .filter(([claim, value]) => header.kwx[claim] !== value)
    .map(([claim]) => issue('jws.binding-mismatch', 'error', at, `the signed header binds a different ${claim}`));
};

const importKey = (jwk: PublicJwk): Effect.Effect<Option.Option<CryptoKey>> =>
  Effect.option(Effect.tryPromise(() => crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x }, ED25519, false, ['verify'])));

const signatureValid = (options: { readonly key: CryptoKey; readonly protectedPart: string; readonly signature: Uint8Array<ArrayBuffer>; readonly payload: string }): Effect.Effect<boolean> =>
  Effect.tryPromise(() => crypto.subtle.verify(ED25519, options.key, options.signature, signingInput(options.protectedPart, options.payload))).pipe(
    Effect.orElseSucceed(() => false),
  );

/**
 * Verify a compact detached JWS against an expectation, resolving the key
 * through {@link KeyResolver}. Returns issues; an empty list means valid.
 *
 * @since 0.1.0
 * @category verification
 */
export const verify = (jws: string, expected: Expectation): Effect.Effect<ReadonlyArray<ValidationIssue>, never, KeyResolver> =>
  Effect.gen(function* () {
    const at = expected.subject;
    const [protectedPart = '', , signaturePart = ''] = jws.split('.');
    const header = readHeader(jws);
    const signature = decodeUrl(signaturePart);
    if (Option.isNone(header) || signature === undefined) return fail('jws.malformed', at, 'not a compact detached JWS with a valid protected header');
    const headerProblems = headerIssues(header.value, expected);
    if (headerProblems.length > 0) return headerProblems;
    const resolver = yield* KeyResolver;
    const jwk = yield* resolver.resolve({ signer: expected.signer, kid: header.value.kid });
    if (Option.isNone(jwk)) return fail('jws.key-unknown', at, `no trusted key ${header.value.kid} for signer ${expected.signer}`);
    const key = yield* importKey(jwk.value);
    if (Option.isNone(key)) return fail('jws.key-unknown', at, `key ${header.value.kid} is not a usable Ed25519 key`);
    const valid = yield* signatureValid({ key: key.value, protectedPart, signature, payload: expected.payload });
    return valid ? [] : fail('jws.invalid', at, 'signature does not verify');
  });
