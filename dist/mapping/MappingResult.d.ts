import { Schema } from 'effect';
export declare const MappingIssue: Schema.Struct<{
    readonly code: Schema.NonEmptyString;
    readonly field: Schema.optional<Schema.NonEmptyString>;
    readonly message: Schema.NonEmptyString;
}>;
export type MappingIssue = typeof MappingIssue.Type;
export declare const FieldMappingProvenance: Schema.Struct<{
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly sourceField: Schema.NonEmptyString;
    readonly targetField: Schema.NonEmptyString;
    readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
    readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
    readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
    readonly evidenceRefs: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type FieldMappingProvenance = typeof FieldMappingProvenance.Type;
/** Proposed values only; absent fields never represent deletion. */
export declare const MappingCandidate: Schema.Struct<{
    readonly canonical: Schema.Struct<{
        readonly namespace: Schema.NonEmptyString;
        readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
        readonly id: Schema.NonEmptyString;
    }>;
    readonly targetSchemaVersion: Schema.NonEmptyString;
    readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
}>;
export type MappingCandidate = typeof MappingCandidate.Type;
export declare const MappingResult: Schema.TaggedUnion<{
    readonly mapped: Schema.TaggedStruct<"mapped", {
        readonly candidates: Schema.NonEmptyArray<Schema.Struct<{
            readonly canonical: Schema.Struct<{
                readonly namespace: Schema.NonEmptyString;
                readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                readonly id: Schema.NonEmptyString;
            }>;
            readonly targetSchemaVersion: Schema.NonEmptyString;
            readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
        }>>;
        readonly issues: Schema.$Array<Schema.Struct<{
            readonly code: Schema.NonEmptyString;
            readonly field: Schema.optional<Schema.NonEmptyString>;
            readonly message: Schema.NonEmptyString;
        }>>;
        readonly fields: Schema.$Array<Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly sourceField: Schema.NonEmptyString;
            readonly targetField: Schema.NonEmptyString;
            readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
            readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
            readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
            readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
    readonly conflict: Schema.TaggedStruct<"conflict", {
        candidates: Schema.$Array<Schema.Struct<{
            readonly canonical: Schema.Struct<{
                readonly namespace: Schema.NonEmptyString;
                readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                readonly id: Schema.NonEmptyString;
            }>;
            readonly targetSchemaVersion: Schema.NonEmptyString;
            readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
        }>>;
        issues: Schema.$Array<Schema.Struct<{
            readonly code: Schema.NonEmptyString;
            readonly field: Schema.optional<Schema.NonEmptyString>;
            readonly message: Schema.NonEmptyString;
        }>>;
        fields: Schema.$Array<Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly sourceField: Schema.NonEmptyString;
            readonly targetField: Schema.NonEmptyString;
            readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
            readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
            readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
            readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
    readonly ambiguous: Schema.TaggedStruct<"ambiguous", {
        candidates: Schema.$Array<Schema.Struct<{
            readonly canonical: Schema.Struct<{
                readonly namespace: Schema.NonEmptyString;
                readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                readonly id: Schema.NonEmptyString;
            }>;
            readonly targetSchemaVersion: Schema.NonEmptyString;
            readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
        }>>;
        issues: Schema.$Array<Schema.Struct<{
            readonly code: Schema.NonEmptyString;
            readonly field: Schema.optional<Schema.NonEmptyString>;
            readonly message: Schema.NonEmptyString;
        }>>;
        fields: Schema.$Array<Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly sourceField: Schema.NonEmptyString;
            readonly targetField: Schema.NonEmptyString;
            readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
            readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
            readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
            readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
    readonly unresolved: Schema.TaggedStruct<"unresolved", {
        candidates: Schema.$Array<Schema.Struct<{
            readonly canonical: Schema.Struct<{
                readonly namespace: Schema.NonEmptyString;
                readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                readonly id: Schema.NonEmptyString;
            }>;
            readonly targetSchemaVersion: Schema.NonEmptyString;
            readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
        }>>;
        issues: Schema.$Array<Schema.Struct<{
            readonly code: Schema.NonEmptyString;
            readonly field: Schema.optional<Schema.NonEmptyString>;
            readonly message: Schema.NonEmptyString;
        }>>;
        fields: Schema.$Array<Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly sourceField: Schema.NonEmptyString;
            readonly targetField: Schema.NonEmptyString;
            readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
            readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
            readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
            readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
    readonly unsupported: Schema.TaggedStruct<"unsupported", {
        candidates: Schema.$Array<Schema.Struct<{
            readonly canonical: Schema.Struct<{
                readonly namespace: Schema.NonEmptyString;
                readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                readonly id: Schema.NonEmptyString;
            }>;
            readonly targetSchemaVersion: Schema.NonEmptyString;
            readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
        }>>;
        issues: Schema.$Array<Schema.Struct<{
            readonly code: Schema.NonEmptyString;
            readonly field: Schema.optional<Schema.NonEmptyString>;
            readonly message: Schema.NonEmptyString;
        }>>;
        fields: Schema.$Array<Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly sourceField: Schema.NonEmptyString;
            readonly targetField: Schema.NonEmptyString;
            readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
            readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
            readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
            readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
}>;
export type MappingResult = typeof MappingResult.Type;
//# sourceMappingURL=MappingResult.d.ts.map