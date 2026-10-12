/**
 * Exact rational rates. Published rates are decimals; inverse and cross rates
 * are exact fractions so that a conversion rounds exactly once (Council
 * Regulation (EC) 1103/97 art. 4 precedent: no rounded inverse or cross rates).
 * Internal.
 *
 * @since 0.1.0
 * @module
 */
import { type Decimal } from '../../core/Decimal.ts';
/** `numerator / denominator`, denominator positive. @since 0.1.0 @category models */
export interface Ratio {
    readonly numerator: bigint;
    readonly denominator: bigint;
}
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