/**
 * Exact allocation of an integer total by weights (largest remainder).
 *
 * The parts always sum to the total — there is never a balancing plug. Ties
 * on the remainder go to the earliest key in `tieBreak` order, which callers
 * declare and record.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect } from 'effect';
import { make, units } from "./Money.js";
/**
 * Weights that cannot be allocated against.
 *
 * @since 0.1.0
 * @category errors
 */
export class InvalidWeights extends Data.TaggedError('InvalidWeights') {
}
const validate = (weights) => {
    if (weights.length === 0)
        return Effect.fail(new InvalidWeights({ reason: 'no weights' }));
    if (weights.some((entry) => entry.weight < 0n))
        return Effect.fail(new InvalidWeights({ reason: 'negative weight' }));
    if (new Set(weights.map((entry) => entry.key)).size !== weights.length)
        return Effect.fail(new InvalidWeights({ reason: 'duplicate key' }));
    const total = weights.reduce((sum, entry) => sum + entry.weight, 0n);
    return total === 0n ? Effect.fail(new InvalidWeights({ reason: 'weights sum to zero' })) : Effect.succeed(total);
};
/**
 * Split an integer total across weights. Order of `weights` is the tie-break order.
 *
 * @example
 * ```ts
 * import { Effect } from 'effect'
 * import { allocateUnits } from './Allocation.ts'
 * Effect.runSync(allocateUnits(100n, [{ key: 'a', weight: 1n }, { key: 'b', weight: 1n }, { key: 'c', weight: 1n }]))
 * // Map { a → 34n, b → 33n, c → 33n }
 * ```
 * @since 0.1.0
 * @category math
 */
export const allocateUnits = (total, weights) => Effect.map(validate(weights), (weightTotal) => {
    const sign = total < 0n ? -1n : 1n;
    const magnitude = total * sign;
    const shares = weights.map((entry, order) => ({ key: entry.key, order, floor: (magnitude * entry.weight) / weightTotal, remainder: (magnitude * entry.weight) % weightTotal }));
    let leftover = magnitude - shares.reduce((sum, share) => sum + share.floor, 0n);
    const ranked = [...shares].sort((left, right) => (left.remainder === right.remainder ? left.order - right.order : left.remainder > right.remainder ? -1 : 1));
    const result = new Map(shares.map((share) => [share.key, share.floor]));
    for (const share of ranked) {
        if (leftover === 0n)
            break;
        result.set(share.key, (result.get(share.key) ?? 0n) + 1n);
        leftover -= 1n;
    }
    return new Map([...result].map(([key, value]) => [key, value * sign]));
});
/**
 * Split a money total across weights in its own minor units.
 *
 * @since 0.1.0
 * @category math
 */
export const allocateMoney = (total, weights) => Effect.map(allocateUnits(units(total), weights), (parts) => new Map([...parts].map(([key, value]) => [key, make(value, total.currency)])));
//# sourceMappingURL=Allocation.js.map