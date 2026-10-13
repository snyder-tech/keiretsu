/**
 * Frozen legacy exact FX arithmetic. Published decimals, inverse and cross
 * rates remain exact until conversion. Its unbounded arithmetic profile is
 * retained for historical replay; new computational paths use core/ExactRatio
 * with explicit bounds and typed failures.
 * Internal. @since 0.1.0 @module
 */
import { SCALE_DIGITS, toScaled } from "../../core/Decimal.js";
import { normalise } from "../../core/internal/ExactRatioMath.js";
/** @since 0.1.0 @category constants */
export const ONE = { numerator: 1n, denominator: 1n };
/** A canonical decimal as an exact ratio. @since 0.1.0 @category constructors */
export const fromDecimal = (value) => normalise(toScaled(value), 10n ** BigInt(SCALE_DIGITS));
/** @since 0.1.0 @category math */
export const times = (left, right) => normalise(left.numerator * right.numerator, left.denominator * right.denominator);
/** @since 0.1.0 @category math */
export const inverse = (value) => normalise(value.denominator, value.numerator);
/** @since 0.1.0 @category math */
export const dividedByInteger = (value, divisor) => normalise(value.numerator, value.denominator * divisor);
//# sourceMappingURL=ExactRate.js.map