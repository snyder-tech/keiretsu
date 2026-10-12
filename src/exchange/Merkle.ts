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
export const ProofStep = Schema.Struct({
  side: Schema.Literals(['left', 'right']),
  digest: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)),
});
/** @since 0.1.0 @category models */
export type ProofStep = typeof ProofStep.Type;

/**
 * Inclusion proof for one leaf (a record digest) in a tree of `size` leaves.
 *
 * @since 0.1.0
 * @category schemas
 */
export const InclusionProof = Schema.Struct({
  leaf: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)),
  index: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  size: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  path: Schema.Array(ProofStep),
});
/** @since 0.1.0 @category models */
export type InclusionProof = typeof InclusionProof.Type;

const hex = (bytes: Uint8Array): string => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.from(text.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));

const sha256 = (parts: ReadonlyArray<Uint8Array>): Effect.Effect<string> => {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const buffer = new Uint8Array(length);
  parts.reduce((offset, part) => {
    buffer.set(part, offset);
    return offset + part.length;
  }, 0);
  return Effect.map(
    Effect.promise(() => crypto.subtle.digest('SHA-256', buffer)),
    (digest) => hex(new Uint8Array(digest)),
  );
};

const LEAF = Uint8Array.of(0);
const NODE = Uint8Array.of(1);

const leafHash = (leaf: string): Effect.Effect<string> => sha256([LEAF, fromHex(leaf)]);
const nodeHash = (left: string, right: string): Effect.Effect<string> => sha256([NODE, fromHex(left), fromHex(right)]);

const splitPoint = (size: number): number => {
  let split = 1;
  while (split * 2 < size) split *= 2;
  return split;
};

const treeHash = (leaves: ReadonlyArray<string>): Effect.Effect<string> => {
  if (leaves.length === 0) return sha256([]);
  if (leaves.length === 1) return leafHash(leaves[0] ?? '');
  const split = splitPoint(leaves.length);
  return Effect.flatMap(Effect.all([treeHash(leaves.slice(0, split)), treeHash(leaves.slice(split))], { concurrency: 2 }), ([left, right]) => nodeHash(left, right));
};

/**
 * Canonical leaf order: lowercase digests sorted ascending.
 *
 * @since 0.1.0
 * @category ordering
 */
export const sortLeaves = (digests: ReadonlyArray<string>): ReadonlyArray<string> => digests.map((digest) => digest.toLowerCase()).sort();

/**
 * Merkle root over record digests (sorted first). The empty tree's root is SHA-256 of the empty string.
 *
 * @since 0.1.0
 * @category commitments
 */
export const merkleRoot = (recordDigests: ReadonlyArray<Sha256 | string>): Effect.Effect<string> => treeHash(sortLeaves(recordDigests));

const auditPath = (leaves: ReadonlyArray<string>, index: number): Effect.Effect<ReadonlyArray<ProofStep>> => {
  if (leaves.length <= 1) return Effect.succeed([]);
  const split = splitPoint(leaves.length);
  const left = leaves.slice(0, split);
  const right = leaves.slice(split);
  return index < split
    ? Effect.flatMap(Effect.all([auditPath(left, index), treeHash(right)], { concurrency: 2 }), ([path, sibling]) => Effect.succeed([...path, { side: 'right', digest: sibling } as const]))
    : Effect.flatMap(Effect.all([auditPath(right, index - split), treeHash(left)], { concurrency: 2 }), ([path, sibling]) => Effect.succeed([...path, { side: 'left', digest: sibling } as const]));
};

/**
 * Inclusion proof for `leaf` among `recordDigests`; `undefined` when absent.
 *
 * @since 0.1.0
 * @category commitments
 */
export const inclusionProof = (recordDigests: ReadonlyArray<string>, leaf: string): Effect.Effect<InclusionProof | undefined> => {
  const leaves = sortLeaves(recordDigests);
  const index = leaves.indexOf(leaf.toLowerCase());
  if (index < 0) return Effect.succeed(undefined);
  return Effect.map(auditPath(leaves, index), (path) => ({ leaf: leaf.toLowerCase(), index, size: leaves.length, path }));
};

/**
 * Recompute the root from a proof and compare. The path length and sibling
 * sides must match the tree shape implied by `index` and `size`.
 *
 * @since 0.1.0
 * @category commitments
 */
export const verifyInclusion = (root: string, proof: InclusionProof): Effect.Effect<boolean> =>
  Effect.gen(function* () {
    const sides = expectedSides(proof.index, proof.size);
    if (proof.index >= proof.size || sides.length !== proof.path.length || proof.path.some((step, position) => step.side !== sides[position])) return false;
    let current = yield* leafHash(proof.leaf);
    for (const step of proof.path) current = step.side === 'right' ? yield* nodeHash(current, step.digest) : yield* nodeHash(step.digest, current);
    return current === root.toLowerCase();
  });

/** Sibling sides from the leaf upward, implied by the leaf's index and the tree size. */
const expectedSides = (index: number, size: number): ReadonlyArray<ProofStep['side']> => {
  if (size <= 1) return [];
  const split = splitPoint(size);
  return index < split ? [...expectedSides(index, split), 'right'] : [...expectedSides(index - split, size - split), 'left'];
};
