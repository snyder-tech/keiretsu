import { Schema } from 'effect';
import { Sha256 } from "../core/CanonicalJson.js";
import { CanonicalKind } from "./CanonicalRef.js";
/** Installation configuration participates in mapping identity, not company identity. */
export const SourceConfiguration = Schema.Struct({
    product: Schema.NonEmptyString,
    version: Schema.NonEmptyString,
    modules: Schema.Array(Schema.NonEmptyString),
    configurationDigest: Sha256,
});
/** Canonical scalars; decimal quantities travel as strings. No executable expressions. */
export const MappingValue = Schema.Union([Schema.String, Schema.Number.check(Schema.isInt()), Schema.Boolean, Schema.Null]);
export const FieldTransform = Schema.TaggedUnion({
    copy: {},
    'trim-string': {},
    lookup: { values: Schema.Record(Schema.String, MappingValue) },
});
export const MappingField = Schema.Struct({
    sourceField: Schema.NonEmptyString,
    targetField: Schema.NonEmptyString,
    transform: FieldTransform,
    missing: Schema.Literals(['preserve', 'unresolved']),
    loss: Schema.Literals(['reject', 'report']),
});
/** An outbound mapping is authored separately; imports are never implicitly inverted. */
export const MappingDefinition = Schema.Struct({
    id: Schema.NonEmptyString,
    version: Schema.NonEmptyString,
    sourceConfiguration: SourceConfiguration,
    sourceModel: Schema.NonEmptyString,
    targetNamespace: Schema.NonEmptyString,
    targetKind: CanonicalKind,
    targetSchemaVersion: Schema.NonEmptyString,
    direction: Schema.Literals(['source-to-canonical', 'canonical-to-source']),
    fields: Schema.NonEmptyArray(MappingField),
}).check(Schema.makeFilter((mapping) => (new Set(mapping.fields.map((field) => field.targetField)).size === mapping.fields.length ? undefined : 'Each target field must have exactly one transform')));
//# sourceMappingURL=MappingDefinition.js.map