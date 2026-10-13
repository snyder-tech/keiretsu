import { Schema } from 'effect';

import { Sha256 } from '../core/CanonicalJson.ts';
import { CanonicalKind } from './CanonicalRef.ts';

/** Installation configuration participates in mapping identity, not company identity. */
export const SourceConfiguration = Schema.Struct({
  product: Schema.NonEmptyString,
  version: Schema.NonEmptyString,
  modules: Schema.Array(Schema.NonEmptyString),
  configurationDigest: Sha256,
});
export type SourceConfiguration = typeof SourceConfiguration.Type;

/** Canonical scalars; decimal quantities travel as strings. No executable expressions. */
export const MappingValue = Schema.Union([Schema.String, Schema.Number.check(Schema.isInt()), Schema.Boolean, Schema.Null]);
export type MappingValue = typeof MappingValue.Type;

export const FieldTransform = Schema.TaggedUnion({
  copy: {},
  'trim-string': {},
  lookup: { values: Schema.Record(Schema.String, MappingValue) },
});
export type FieldTransform = typeof FieldTransform.Type;

export const MappingField = Schema.Struct({
  sourceField: Schema.NonEmptyString,
  targetField: Schema.NonEmptyString,
  transform: FieldTransform,
  missing: Schema.Literals(['preserve', 'unresolved']),
  loss: Schema.Literals(['reject', 'report']),
});
export type MappingField = typeof MappingField.Type;

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
export type MappingDefinition = typeof MappingDefinition.Type;
