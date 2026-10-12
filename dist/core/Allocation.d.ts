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
import { Effect } from 'effect';
import type { Money } from './Money.ts';
declare const InvalidWeights_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidWeights";
} & Readonly<A>;
/**
 * Weights that cannot be allocated against.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class InvalidWeights extends InvalidWeights_base<{
    readonly reason: string;
}> {
}
/**
 * One allocation share.
 *
 * @since 0.1.0
 * @category models
 */
export interface Weighted<K extends string> {
    readonly key: K;
    readonly weight: bigint;
}
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
export declare const allocateUnits: <K extends string>(total: bigint, weights: ReadonlyArray<Weighted<K>>) => Effect.Effect<ReadonlyMap<K, bigint>, InvalidWeights>;
/**
 * Split a money total across weights in its own minor units.
 *
 * @since 0.1.0
 * @category math
 */
export declare const allocateMoney: <K extends string>(total: Money, weights: ReadonlyArray<Weighted<K>>) => Effect.Effect<ReadonlyMap<K, Money>, InvalidWeights>;
export {};
//# sourceMappingURL=Allocation.d.ts.map