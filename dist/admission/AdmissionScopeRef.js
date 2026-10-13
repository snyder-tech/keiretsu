import { Schema } from 'effect';
import { brand } from "../core/Id.js";
import { DocumentId } from "../core/Ids.js";
/** Domain identities owned by admission, separate from canonical registry masters. */
export const AdmissionEventId = brand('keiretsu/AdmissionEventId');
export const AdmissionSlotId = brand('keiretsu/AdmissionSlotId');
export const AdmissionGateId = brand('keiretsu/AdmissionGateId');
export const AdmissionDeviceId = brand('keiretsu/AdmissionDeviceId');
export const AdmissionScopeRef = Schema.TaggedUnion({
    event: { id: AdmissionEventId },
    'event-slot': { id: AdmissionSlotId },
    'admission-gate': { id: AdmissionGateId },
    device: { id: AdmissionDeviceId },
    'sale-order': { id: DocumentId },
});
export const admissionScopeKey = (ref) => JSON.stringify([ref._tag, ref.id.toLowerCase()]);
//# sourceMappingURL=AdmissionScopeRef.js.map