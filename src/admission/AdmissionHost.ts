import { Context, Effect, Schema } from 'effect';
import { digestValue, type CanonicalJsonError, type Sha256 } from '../core/CanonicalJson.ts';
import { AdmissionCommand, AdmissionReceipt, AdmissionAuthorization } from './AdmissionCommand.ts';
import { AdmissionDenied, AdmissionHostFailure, type AdmissionError } from './AdmissionError.ts';

export interface AdmissionAuthorityShape {
  /** Resolve authenticated context; authorize issuer, event/slot, gate/device and operation.
   * Never trust a caller's actor claim or a source-system state as authority. */
  readonly authorize: (command: AdmissionCommand, requestDigest: Sha256) => Effect.Effect<AdmissionAuthorization, AdmissionDenied>;
}
export class AdmissionAuthority extends Context.Service<AdmissionAuthority, AdmissionAuthorityShape>()('@snyder-tech/keiretsu/admission/AdmissionAuthority') {}

export interface AdmissionHostShape {
  /** One durable transaction must revalidate grant/revocation/time, compare current revision,
   * credential generation/digest, consume the right, and persist the receipt + idempotency binding.
   * Keys are issuer-scoped. Same key+digest replays the original receipt; a different digest fails.
   * Replay still requires current authenticated authority. Replacement/revocation use the same CAS.
   * No success may escape before all writes commit. Hosts own IDs, Clock and durable storage.
   */
  readonly commitAtomic: (command: AdmissionCommand, authorization: AdmissionAuthorization) => Effect.Effect<AdmissionReceipt, AdmissionError>;
}
export class AdmissionHost extends Context.Service<AdmissionHost, AdmissionHostShape>()('@snyder-tech/keiretsu/admission/AdmissionHost') {}

const receiptMatches = (command: AdmissionCommand, receipt: AdmissionReceipt, digest: Sha256): boolean =>
  receipt.entitlementId.toLowerCase() === command.entitlementId.toLowerCase() &&
  receipt.operation === command._tag &&
  receipt.requestDigest === digest &&
  receipt.idempotencyKey === command.idempotencyKey &&
  receipt.revision === command.expectedRevision + 1;

const scanMatches = (command: AdmissionCommand, receipt: AdmissionReceipt): boolean => command._tag !== 'redeem' || receipt.scanId?.toLowerCase() === command.scan.id.toLowerCase();

/** The only ingress accepts commands, never a caller-supplied authorization grant. */
export const executeAdmission = Effect.fn('executeAdmission')(function* (
  input: unknown,
): Effect.fn.Return<AdmissionReceipt, AdmissionError | Schema.SchemaError | CanonicalJsonError, AdmissionAuthority | AdmissionHost> {
  const command = yield* Schema.decodeUnknownEffect(AdmissionCommand, { onExcessProperty: 'error' })(input);
  const requestDigest = yield* digestValue(command);
  const authority = yield* AdmissionAuthority;
  const grant = yield* authority.authorize(command, requestDigest);
  const authorization = yield* Schema.decodeUnknownEffect(AdmissionAuthorization, { onExcessProperty: 'error' })(grant);
  if (authorization.requestDigest !== requestDigest) return yield* new AdmissionDenied({ reason: 'grant-mismatch' });
  const host = yield* AdmissionHost;
  const output = yield* host.commitAtomic(command, authorization);
  const receipt = yield* Schema.decodeUnknownEffect(AdmissionReceipt, { onExcessProperty: 'error' })(output);
  if (!receiptMatches(command, receipt, requestDigest) || !scanMatches(command, receipt)) return yield* new AdmissionHostFailure({ operation: command._tag });
  return receipt;
});
