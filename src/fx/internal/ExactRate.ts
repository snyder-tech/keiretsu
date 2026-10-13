/**
 * Frozen legacy exact FX arithmetic. Published decimals, inverse and cross
 * rates remain exact until conversion. Its unbounded arithmetic profile is
 * retained for historical replay; new computational paths use core/ExactRatio
 * with explicit bounds and typed failures.
 * Internal. @since 0.1.0 @module
 */
import { SCALE_DIGITS, toScaled, type Decimal } from '../../core/Decimal.ts';
import { normalise, type Parts } from '../../core/internal/ExactRatioMath.ts';

/** `numerator / denominator`, denominator positive. @since 0.1.0 @category models */
export type Ratio = Parts;
/** @since 0.1.0 @category constants */
export const ONE: Ratio = { numerator: 1n, denominator: 1n };
/** A canonical decimal as an exact ratio. @since 0.1.0 @category constructors */
export const fromDecimal = (value: Decimal): Ratio => normalise(toScaled(value), 10n ** BigInt(SCALE_DIGITS));
/** @since 0.1.0 @category math */
export const times = (left: Ratio, right: Ratio): Ratio => normalise(left.numerator * right.numerator, left.denominator * right.denominator);
/** @since 0.1.0 @category math */
export const inverse = (value: Ratio): Ratio => normalise(value.denominator, value.numerator);
/** @since 0.1.0 @category math */
export const dividedByInteger = (value: Ratio, divisor: bigint): Ratio => normalise(value.numerator, value.denominator * divisor);
