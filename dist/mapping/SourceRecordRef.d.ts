import { Schema } from 'effect';
/** Exact installed-system identity. Company context is deliberately separate. */
export declare const SourceRecordRef: Schema.Struct<{
    readonly installationId: Schema.NonEmptyString;
    readonly model: Schema.NonEmptyString;
    readonly recordKey: Schema.NonEmptyString;
}>;
export type SourceRecordRef = typeof SourceRecordRef.Type;
/** No delimiter collisions, normalization, host-name inference, or clone equivalence. */
export declare const sourceRecordKey: (ref: SourceRecordRef) => string;
//# sourceMappingURL=SourceRecordRef.d.ts.map