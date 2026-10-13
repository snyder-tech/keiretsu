import { Schema } from 'effect';
import { brand } from '../core/Id.ts';
import { DocumentId } from '../core/Ids.ts';

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
export type AdmissionScopeRef = typeof AdmissionScopeRef.Type;
export const admissionScopeKey = (ref: AdmissionScopeRef): string => JSON.stringify([ref._tag, ref.id.toLowerCase()]);
