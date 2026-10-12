/**
 * Common record envelopes: evidence, assurance, revision chains and bitemporal stamps.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * How strongly an assertion is supported.
 * `verified` requires evidence a human reviewed; packages never set it themselves.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
/** @since 0.1.0 @category models */
export type Assurance = typeof Assurance.Type;
/**
 * Pointer to evidence held by the record's owner (document id, ledger ref, URI). Never the document itself.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const EvidenceRef: Schema.Struct<{
    readonly kind: Schema.NonEmptyString;
    readonly ref: Schema.NonEmptyString;
    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type EvidenceRef = typeof EvidenceRef.Type;
/**
 * Revision fields: revision 1 has no `supersedesDigest`; later revisions must name the digest they replace.
 *
 * @since 0.1.0
 * @category fields
 */
export declare const RevisionFields: {
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
};
/**
 * Bitemporal fields: valid time (half-open) and recorded time.
 *
 * @since 0.1.0
 * @category fields
 */
export declare const BitemporalFields: {
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
};
/**
 * Assertion fields: evidence and assurance.
 *
 * @since 0.1.0
 * @category fields
 */
export declare const AssertionFields: {
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
};
/**
 * Check that `supersedesDigest` is present exactly when `revision > 1`.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const revisionChain: import("effect/SchemaAST").Filter<{
    readonly revision: number;
    readonly supersedesDigest?: string | undefined;
}>;
/**
 * Check that a half-open valid interval is not empty or inverted.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const validInterval: import("effect/SchemaAST").Filter<{
    readonly validFrom: string;
    readonly validTo?: string | undefined;
}>;
/**
 * Check that `verified` assurance carries at least one evidence reference.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const verifiedHasEvidence: import("effect/SchemaAST").Filter<{
    readonly assurance: Assurance;
    readonly evidence: ReadonlyArray<unknown>;
}>;
//# sourceMappingURL=Envelope.d.ts.map