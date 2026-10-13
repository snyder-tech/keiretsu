import { Schema } from 'effect';
import { brand } from '../core/Id.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { Instant } from '../core/Temporal.ts';
import { AdmissionScopeRef } from './AdmissionScopeRef.ts';
import { AdmissionCredentialId } from './AdmissionEntitlement.ts';

export const ScanObservationId = brand('keiretsu/ScanObservationId');
/** A device's claim about a scan. Persisting it never consumes the right. */
export const ScanObservation = Schema.Struct({
  id: ScanObservationId,
  credentialId: AdmissionCredentialId,
  presentationDigest: Sha256,
  event: AdmissionScopeRef.cases.event,
  slot: Schema.optional(AdmissionScopeRef.cases['event-slot']),
  gate: AdmissionScopeRef.cases['admission-gate'],
  device: AdmissionScopeRef.cases.device,
  observedAt: Instant,
  connectivity: Schema.Literals(['online', 'offline']),
});
export type ScanObservation = typeof ScanObservation.Type;
export type ScanObservationEncoded = typeof ScanObservation.Encoded;
