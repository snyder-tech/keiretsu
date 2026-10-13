import { Schema } from 'effect';
/** Installation configuration participates in mapping identity, not company identity. */
export declare const SourceConfiguration: Schema.Struct<{
    readonly product: Schema.NonEmptyString;
    readonly version: Schema.NonEmptyString;
    readonly modules: Schema.$Array<Schema.NonEmptyString>;
    readonly configurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type SourceConfiguration = typeof SourceConfiguration.Type;
/** Canonical scalars; decimal quantities travel as strings. No executable expressions. */
export declare const MappingValue: Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>;
export type MappingValue = typeof MappingValue.Type;
export declare const FieldTransform: Schema.TaggedUnion<{
    readonly lookup: Schema.TaggedStruct<"lookup", {
        readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
    }>;
    readonly copy: Schema.TaggedStruct<"copy", {}>;
    readonly "trim-string": Schema.TaggedStruct<"trim-string", {}>;
}>;
export type FieldTransform = typeof FieldTransform.Type;
export declare const MappingField: Schema.Struct<{
    readonly sourceField: Schema.NonEmptyString;
    readonly targetField: Schema.NonEmptyString;
    readonly transform: Schema.TaggedUnion<{
        readonly lookup: Schema.TaggedStruct<"lookup", {
            readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
        }>;
        readonly copy: Schema.TaggedStruct<"copy", {}>;
        readonly "trim-string": Schema.TaggedStruct<"trim-string", {}>;
    }>;
    readonly missing: Schema.Literals<readonly ["preserve", "unresolved"]>;
    readonly loss: Schema.Literals<readonly ["reject", "report"]>;
}>;
export type MappingField = typeof MappingField.Type;
/** An outbound mapping is authored separately; imports are never implicitly inverted. */
export declare const MappingDefinition: Schema.Struct<{
    readonly id: Schema.NonEmptyString;
    readonly version: Schema.NonEmptyString;
    readonly sourceConfiguration: Schema.Struct<{
        readonly product: Schema.NonEmptyString;
        readonly version: Schema.NonEmptyString;
        readonly modules: Schema.$Array<Schema.NonEmptyString>;
        readonly configurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
    readonly sourceModel: Schema.NonEmptyString;
    readonly targetNamespace: Schema.NonEmptyString;
    readonly targetKind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
    readonly targetSchemaVersion: Schema.NonEmptyString;
    readonly direction: Schema.Literals<readonly ["source-to-canonical", "canonical-to-source"]>;
    readonly fields: Schema.NonEmptyArray<Schema.Struct<{
        readonly sourceField: Schema.NonEmptyString;
        readonly targetField: Schema.NonEmptyString;
        readonly transform: Schema.TaggedUnion<{
            readonly lookup: Schema.TaggedStruct<"lookup", {
                readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
            }>;
            readonly copy: Schema.TaggedStruct<"copy", {}>;
            readonly "trim-string": Schema.TaggedStruct<"trim-string", {}>;
        }>;
        readonly missing: Schema.Literals<readonly ["preserve", "unresolved"]>;
        readonly loss: Schema.Literals<readonly ["reject", "report"]>;
    }>>;
}>;
export type MappingDefinition = typeof MappingDefinition.Type;
//# sourceMappingURL=MappingDefinition.d.ts.map