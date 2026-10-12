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
const hex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (text) => Uint8Array.from(text.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
const sha256 = (parts) => {
    const length = parts.reduce((total, part) => total + part.length, 0);
    const buffer = new Uint8Array(length);
    parts.reduce((offset, part) => {
        buffer.set(part, offset);
        return offset + part.length;
    }, 0);
    return Effect.map(Effect.promise(() => crypto.subtle.digest('SHA-256', buffer)), (digest) => hex(new Uint8Array(digest)));
};
const LEAF = Uint8Array.of(0);
const NODE = Uint8Array.of(1);
const leafHash = (leaf) => sha256([LEAF, fromHex(leaf)]);
const nodeHash = (left, right) => sha256([NODE, fromHex(left), fromHex(right)]);
const splitPoint = (size) => {
    let split = 1;
    while (split * 2 < size)
        split *= 2;
    return split;
};
const treeHash = (leaves) => {
    if (leaves.length === 0)
        return sha256([]);
    if (leaves.length === 1)
        return leafHash(leaves[0] ?? '');
    const split = splitPoint(leaves.length);
    return Effect.flatMap(Effect.all([treeHash(leaves.slice(0, split)), treeHash(leaves.slice(split))], { concurrency: 2 }), ([left, right]) => nodeHash(left, right));
};
/**
 * Canonical leaf order: lowercase digests sorted ascending.
 *
 * @since 0.1.0
 * @category ordering
 */
export const sortLeaves = (digests) => digests.map((digest) => digest.toLowerCase()).sort();
/**
 * Merkle root over record digests (sorted first). The empty tree's root is SHA-256 of the empty string.
 *
 * @since 0.1.0
 * @category commitments
 */
export const merkleRoot = (recordDigests) => treeHash(sortLeaves(recordDigests));
const auditPath = (leaves, index) => {
    if (leaves.length <= 1)
        return Effect.succeed([]);
    const split = splitPoint(leaves.length);
    const left = leaves.slice(0, split);
    const right = leaves.slice(split);
    return index < split
        ? Effect.flatMap(Effect.all([auditPath(left, index), treeHash(right)], { concurrency: 2 }), ([path, sibling]) => Effect.succeed([...path, { side: 'right', digest: sibling }]))
        : Effect.flatMap(Effect.all([auditPath(right, index - split), treeHash(left)], { concurrency: 2 }), ([path, sibling]) => Effect.succeed([...path, { side: 'left', digest: sibling }]));
};
/**
 * Inclusion proof for `leaf` among `recordDigests`; `undefined` when absent.
 *
 * @since 0.1.0
 * @category commitments
 */
export const inclusionProof = (recordDigests, leaf) => {
    const leaves = sortLeaves(recordDigests);
    const index = leaves.indexOf(leaf.toLowerCase());
    if (index < 0)
        return Effect.succeed(undefined);
    return Effect.map(auditPath(leaves, index), (path) => ({ leaf: leaf.toLowerCase(), index, size: leaves.length, path }));
};
/**
 * Recompute the root from a proof and compare. The path length and sibling
 * sides must match the tree shape implied by `index` and `size`.
 *
 * @since 0.1.0
 * @category commitments
 */
export const verifyInclusion = (root, proof) => Effect.gen(function* () {
    const sides = expectedSides(proof.index, proof.size);
    if (proof.index >= proof.size || sides.length !== proof.path.length || proof.path.some((step, position) => step.side !== sides[position]))
        return false;
    let current = yield* leafHash(proof.leaf);
    for (const step of proof.path)
        current = step.side === 'right' ? yield* nodeHash(current, step.digest) : yield* nodeHash(step.digest, current);
    return current === root.toLowerCase();
});
/** Sibling sides from the leaf upward, implied by the leaf's index and the tree size. */
const expectedSides = (index, size) => {
    if (size <= 1)
        return [];
    const split = splitPoint(size);
    return index < split ? [...expectedSides(index, split), 'right'] : [...expectedSides(index - split, size - split), 'left'];
};
//# sourceMappingURL=Merkle.js.map