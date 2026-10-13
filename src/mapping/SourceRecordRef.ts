import { Schema } from 'effect';

/** Exact installed-system identity. Company context is deliberately separate. */
export const SourceRecordRef = Schema.Struct({
  installationId: Schema.NonEmptyString,
  model: Schema.NonEmptyString,
  recordKey: Schema.NonEmptyString,
});
export type SourceRecordRef = typeof SourceRecordRef.Type;

/** No delimiter collisions, normalization, host-name inference, or clone equivalence. */
export const sourceRecordKey = (ref: SourceRecordRef): string => JSON.stringify([ref.installationId, ref.model, ref.recordKey]);
