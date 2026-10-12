/**
 * Common record envelopes: evidence, assurance, revision chains and bitemporal stamps.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Sha256 } from './CanonicalJson.ts';
import { Instant, IsoDate } from './Temporal.ts';

/**
 * How strongly an assertion is supported.
 * `verified` requires evidence a human reviewed; packages never set it themselves.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Assurance = Schema.Literals(['verified', 'asserted', 'unverified']);
/** @since 0.1.0 @category models */
export type Assurance = typeof Assurance.Type;

/**
 * Pointer to evidence held by the record's owner (document id, ledger ref, URI). Never the document itself.
 *
 * @since 0.1.0
 * @category schemas
 */
export const EvidenceRef = Schema.Struct({
  kind: Schema.NonEmptyString,
  ref: Schema.NonEmptyString,
  digest: Schema.optional(Sha256),
});
/** @since 0.1.0 @category models */
export type EvidenceRef = typeof EvidenceRef.Type;

/**
 * Revision fields: revision 1 has no `supersedesDigest`; later revisions must name the digest they replace.
 *
 * @since 0.1.0
 * @category fields
 */
export const RevisionFields = {
  revision: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  supersedesDigest: Schema.optional(Sha256),
} as const;

/**
 * Bitemporal fields: valid time (half-open) and recorded time.
 *
 * @since 0.1.0
 * @category fields
 */
export const BitemporalFields = {
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  recordedAt: Instant,
} as const;

/**
 * Assertion fields: evidence and assurance.
 *
 * @since 0.1.0
 * @category fields
 */
export const AssertionFields = {
  evidence: Schema.Array(EvidenceRef),
  assurance: Assurance,
} as const;

/**
 * Check that `supersedesDigest` is present exactly when `revision > 1`.
 *
 * @since 0.1.0
 * @category checks
 */
export const revisionChain = Schema.makeFilter<{ readonly revision: number; readonly supersedesDigest?: string | undefined }>((record) =>
  (record.revision > 1) === (record.supersedesDigest !== undefined) ? undefined : 'supersedesDigest is required exactly when revision > 1',
);

/**
 * Check that a half-open valid interval is not empty or inverted.
 *
 * @since 0.1.0
 * @category checks
 */
export const validInterval = Schema.makeFilter<{ readonly validFrom: string; readonly validTo?: string | undefined }>((record) =>
  record.validTo === undefined || record.validFrom < record.validTo ? undefined : 'validTo must follow validFrom',
);

/**
 * Check that `verified` assurance carries at least one evidence reference.
 *
 * @since 0.1.0
 * @category checks
 */
export const verifiedHasEvidence = Schema.makeFilter<{ readonly assurance: Assurance; readonly evidence: ReadonlyArray<unknown> }>((record) =>
  record.assurance !== 'verified' || record.evidence.length > 0 ? undefined : 'verified assurance requires evidence',
);
