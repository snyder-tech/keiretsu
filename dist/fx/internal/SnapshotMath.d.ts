/**
 * Exact rates from snapshot legs. Internal.
 *
 * @since 0.1.0
 * @module
 */
import { type Decimal } from '../../core/Decimal.ts';
import { type Ratio } from './ExactRate.ts';
interface LegLike {
    readonly rate: Decimal;
    readonly unit: number;
    readonly orientation: 'multiply' | 'divide';
}
/** Exact `to` per 1 `from` for one leg. @since 0.1.0 @category math */
export declare const legRatio: (leg: LegLike) => Ratio;
/** Exact product of legs, no intermediate rounding. @since 0.1.0 @category math */
export declare const chainRatio: (legs: ReadonlyArray<LegLike>) => Ratio;
/** Display decimal of a ratio, rounded half-even at the core scale. @since 0.1.0 @category conversions */
export declare const displayRate: (ratio: Ratio) => Decimal;
export {};
//# sourceMappingURL=SnapshotMath.d.ts.map