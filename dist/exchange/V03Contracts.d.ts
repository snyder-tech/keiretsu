/** Independent 0.3 contracts; the 0.1/0.2 wire remains frozen. */
import { Schema } from 'effect';
export declare const LimitsV03: Schema.Struct<{
    readonly maxBytes: Schema.Number;
    readonly maxDepth: Schema.Number;
    readonly maxRecords: Schema.Number;
}>;
export type LimitsV03 = typeof LimitsV03.Type;
/** Explicit receiver ceilings, supplied by the host. */
export declare const CohortV03: Schema.Struct<{
    readonly id: Schema.NonEmptyString;
    readonly mode: Schema.Literals<readonly ["atomic-correction", "dependency"]>;
}>;
export declare const RecordV03: Schema.Struct<{
    readonly kind: Schema.NonEmptyString;
    readonly schema: Schema.NonEmptyString;
    readonly record: Schema.Codec<Schema.Json, Schema.Json, never, never>;
    readonly cohort: Schema.optional<Schema.Struct<{
        readonly id: Schema.NonEmptyString;
        readonly mode: Schema.Literals<readonly ["atomic-correction", "dependency"]>;
    }>>;
}>;
export type RecordV03 = typeof RecordV03.Type;
export declare const EnvelopeV03: Schema.Struct<{
    readonly specVersion: Schema.Literal<"0.3">;
    readonly records: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly schema: Schema.NonEmptyString;
        readonly record: Schema.Codec<Schema.Json, Schema.Json, never, never>;
        readonly cohort: Schema.optional<Schema.Struct<{
            readonly id: Schema.NonEmptyString;
            readonly mode: Schema.Literals<readonly ["atomic-correction", "dependency"]>;
        }>>;
    }>>;
    readonly contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly signature: Schema.optional<Schema.String>;
    readonly bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly seq: Schema.Number;
    readonly prevBundleDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly issuedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly disclosure: Schema.Literals<readonly ["identified", "pseudonymous", "aggregate"]>;
}>;
export type EnvelopeV03 = typeof EnvelopeV03.Type;
/** Persist envelope identity without retaining rejected or unauthorized payloads. */
export declare const BundleContextV03: Schema.Struct<{
    specVersion: Schema.Literal<"0.3">;
    contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    seq: Schema.Number;
    prevBundleDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    period: Schema.brand<Schema.String, "keiretsu/Period">;
    issuedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    disclosure: Schema.Literals<readonly ["identified", "pseudonymous", "aggregate"]>;
}>;
export type BundleContextV03 = typeof BundleContextV03.Type;
export declare const RecordIdentityV03: Schema.Struct<{
    readonly index: Schema.Number;
    readonly kind: Schema.NonEmptyString;
    readonly schema: Schema.NonEmptyString;
    readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type RecordIdentityV03 = typeof RecordIdentityV03.Type;
export declare const RecordOutcomeV03: Schema.Struct<{
    readonly outcome: Schema.Literals<readonly ["classified", "invalid", "unauthorized", "staged", "held", "applied", "conflict", "rejected"]>;
    readonly reason: Schema.NonEmptyString;
    readonly index: Schema.Number;
    readonly kind: Schema.NonEmptyString;
    readonly schema: Schema.NonEmptyString;
    readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type RecordOutcomeV03 = typeof RecordOutcomeV03.Type;
export declare const UnsealedReceiptV03: Schema.Struct<{
    specVersion: Schema.Literal<"0.3">;
    bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    receiver: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    seq: Schema.Number;
    contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    phase: Schema.Literals<readonly ["classification", "validation", "application"]>;
    receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    outcome: Schema.Literals<readonly ["complete", "partial", "rejected", "held"]>;
    records: Schema.$Array<Schema.Struct<{
        readonly outcome: Schema.Literals<readonly ["classified", "invalid", "unauthorized", "staged", "held", "applied", "conflict", "rejected"]>;
        readonly reason: Schema.NonEmptyString;
        readonly index: Schema.Number;
        readonly kind: Schema.NonEmptyString;
        readonly schema: Schema.NonEmptyString;
        readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    applicationId: Schema.optional<Schema.NonEmptyString>;
    receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
}>;
export type UnsealedReceiptV03 = typeof UnsealedReceiptV03.Type;
export declare const ReceiptV03: Schema.Struct<{
    readonly receiptDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly signature: Schema.optional<Schema.String>;
    readonly specVersion: Schema.Literal<"0.3">;
    readonly bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly receiver: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly seq: Schema.Number;
    readonly contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly phase: Schema.Literals<readonly ["classification", "validation", "application"]>;
    readonly receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly outcome: Schema.Literals<readonly ["complete", "partial", "rejected", "held"]>;
    readonly records: Schema.$Array<Schema.Struct<{
        readonly outcome: Schema.Literals<readonly ["classified", "invalid", "unauthorized", "staged", "held", "applied", "conflict", "rejected"]>;
        readonly reason: Schema.NonEmptyString;
        readonly index: Schema.Number;
        readonly kind: Schema.NonEmptyString;
        readonly schema: Schema.NonEmptyString;
        readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    readonly originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly applicationId: Schema.optional<Schema.NonEmptyString>;
    readonly receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
}>;
export type ReceiptV03 = typeof ReceiptV03.Type;
/** Authentication comes from the host edge, never from bundle actor claims. */
export declare const AuthenticatedContextV03: Schema.Struct<{
    readonly principal: Schema.NonEmptyString;
    readonly sessionId: Schema.NonEmptyString;
    readonly installationId: Schema.NonEmptyString;
}>;
export type AuthenticatedContextV03 = typeof AuthenticatedContextV03.Type;
export declare const CommandV03: Schema.Struct<{
    readonly target: Schema.NonEmptyString;
    readonly expectedRevision: Schema.Number;
    readonly operation: Schema.NonEmptyString;
    readonly payload: Schema.Codec<Schema.Json, Schema.Json, never, never>;
    readonly cohort: Schema.optional<Schema.Struct<{
        readonly id: Schema.NonEmptyString;
        readonly mode: Schema.Literals<readonly ["atomic-correction", "dependency"]>;
    }>>;
    readonly index: Schema.Number;
    readonly kind: Schema.NonEmptyString;
    readonly schema: Schema.NonEmptyString;
    readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type CommandV03 = typeof CommandV03.Type;
export declare const ChainV03: Schema.Struct<{
    readonly seq: Schema.Number;
    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly halted: Schema.Boolean;
}>;
export type ChainV03 = typeof ChainV03.Type;
export declare const StoredInboundV03: Schema.Struct<{
    readonly key: Schema.NonEmptyString;
    readonly envelope: Schema.Struct<{
        specVersion: Schema.Literal<"0.3">;
        contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
        issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        audience: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        seq: Schema.Number;
        prevBundleDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        period: Schema.brand<Schema.String, "keiretsu/Period">;
        issuedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        disclosure: Schema.Literals<readonly ["identified", "pseudonymous", "aggregate"]>;
    }>;
    readonly identities: Schema.$Array<Schema.Struct<{
        readonly index: Schema.Number;
        readonly kind: Schema.NonEmptyString;
        readonly schema: Schema.NonEmptyString;
        readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    readonly classification: Schema.Struct<{
        specVersion: Schema.Literal<"0.3">;
        bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
        issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        receiver: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        seq: Schema.Number;
        contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        phase: Schema.Literals<readonly ["classification", "validation", "application"]>;
        receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        outcome: Schema.Literals<readonly ["complete", "partial", "rejected", "held"]>;
        records: Schema.$Array<Schema.Struct<{
            readonly outcome: Schema.Literals<readonly ["classified", "invalid", "unauthorized", "staged", "held", "applied", "conflict", "rejected"]>;
            readonly reason: Schema.NonEmptyString;
            readonly index: Schema.Number;
            readonly kind: Schema.NonEmptyString;
            readonly schema: Schema.NonEmptyString;
            readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>>;
        originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        applicationId: Schema.optional<Schema.NonEmptyString>;
        receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    }>;
    readonly validation: Schema.Struct<{
        specVersion: Schema.Literal<"0.3">;
        bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
        issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        receiver: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        seq: Schema.Number;
        contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        phase: Schema.Literals<readonly ["classification", "validation", "application"]>;
        receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        outcome: Schema.Literals<readonly ["complete", "partial", "rejected", "held"]>;
        records: Schema.$Array<Schema.Struct<{
            readonly outcome: Schema.Literals<readonly ["classified", "invalid", "unauthorized", "staged", "held", "applied", "conflict", "rejected"]>;
            readonly reason: Schema.NonEmptyString;
            readonly index: Schema.Number;
            readonly kind: Schema.NonEmptyString;
            readonly schema: Schema.NonEmptyString;
            readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>>;
        originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        applicationId: Schema.optional<Schema.NonEmptyString>;
        receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    }>;
    readonly commands: Schema.$Array<Schema.Struct<{
        readonly target: Schema.NonEmptyString;
        readonly expectedRevision: Schema.Number;
        readonly operation: Schema.NonEmptyString;
        readonly payload: Schema.Codec<Schema.Json, Schema.Json, never, never>;
        readonly cohort: Schema.optional<Schema.Struct<{
            readonly id: Schema.NonEmptyString;
            readonly mode: Schema.Literals<readonly ["atomic-correction", "dependency"]>;
        }>>;
        readonly index: Schema.Number;
        readonly kind: Schema.NonEmptyString;
        readonly schema: Schema.NonEmptyString;
        readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    readonly application: Schema.optional<Schema.Struct<{
        specVersion: Schema.Literal<"0.3">;
        bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
        issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        receiver: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        seq: Schema.Number;
        contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        phase: Schema.Literals<readonly ["classification", "validation", "application"]>;
        receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        outcome: Schema.Literals<readonly ["complete", "partial", "rejected", "held"]>;
        records: Schema.$Array<Schema.Struct<{
            readonly outcome: Schema.Literals<readonly ["classified", "invalid", "unauthorized", "staged", "held", "applied", "conflict", "rejected"]>;
            readonly reason: Schema.NonEmptyString;
            readonly index: Schema.Number;
            readonly kind: Schema.NonEmptyString;
            readonly schema: Schema.NonEmptyString;
            readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>>;
        originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        applicationId: Schema.optional<Schema.NonEmptyString>;
        receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    }>>;
}>;
export type StoredInboundV03 = typeof StoredInboundV03.Type;
/** Derive aggregates; callers cannot choose acceptance independently of rows. */
export declare const aggregateV03: (rows: ReadonlyArray<RecordOutcomeV03>) => UnsealedReceiptV03["outcome"];
//# sourceMappingURL=V03Contracts.d.ts.map