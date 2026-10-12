/**
 * Exact rational rates. Published rates are decimals; inverse and cross rates
 * are exact fractions so that a conversion rounds exactly once (Council
 * Regulation (EC) 1103/97 art. 4 precedent: no rounded inverse or cross rates).
 * Internal.
 *
 * @since 0.1.0
 * @module
 */
import { SCALE_DIGITS, toScaled } from "../../core/Decimal.js";
const gcd = (left, right) => {
    let a = left < 0n ? -left : left;
    let b = right < 0n ? -right : right;
    while (b !== 0n)
        [a, b] = [b, a % b];
    return a === 0n ? 1n : a;
};
const normalise = (numerator, denominator) => {
    if (denominator === 0n)
        throw new RangeError('zero denominator');
    const sign = denominator < 0n ? -1n : 1n;
    const divisor = gcd(numerator, denominator);
    return { numerator: (numerator * sign) / divisor, denominator: (denominator * sign) / divisor };
};
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