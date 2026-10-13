/** Source-only projections. The host resolves canonical identities and authority separately. */
import { Effect, Schema } from 'effect';
import { EvidenceRef } from '../../core/Envelope.ts';
import { SourceRecordRef } from '../../mapping/SourceRecordRef.ts';
import { SourceWorkMapping } from '../../work/SourceWorkMapping.ts';
export declare const SourceWorkProjection: Schema.Struct<{
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly mapping: Schema.Struct<{
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly targets: Schema.NonEmptyArray<Schema.Struct<{
            readonly namespace: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
            readonly id: Schema.NonEmptyString;
        }>>;
        readonly mappingId: Schema.NonEmptyString;
        readonly mappingVersion: Schema.NonEmptyString;
        readonly mappingDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
    readonly kind: Schema.Literals<readonly ["container", "work-item", "service-case", "observation", "unsupported"]>;
    readonly title: Schema.optional<Schema.String>;
    readonly parents: Schema.$Array<Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>>;
    readonly assignees: Schema.$Array<Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>>;
    readonly state: Schema.optional<Schema.Struct<{
        readonly scope: Schema.NonEmptyString;
        readonly code: Schema.NonEmptyString;
    }>>;
    readonly quantity: Schema.optional<Schema.Struct<{
        readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly unit: Schema.NonEmptyString;
    }>>;
    readonly holds: Schema.$Array<Schema.NonEmptyString>;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type SourceWorkProjection = typeof SourceWorkProjection.Type;
export interface ProjectionContext {
    readonly mapping: SourceWorkMapping;
    readonly evidence: readonly [EvidenceRef, ...EvidenceRef[]];
}
export declare const recordRef: (installationId: string, model: string, id: string | number) => SourceRecordRef;
export declare const sourceEnvelope: (context: ProjectionContext) => {
    source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    mapping: {
        readonly source: {
            readonly installationId: string;
            readonly model: string;
            readonly recordKey: string;
        };
        readonly targets: readonly [{
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        }, ...{
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        }[]];
        readonly mappingId: string;
        readonly mappingVersion: string;
        readonly mappingDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly sourceDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    };
    evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
};
export declare const SourceId: Schema.Int;
/** Preserve fields outside this bounded projection; never spread them into canonical work. */
export declare const ProviderFields: Schema.$Record<Schema.String, Schema.Unknown>;
declare const SourceProjectionConflict_base: Schema.Class<SourceProjectionConflict, Schema.TaggedStruct<"SourceProjectionConflict", {
    readonly reason: Schema.Literal<"source-binding">;
}>, import("effect/Cause").YieldableError>;
export declare class SourceProjectionConflict extends SourceProjectionConflict_base {
}
export declare const validateProjectionSource: (context: ProjectionContext, model: string, id: string | number) => Effect.Effect<void, SourceProjectionConflict>;
export {};
//# sourceMappingURL=SourceProjection.d.ts.map