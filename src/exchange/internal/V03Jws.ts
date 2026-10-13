import { Effect, Schema } from 'effect';
import { EntityId } from '../../core/Actor.ts';
import { Sha256, parseStrict } from '../../core/CanonicalJson.ts';
import { BundleId } from '../../core/Ids.ts';
import { BUNDLE_TYP, RECEIPT_TYP, ProtectedHeader } from '../Jws.ts';
import { checkBoundsV03, failV03, type ExchangeErrorV03 } from '../V03Bundle.ts';
import type { LimitsV03 } from '../V03Contracts.ts';
import { decodeUrl, encodeUrl, fromUtf8 } from './Base64.ts';

const Base = {
  ...ProtectedHeader.fields,
  alg: Schema.Literal('EdDSA'),
  b64: Schema.Literal(false),
  crit: Schema.Tuple([Schema.Literal('b64')]),
};
const Binding = {
  issuer: EntityId,
  bundleId: BundleId,
  seq: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  specVersion: Schema.Literal('0.3'),
};
const BundleHeaderV03 = Schema.Struct({ ...Base, typ: Schema.Literal(BUNDLE_TYP), kwx: Schema.Struct({ ...Binding, audience: Schema.NonEmptyString }) });
const ReceiptHeaderV03 = Schema.Struct({
  ...Base,
  typ: Schema.Literal(RECEIPT_TYP),
  kwx: Schema.Struct({ ...Binding, receiver: Schema.NonEmptyString, contentDigest: Sha256, phase: Schema.Literals(['classification', 'validation', 'application']) }),
});
type SignatureCode = 'v03.bundle.signature' | 'v03.receipt.signature';

const canonicalSegment = Effect.fnUntraced(function* (part: string, code: SignatureCode) {
  const bytes = decodeUrl(part);
  if (bytes === undefined || bytes.length === 0 || encodeUrl(bytes) !== part) {
    return yield* failV03(code, 'detached JWS segments must use canonical unpadded base64url with zero unused bits');
  }
  return bytes;
});

/** Exchange 0.3 uses exact protected/binding member sets. Legacy Jws behavior is frozen.
 * Canonical base64url does not require canonical JSON whitespace or member ordering.
 * Limits apply to decoded header JSON before parsing, as well as to the outer envelope.
 */
export const validateJwsV03 = Effect.fnUntraced(function* (options: {
  readonly jws: string;
  readonly typ: typeof BUNDLE_TYP | typeof RECEIPT_TYP;
  readonly limits: LimitsV03;
}): Effect.fn.Return<void, ExchangeErrorV03> {
  const code: SignatureCode = options.typ === BUNDLE_TYP ? 'v03.bundle.signature' : 'v03.receipt.signature';
  const parts = options.jws.split('.');
  if (parts.length !== 3 || parts[1] !== '') return yield* failV03(code, '0.3 signatures require compact detached JWS');
  const protectedBytes = yield* canonicalSegment(parts[0] ?? '', code);
  const signature = yield* canonicalSegment(parts[2] ?? '', code);
  if (signature.length !== 64) return yield* failV03(code, '0.3 Ed25519 signatures must contain exactly 64 bytes');
  const text = yield* Effect.try({ try: () => fromUtf8(protectedBytes), catch: () => failV03(code, 'protected JWS header must be valid UTF-8') });
  yield* checkBoundsV03(text, options.limits);
  const header = yield* parseStrict(text).pipe(Effect.mapError(() => failV03(code, 'protected JWS header must be strict JSON')));
  const schema = options.typ === BUNDLE_TYP ? BundleHeaderV03 : ReceiptHeaderV03;
  yield* Schema.decodeUnknownEffect(schema, { onExcessProperty: 'error' })(header).pipe(
    Effect.mapError(() => failV03(code, 'protected JWS header and binding must contain exactly the 0.3 profile members with their declared types')),
  );
});
