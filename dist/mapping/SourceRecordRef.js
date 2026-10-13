import { Schema } from 'effect';
/** Exact installed-system identity. Company context is deliberately separate. */
export const SourceRecordRef = Schema.Struct({
    installationId: Schema.NonEmptyString,
    model: Schema.NonEmptyString,
    recordKey: Schema.NonEmptyString,
});
/** No delimiter collisions, normalization, host-name inference, or clone equivalence. */
export const sourceRecordKey = (ref) => JSON.stringify([ref.installationId, ref.model, ref.recordKey]);
//# sourceMappingURL=SourceRecordRef.js.map