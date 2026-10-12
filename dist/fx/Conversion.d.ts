/**
 * Convert money through a snapshot: multiply exactly, round once.
 *
 * The amount in minor units is multiplied by the exact product of the
 * snapshot's legs and reduced to the target currency's minor units with the
 * snapshot's rounding mode. No rate, inverse or cross is rounded on the way.
 *
 * Round-trip bound: converting A→B→A differs from the original by at most
 * half a minor unit of A plus half a minor unit of B expressed in A. When B's
 * minor unit is worth no more than A's (USD→INR, USD→PKR), that is at most one
 * minor unit of A.
 *
 * @since 0.1.0
 * @module
 */
import { Effect } from 'effect';
import type { Sha256 } from '../core/CanonicalJson.ts';
import { type CurrencyCode, type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import { CurrencyMismatch, type Money } from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { type Scaled } from '../core/Decimal.ts';
import { SnapshotMismatch } from './FxError.ts';
import type { FxSnapshot } from './FxSnapshot.ts';
/**
 * `forward` converts `base`→`quote`; `reverse` converts `quote`→`base` with the exact inverse.
 *
 * @since 0.1.0
 * @category models
 */
export type Direction = 'forward' | 'reverse';
/** Unrounded major-unit conversion through exact legs. @since 0.1.0 @category conversions */
export declare const convertScaled: (options: {
    readonly amount: Scaled;
    readonly currency: CurrencyCode;
    readonly snapshot: FxSnapshot;
    readonly table: CurrencyTableShape;
    readonly direction: Direction;
    readonly rounding: RoundingMode;
}) => Effect.Effect<Money, CurrencyMismatch | UnknownCurrency>;
/**
 * Conversion options.
 *
 * @since 0.1.0
 * @category models
 */
export interface ConvertOptions {
    readonly amount: Money;
    readonly snapshot: FxSnapshot;
    readonly table: CurrencyTableShape;
    readonly direction?: Direction | undefined;
}
/**
 * Convert `amount` through `snapshot`, rounding once to the target's minor units.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const convert: (options: ConvertOptions) => Effect.Effect<Money, CurrencyMismatch | UnknownCurrency>;
/**
 * The snapshot (and direction) that converts `from` → `to`, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const findSnapshot: (snapshots: ReadonlyArray<FxSnapshot>, pair: {
    readonly from: CurrencyCode;
    readonly to: CurrencyCode;
}) => {
    readonly snapshot: FxSnapshot;
    readonly direction: Direction;
} | undefined;
/**
 * A converted amount and the digest of the snapshot used (absent when no conversion was needed).
 *
 * @since 0.1.0
 * @category models
 */
export interface Converted {
    readonly amount: Money;
    readonly snapshotDigest?: Sha256 | undefined;
}
/**
 * Convert to `to`, or return the amount unchanged when it is already in `to`.
 * `undefined` when no snapshot connects the currencies (the caller holds; it never guesses).
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const convertTo: (options: {
    readonly amount: Money;
    readonly to: CurrencyCode;
    readonly snapshots: ReadonlyArray<FxSnapshot>;
    readonly table: CurrencyTableShape;
}) => Effect.Effect<Converted | undefined, CurrencyMismatch | UnknownCurrency>;
/**
 * Difference a true-up posts: `amount` at the final snapshot minus `amount` at the provisional one.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const trueUpDifference: (options: {
    readonly amount: Money;
    readonly provisional: FxSnapshot;
    readonly final: FxSnapshot;
    readonly table: CurrencyTableShape;
}) => Effect.Effect<Money, CurrencyMismatch | UnknownCurrency | SnapshotMismatch>;
//# sourceMappingURL=Conversion.d.ts.map