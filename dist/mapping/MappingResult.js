import { Schema } from 'effect';
import { EvidenceRef } from "../core/Envelope.js";
import { CanonicalRef } from "./CanonicalRef.js";
import { MappingValue } from "./MappingDefinition.js";
import { SourceRecordRef } from "./SourceRecordRef.js";
export const MappingIssue = Schema.Struct({
    code: Schema.NonEmptyString,
    field: Schema.optional(Schema.NonEmptyString),
    message: Schema.NonEmptyString,
});
export const FieldMappingProvenance = Schema.Struct({
    source: SourceRecordRef,
    sourceField: Schema.NonEmptyString,
    targetField: Schema.NonEmptyString,
    transform: Schema.Literals(['copy', 'trim-string', 'lookup']),
    state: Schema.Literals(['mapped', 'missing', 'unsupported', 'conflict']),
    loss: Schema.Literals(['none', 'normalization', 'unmapped-value', 'missing-value']),
    evidenceRefs: Schema.Array(EvidenceRef),
});
/** Proposed values only; absent fields never represent deletion. */
export const MappingCandidate = Schema.Struct({
    canonical: CanonicalRef,
    targetSchemaVersion: Schema.NonEmptyString,
    values: Schema.Record(Schema.String, MappingValue),
});
const OutcomeFields = {
    candidates: Schema.Array(MappingCandidate),
    issues: Schema.Array(MappingIssue),
    fields: Schema.Array(FieldMappingProvenance),
};
export const MappingResult = Schema.TaggedUnion({
    mapped: { ...OutcomeFields, candidates: Schema.NonEmptyArray(MappingCandidate) },
    unresolved: OutcomeFields,
    ambiguous: OutcomeFields,
    conflict: OutcomeFields,
    unsupported: OutcomeFields,
});
//# sourceMappingURL=MappingResult.js.map