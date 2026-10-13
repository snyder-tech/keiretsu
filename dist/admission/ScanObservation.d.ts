import { Schema } from 'effect';
export declare const ScanObservationId: Schema.brand<Schema.String, "keiretsu/ScanObservationId">;
/** A device's claim about a scan. Persisting it never consumes the right. */
export declare const ScanObservation: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/ScanObservationId">;
    readonly credentialId: Schema.brand<Schema.String, "keiretsu/AdmissionCredentialId">;
    readonly presentationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly event: Schema.TaggedStruct<"event", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionEventId">;
    }>;
    readonly slot: Schema.optional<Schema.TaggedStruct<"event-slot", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionSlotId">;
    }>>;
    readonly gate: Schema.TaggedStruct<"admission-gate", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionGateId">;
    }>;
    readonly device: Schema.TaggedStruct<"device", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionDeviceId">;
    }>;
    readonly observedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly connectivity: Schema.Literals<readonly ["online", "offline"]>;
}>;
export type ScanObservation = typeof ScanObservation.Type;
export type ScanObservationEncoded = typeof ScanObservation.Encoded;
//# sourceMappingURL=ScanObservation.d.ts.map