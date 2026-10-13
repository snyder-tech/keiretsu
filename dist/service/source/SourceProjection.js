/** Source-only projections. The host resolves canonical identities and authority separately. */
import { Effect, Schema } from 'effect';
import { EvidenceRef } from "../../core/Envelope.js";
import { SourceRecordRef } from "../../mapping/SourceRecordRef.js";
import { SourceQuantity } from "../../work/WorkObservation.js";
import { SourceWorkMapping } from "../../work/SourceWorkMapping.js";
export const SourceWorkProjection = Schema.Struct({
    source: SourceRecordRef,
    mapping: SourceWorkMapping,
    kind: Schema.Literals(['container', 'work-item', 'service-case', 'observation', 'unsupported']),
    title: Schema.optional(Schema.String),
    parents: Schema.Array(SourceRecordRef),
    assignees: Schema.Array(SourceRecordRef),
    state: Schema.optional(Schema.Struct({ scope: Schema.NonEmptyString, code: Schema.NonEmptyString })),
    quantity: Schema.optional(SourceQuantity),
    holds: Schema.Array(Schema.NonEmptyString),
    evidence: Schema.NonEmptyArray(EvidenceRef),
});
export const recordRef = (installationId, model, id) => ({ installationId, model, recordKey: String(id) });
export const sourceEnvelope = (context) => ({ source: context.mapping.source, mapping: context.mapping, evidence: context.evidence });
export const SourceId = Schema.Int.check(Schema.isGreaterThan(0));
/** Preserve fields outside this bounded projection; never spread them into canonical work. */
export const ProviderFields = Schema.Record(Schema.String, Schema.Unknown);
export class SourceProjectionConflict extends Schema.TaggedError()('SourceProjectionConflict', { reason: Schema.Literal('source-binding') }) {
}
export const validateProjectionSource = (context, model, id) => context.mapping.source.model === model && context.mapping.source.recordKey === String(id) ? Effect.void : Effect.fail(new SourceProjectionConflict({ reason: 'source-binding' }));
//# sourceMappingURL=SourceProjection.js.map