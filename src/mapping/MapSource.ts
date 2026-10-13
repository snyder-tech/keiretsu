import { Schema } from 'effect';

import { type IsoDate } from '../core/Temporal.ts';
import { canonicalRefKey, type CanonicalRef } from './CanonicalRef.ts';
import { type MappingDefinition, type MappingField, MappingValue, type SourceConfiguration } from './MappingDefinition.ts';
import { type FieldMappingProvenance, type MappingCandidate, type MappingIssue, type MappingResult } from './MappingResult.ts';
import { activeSourceBindings, type SourceBinding } from './SourceBinding.ts';
import { type SourceRecordRef } from './SourceRecordRef.ts';

export interface MapSourceInput {
  readonly source: SourceRecordRef;
  readonly values: Readonly<Record<string, unknown>>;
  readonly sourceConfiguration: SourceConfiguration;
  readonly mapping: MappingDefinition;
  readonly bindings: ReadonlyArray<SourceBinding>;
  readonly asOf: IsoDate;
  readonly direction: MappingDefinition['direction'];
  readonly companyContext?: CanonicalRef | undefined;
}

const sameConfiguration = (left: SourceConfiguration, right: SourceConfiguration): boolean =>
  left.product === right.product &&
  left.version === right.version &&
  left.configurationDigest === right.configurationDigest &&
  JSON.stringify([...left.modules].sort()) === JSON.stringify([...right.modules].sort());

const preflight = (input: MapSourceInput): ReadonlyArray<MappingIssue> => {
  const issues: Array<MappingIssue> = [];
  if (input.direction !== 'source-to-canonical' || input.mapping.direction !== input.direction)
    issues.push({ code: 'direction-unsupported', message: 'This operation only executes explicit source-to-canonical mappings; no inverse is inferred.' });
  if (input.source.model !== input.mapping.sourceModel) issues.push({ code: 'model-mismatch', message: 'The source model does not match the definition.' });
  if (!sameConfiguration(input.sourceConfiguration, input.mapping.sourceConfiguration))
    issues.push({ code: 'configuration-mismatch', message: 'Product, version, modules and configuration digest must match the mapping definition.' });
  return issues;
};

interface TransformedValue {
  readonly value?: MappingValue | undefined;
  readonly loss: FieldMappingProvenance['loss'];
  readonly issue?: MappingIssue | undefined;
}

const transformValue = (field: MappingField, value: unknown): TransformedValue => {
  const scalar = Schema.decodeUnknownResult(MappingValue)(value);
  if (scalar._tag === 'Failure') return { loss: 'unmapped-value', issue: { code: 'value-unsupported', field: field.targetField, message: 'The source field is not a canonical scalar.' } };
  switch (field.transform._tag) {
    case 'copy':
      return { value: scalar.success, loss: 'none' };
    case 'trim-string': {
      if (typeof scalar.success !== 'string') return { loss: 'unmapped-value', issue: { code: 'transform-type', field: field.targetField, message: 'trim-string requires a string.' } };
      const trimmed = scalar.success.trim();
      return { value: trimmed, loss: trimmed === scalar.success ? 'none' : 'normalization' };
    }
    case 'lookup': {
      const key = String(scalar.success);
      if (!Object.hasOwn(field.transform.values, key))
        return { loss: 'unmapped-value', issue: { code: 'lookup-unresolved', field: field.targetField, message: 'No explicit lookup exists for the source value.' } };
      return { value: field.transform.values[key], loss: 'none' };
    }
  }
};

interface FieldEvaluation {
  readonly values: Readonly<Record<string, MappingValue>>;
  readonly fields: ReadonlyArray<FieldMappingProvenance>;
  readonly issues: ReadonlyArray<MappingIssue>;
  readonly unresolved: boolean;
}

interface EvaluatedField {
  readonly value?: MappingValue | undefined;
  readonly provenance: FieldMappingProvenance;
  readonly issues: ReadonlyArray<MappingIssue>;
  readonly unresolved: boolean;
}

const fieldState = (missing: boolean, transformed: TransformedValue, rejectedLoss: boolean): FieldMappingProvenance['state'] => {
  if (missing) return 'missing';
  return transformed.issue !== undefined || rejectedLoss ? 'unsupported' : 'mapped';
};

const rejectsLoss = (field: MappingField, transformed: TransformedValue): boolean => transformed.loss !== 'none' && transformed.loss !== 'missing-value' && field.loss === 'reject';

const evaluateField = (input: MapSourceInput, field: MappingField, binding: SourceBinding): EvaluatedField => {
  const missing = !Object.hasOwn(input.values, field.sourceField) || input.values[field.sourceField] === undefined;
  const transformed: TransformedValue = missing ? { loss: 'missing-value' } : transformValue(field, input.values[field.sourceField]);
  const rejectedLoss = rejectsLoss(field, transformed);
  const unresolved = missing && field.missing === 'unresolved';
  const issues: Array<MappingIssue> = [];
  if (unresolved) issues.push({ code: 'required-source-field-missing', field: field.targetField, message: 'The source does not contain a required field; absence is not deletion.' });
  if (transformed.issue !== undefined) issues.push(transformed.issue);
  if (rejectedLoss) issues.push({ code: 'field-loss-rejected', field: field.targetField, message: 'The definition rejects this transformation loss.' });
  return {
    value: rejectedLoss ? undefined : transformed.value,
    provenance: {
      source: input.source,
      sourceField: field.sourceField,
      targetField: field.targetField,
      transform: field.transform._tag,
      state: fieldState(missing, transformed, rejectedLoss),
      loss: transformed.loss,
      evidenceRefs: binding.evidenceRefs,
    },
    issues,
    unresolved,
  };
};

const evaluateFields = (input: MapSourceInput, binding: SourceBinding): FieldEvaluation => {
  const values: Record<string, MappingValue> = Object.create(null);
  const fields: Array<FieldMappingProvenance> = [];
  const issues: Array<MappingIssue> = [];
  let unresolved = false;
  for (const field of input.mapping.fields) {
    const evaluated = evaluateField(input, field, binding);
    unresolved ||= evaluated.unresolved;
    issues.push(...evaluated.issues);
    if (evaluated.value !== undefined) Object.defineProperty(values, field.targetField, { value: evaluated.value, enumerable: true });
    fields.push(evaluated.provenance);
  }
  return { values, fields, issues, unresolved };
};

/** Pure candidate projection; source claims are never trusted binding or field authority. */
export const mapSource = (input: MapSourceInput): MappingResult => {
  const problems = preflight(input);
  if (problems.length > 0) return { _tag: 'unsupported', candidates: [], fields: [], issues: problems };
  const bindings = activeSourceBindings(input.bindings, input.source, input.asOf).filter(
    (binding) => binding.relationship === 'kind-equivalence' && binding.canonical.namespace === input.mapping.targetNamespace && binding.canonical.kind === input.mapping.targetKind,
  );
  if (bindings.length === 0) return { _tag: 'unresolved', candidates: [], fields: [], issues: [{ code: 'binding-unresolved', message: 'No active evidenced kind-equivalence binding exists.' }] };
  const refs = new Set(bindings.map((binding) => canonicalRefKey(binding.canonical)));
  if (refs.size > 1) return { _tag: 'ambiguous', candidates: [], fields: [], issues: [{ code: 'binding-ambiguous', message: 'The exact source identity has multiple active canonical targets.' }] };
  const binding = bindings[0];
  if (binding === undefined) return { _tag: 'unresolved', candidates: [], fields: [], issues: [{ code: 'binding-unresolved', message: 'No active binding exists.' }] };
  const evaluated = evaluateFields(input, binding);
  const candidate: MappingCandidate = { canonical: binding.canonical, targetSchemaVersion: input.mapping.targetSchemaVersion, values: evaluated.values };
  const shared = { candidates: [candidate], fields: evaluated.fields, issues: evaluated.issues };
  if (evaluated.unresolved) return { _tag: 'unresolved', ...shared };
  if (evaluated.issues.length > 0) return { _tag: 'unsupported', ...shared };
  return { _tag: 'mapped', ...shared, candidates: [candidate] };
};

/** Compare candidates to current facts without selecting authority or mutating records. */
export const mappingConflicts = (result: MappingResult, current: Readonly<Record<string, MappingValue>>): MappingResult => {
  if (result._tag !== 'mapped') return result;
  const issues: Array<MappingIssue> = [];
  for (const candidate of result.candidates) {
    for (const [field, value] of Object.entries(candidate.values)) {
      if (Object.hasOwn(current, field) && current[field] !== value) issues.push({ code: 'current-value-conflict', field, message: 'The candidate differs from the current canonical value.' });
    }
  }
  return issues.length === 0
    ? result
    : {
        _tag: 'conflict',
        candidates: result.candidates,
        fields: result.fields.map((field) => (issues.some((issue) => issue.field === field.targetField) ? { ...field, state: 'conflict' } : field)),
        issues,
      };
};
