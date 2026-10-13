/**
 * Frozen legacy exact FX arithmetic. Published decimals, inverse and cross
 * rates remain exact until conversion. Its unbounded arithmetic profile is
 * retained for historical replay; new computational paths use core/ExactRatio
 * with explicit bounds and typed failures.
 * Internal. @since 0.1.0 @module
 */
import { type Decimal } from '../../core/Decimal.ts';
import { type Parts } from '../../core/internal/ExactRatioMath.ts';
/** `numerator / denominator`, denominator positive. @since 0.1.0 @category models */
export type Ratio = Parts;
/** @since 0.1.0 @category constants */
export declare const ONE: Ratio;
/** A canonical decimal as an exact ratio. @since 0.1.0 @category constructors */
export declare const fromDecimal: (value: Decimal) => Ratio;
/** @since 0.1.0 @category math */
export declare const times: (left: Ratio, right: Ratio) => Ratio;
/** @since 0.1.0 @category math */
export declare const inverse: (value: Ratio) => Ratio;
/** @since 0.1.0 @category math */
export declare const dividedByInteger: (value: Ratio, divisor: bigint) => Ratio;
//# sourceMappingURL=ExactRate.d.ts.map