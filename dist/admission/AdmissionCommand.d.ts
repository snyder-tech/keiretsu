import { Schema } from 'effect';
export declare const AdmissionCommand: Schema.TaggedUnion<{
    readonly redeem: Schema.TaggedStruct<"redeem", {
        readonly credential: Schema.Struct<{
            readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionCredentialId">;
            readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
            readonly generation: Schema.Number;
            readonly presentationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
        readonly scan: Schema.Struct<{
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
        readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
        readonly expectedRevision: Schema.Number;
        readonly idempotencyKey: Schema.NonEmptyString;
    }>;
    readonly "replace-credential": Schema.TaggedStruct<"replace-credential", {
        readonly replacement: Schema.Struct<{
            readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionCredentialId">;
            readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
            readonly generation: Schema.Number;
            readonly presentationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
        readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
        readonly expectedRevision: Schema.Number;
        readonly idempotencyKey: Schema.NonEmptyString;
    }>;
    readonly revoke: Schema.TaggedStruct<"revoke", {
        readonly reason: Schema.NonEmptyString;
        readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
        readonly expectedRevision: Schema.Number;
        readonly idempotencyKey: Schema.NonEmptyString;
    }>;
}>;
export type AdmissionCommand = typeof AdmissionCommand.Type;
export type AdmissionCommandEncoded = typeof AdmissionCommand.Encoded;
/** Created only by the host's authority port from authenticated policy context. */
export declare const AdmissionAuthorization: Schema.Struct<{
    readonly issuer: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly requestDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly authorizedBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly authorizedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
export type AdmissionAuthorization = typeof AdmissionAuthorization.Type;
/** Declared implementation capability: unsupported policies must be held or refused. */
export declare const AdmissionCapabilities: Schema.Struct<{
    readonly onlineSingleEntry: Schema.Literal<true>;
    readonly multiEntry: Schema.Literal<false>;
    readonly reentry: Schema.Literal<false>;
    readonly offline: Schema.Literal<false>;
}>;
export declare const admissionCapabilities: typeof AdmissionCapabilities.Type;
export declare const AdmissionReceipt: Schema.Struct<{
    readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
    readonly revision: Schema.Number;
    readonly operation: Schema.Literals<readonly ["redeem", "replace-credential", "revoke"]>;
    readonly requestDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly idempotencyKey: Schema.NonEmptyString;
    readonly authorizedBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly committedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly redemptionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AdmissionRedemptionId">>;
    readonly scanId: Schema.optional<Schema.brand<Schema.String, "keiretsu/ScanObservationId">>;
}>;
export type AdmissionReceipt = typeof AdmissionReceipt.Type;
//# sourceMappingURL=AdmissionCommand.d.ts.map