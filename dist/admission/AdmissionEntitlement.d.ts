import { Schema } from 'effect';
export declare const AdmissionEntitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
export type AdmissionEntitlementId = typeof AdmissionEntitlementId.Type;
export declare const AdmissionCredentialId: Schema.brand<Schema.String, "keiretsu/AdmissionCredentialId">;
export type AdmissionCredentialId = typeof AdmissionCredentialId.Type;
export declare const AdmissionRedemptionId: Schema.brand<Schema.String, "keiretsu/AdmissionRedemptionId">;
export type AdmissionRedemptionId = typeof AdmissionRedemptionId.Type;
export declare const AdmissionRevision: Schema.Number;
/** Unsupported policies remain representable so consumers can explicitly hold them. */
export declare const AdmissionPolicy: Schema.TaggedUnion<{
    readonly "single-entry": Schema.TaggedStruct<"single-entry", {}>;
    readonly "multi-entry": Schema.TaggedStruct<"multi-entry", {
        readonly maximumEntries: Schema.Number;
    }>;
    readonly reentry: Schema.TaggedStruct<"reentry", {}>;
}>;
export declare const AdmissionConsumption: Schema.TaggedUnion<{
    readonly unused: Schema.TaggedStruct<"unused", {}>;
    readonly redeemed: Schema.TaggedStruct<"redeemed", {
        readonly redemptionId: Schema.brand<Schema.String, "keiretsu/AdmissionRedemptionId">;
        readonly redeemedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>;
}>;
/** An issuer-owned right. An offer, order, refund or payment observation cannot issue it. */
export declare const AdmissionEntitlement: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
    readonly issuer: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly event: Schema.TaggedStruct<"event", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionEventId">;
    }>;
    readonly slot: Schema.optional<Schema.TaggedStruct<"event-slot", {
        readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionSlotId">;
    }>>;
    readonly offeringId: Schema.optional<Schema.brand<Schema.String, "keiretsu/OfferingId">>;
    readonly order: Schema.optional<Schema.TaggedStruct<"sale-order", {
        readonly id: Schema.brand<Schema.String, "keiretsu/DocumentId">;
    }>>;
    readonly buyer: Schema.optional<Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>>;
    readonly attendee: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly revision: Schema.Number;
    readonly credentialGeneration: Schema.Number;
    readonly credentialId: Schema.brand<Schema.String, "keiretsu/AdmissionCredentialId">;
    readonly presentationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly policy: Schema.TaggedUnion<{
        readonly "single-entry": Schema.TaggedStruct<"single-entry", {}>;
        readonly "multi-entry": Schema.TaggedStruct<"multi-entry", {
            readonly maximumEntries: Schema.Number;
        }>;
        readonly reentry: Schema.TaggedStruct<"reentry", {}>;
    }>;
    readonly status: Schema.TaggedUnion<{
        readonly active: Schema.TaggedStruct<"active", {}>;
        readonly revoked: Schema.TaggedStruct<"revoked", {
            readonly revokedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly reason: Schema.NonEmptyString;
        }>;
    }>;
    readonly consumption: Schema.TaggedUnion<{
        readonly unused: Schema.TaggedStruct<"unused", {}>;
        readonly redeemed: Schema.TaggedStruct<"redeemed", {
            readonly redemptionId: Schema.brand<Schema.String, "keiretsu/AdmissionRedemptionId">;
            readonly redeemedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        }>;
    }>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly validTo: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type AdmissionEntitlement = typeof AdmissionEntitlement.Type;
export type AdmissionEntitlementEncoded = typeof AdmissionEntitlement.Encoded;
//# sourceMappingURL=AdmissionEntitlement.d.ts.map