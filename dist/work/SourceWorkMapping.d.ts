/** Source identity and mapping decisions remain separate from canonical work. */
import { Schema } from 'effect';
export declare const SourceWorkMapping: Schema.Struct<{
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
export type SourceWorkMapping = typeof SourceWorkMapping.Type;
/** Lossless source state, including tenant/board scope; it asserts no authority. */
export declare const SourceWorkState: Schema.Struct<{
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly profileId: Schema.NonEmptyString;
    readonly profileVersion: Schema.NonEmptyString;
    readonly scope: Schema.NonEmptyString;
    readonly code: Schema.NonEmptyString;
    readonly label: Schema.optional<Schema.NonEmptyString>;
}>;
export type SourceWorkState = typeof SourceWorkState.Type;
//# sourceMappingURL=SourceWorkMapping.d.ts.map