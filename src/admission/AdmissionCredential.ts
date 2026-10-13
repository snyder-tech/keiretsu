import { Schema } from 'effect';
import { Sha256 } from '../core/CanonicalJson.ts';
import { AdmissionCredentialId, AdmissionEntitlementId, AdmissionRevision } from './AdmissionEntitlement.ts';

/** Presentation material references a right and its generation; it does not carry authority. */
export const AdmissionCredential = Schema.Struct({
  id: AdmissionCredentialId,
  entitlementId: AdmissionEntitlementId,
  generation: AdmissionRevision,
  presentationDigest: Sha256,
});
export type AdmissionCredential = typeof AdmissionCredential.Type;
export type AdmissionCredentialEncoded = typeof AdmissionCredential.Encoded;
