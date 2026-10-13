import { Schema } from 'effect';
/** Domain identities owned by admission, separate from canonical registry masters. */
export declare const AdmissionEventId: Schema.brand<Schema.String, "keiretsu/AdmissionEventId">;
export declare const AdmissionSlotId: Schema.brand<Schema.String, "keiretsu/AdmissionSlotId">;
export declare const AdmissionGateId: Schema.brand<Schema.String, "keiretsu/AdmissionGateId">;
export declare const AdmissionDeviceId: Schema.brand<Schema.String, "keiretsu/AdmissionDeviceId">;
export declare const AdmissionScopeRef: Schema.TaggedUnion<{
    readonly event: Schema.TaggedStruct<"event", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionEventId">;
    }>;
    readonly "event-slot": Schema.TaggedStruct<"event-slot", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionSlotId">;
    }>;
    readonly "admission-gate": Schema.TaggedStruct<"admission-gate", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionGateId">;
    }>;
    readonly device: Schema.TaggedStruct<"device", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionDeviceId">;
    }>;
    readonly "sale-order": Schema.TaggedStruct<"sale-order", {
        readonly id: Schema.brand<Schema.String, "keiretsu/DocumentId">;
    }>;
}>;
export type AdmissionScopeRef = typeof AdmissionScopeRef.Type;
export declare const admissionScopeKey: (ref: AdmissionScopeRef) => string;
//# sourceMappingURL=AdmissionScopeRef.d.ts.map