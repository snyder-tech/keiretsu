/**
 * Merkle commitments over record digests (v0.2 preview).
 *
 * An `aggregate` bundle can carry totals plus a Merkle root over the per-row
 * record digests it summarises. Rows stay with the issuer; a row is opened
 * later (under a DPA or audit) with an inclusion proof, without re-signing.
 *
 * Construction follows RFC 6962 §2.1: leaf hash `SHA-256(0x00 ‖ leaf)`, node
 * hash `SHA-256(0x01 ‖ left ‖ right)`, split at the largest power of two
 * below n (no duplicated last leaf, so no CVE-2012-2459 ambiguity). Leaves are
 * the 32-byte record digests, sorted ascending first so the commitment does
 * not depend on row order.
 *
 * @since 0.1.0
 * @module
 */
import type { Sha256 } from '../core/CanonicalJson.ts';
import { Effect, Schema } from 'effect';
/**
 * One step of an audit path: the sibling digest and which side it sits on.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ProofStep: Schema.Struct<{
    readonly side: Schema.Literals<readonly ["left", "right"]>;
    readonly digest: Schema.String;
}>;
/** @since 0.1.0 @category models */
export type ProofStep = typeof ProofStep.Type;
/**
 * Inclusion proof for one leaf (a record digest) in a tree of `size` leaves.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const InclusionProof: Schema.Struct<{
    readonly leaf: Schema.String;
    readonly index: Schema.Number;
    readonly size: Schema.Number;
    readonly path: Schema.$Array<Schema.Struct<{
        readonly side: Schema.Literals<readonly ["left", "right"]>;
        readonly digest: Schema.String;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type InclusionProof = typeof InclusionProof.Type;
/**
 * Canonical leaf order: lowercase digests sorted ascending.
 *
 * @since 0.1.0
 * @category ordering
 */
export declare const sortLeaves: (digests: ReadonlyArray<string>) => ReadonlyArray<string>;
/**
 * Merkle root over record digests (sorted first). The empty tree's root is SHA-256 of the empty string.
 *
 * @since 0.1.0
 * @category commitments
 */
export declare const merkleRoot: (recordDigests: ReadonlyArray<Sha256 | string>) => Effect.Effect<string>;
/**
 * Inclusion proof for `leaf` among `recordDigests`; `undefined` when absent.
 *
 * @since 0.1.0
 * @category commitments
 */
export declare const inclusionProof: (recordDigests: ReadonlyArray<string>, leaf: string) => Effect.Effect<InclusionProof | undefined>;
/**
 * Recompute the root from a proof and compare. The path length and sibling
 * sides must match the tree shape implied by `index` and `size`.
 *
 * @since 0.1.0
 * @category commitments
 */
export declare const verifyInclusion: (root: string, proof: InclusionProof) => Effect.Effect<boolean>;
//# sourceMappingURL=Merkle.d.ts.map