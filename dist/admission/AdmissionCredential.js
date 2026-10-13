import { Schema } from 'effect';
import { Sha256 } from "../core/CanonicalJson.js";
import { AdmissionCredentialId, AdmissionEntitlementId, AdmissionRevision } from "./AdmissionEntitlement.js";
/** Presentation material references a right and its generation; it does not carry authority. */
export const AdmissionCredential = Schema.Struct({
    id: AdmissionCredentialId,
    entitlementId: AdmissionEntitlementId,
    generation: AdmissionRevision,
    presentationDigest: Sha256,
});
//# sourceMappingURL=AdmissionCredential.js.map