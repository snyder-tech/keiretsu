import { Schema } from 'effect';
import { brand } from "../core/Id.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { Instant } from "../core/Temporal.js";
import { AdmissionScopeRef } from "./AdmissionScopeRef.js";
import { AdmissionCredentialId } from "./AdmissionEntitlement.js";
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
//# sourceMappingURL=ScanObservation.js.map