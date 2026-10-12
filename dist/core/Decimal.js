/**
 * Exact decimal values for rates, quantities and FX.
 *
 * Wire form is a **canonical** decimal string: no leading zeros, no trailing
 * fractional zeros, no `-0`, at most {@link MAX_FRACTION_DIGITS} fraction
 * digits. Canonical form makes `encode(decode(x)) ≡ x`, so digests computed over
 * received bytes stay stable. Arithmetic is bigint fixed point at
 * {@link SCALE_DIGITS}; division and multiplication round at that scale with
 * `half-even`, and money rounding happens only when reducing to minor units.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { divide } from "./Rounding.js";
/**
 * Maximum fraction digits on the wire.
 *
 * @since 0.1.0
 * @category constants
 */
export const MAX_FRACTION_DIGITS = 12;
/**
 * Internal fixed-point scale (spec-versioned: changing it changes results).
 *
 * @since 0.1.0
 * @category constants
 */
export const SCALE_DIGITS = 12;
const SCALE = 10n ** BigInt(SCALE_DIGITS);
/** @since 0.1.0 @category patterns */
export const CANONICAL_DECIMAL_PATTERN = /^(?:0|-?[1-9]\d*|-?(?:0|[1-9]\d*)\.\d{0,11}[1-9])$/;
/**
 * Canonical decimal string.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Decimal = Schema.String.check(Schema.isPattern(CANONICAL_DECIMAL_PATTERN)).pipe(Schema.brand('keiretsu/Decimal'));
const asScaled = (value) => 
// SAFETY: every Scaled value is constructed here, so the scale invariant holds.
value;
/**
 * Parse a canonical decimal. Throws on non-canonical text; decode with {@link Decimal} first at boundaries.
 *
 * @since 0.1.0
 * @category conversions
 */
export const toScaled = (value) => {
    if (!CANONICAL_DECIMAL_PATTERN.test(value))
        throw new RangeError(`not a canonical decimal: ${JSON.stringify(value)}`);
    const negative = value.startsWith('-');
    const [whole = '0', fraction = ''] = (negative ? value.slice(1) : value).split('.');
    const magnitude = BigInt(whole) * SCALE + BigInt(fraction.padEnd(SCALE_DIGITS, '0'));
    return asScaled(negative ? -magnitude : magnitude);
};
/**
 * Render a fixed-point value canonically.
 *
 * @since 0.1.0
 * @category conversions
 */
export const fromScaled = (value) => {
    const raw = value;
    const negative = raw < 0n;
    const magnitude = negative ? -raw : raw;
    const fraction = (magnitude % SCALE).toString().padStart(SCALE_DIGITS, '0').replace(/0+$/, '');
    const text = `${magnitude / SCALE}${fraction === '' ? '' : `.${fraction}`}`;
    // SAFETY: the rendering above is canonical by construction (no leading/trailing zeros, no -0).
    return (negative && text !== '0' ? `-${text}` : text);
};
/** @since 0.1.0 @category math */
export const fromInteger = (value) => asScaled(BigInt(value) * SCALE);
/** @since 0.1.0 @category math */
export const add = (left, right) => asScaled(left + right);
/** @since 0.1.0 @category math */
export const subtract = (left, right) => asScaled(left - right);
/** @since 0.1.0 @category math */
export const multiply = (left, right) => asScaled(divide(left * right, SCALE, 'half-even'));
/**
 * Divide at the fixed scale. Throws on a zero divisor.
 *
 * @since 0.1.0
 * @category math
 */
export const divideBy = (numerator, denominator) => {
    if (denominator === 0n)
        throw new RangeError('division by zero');
    const sign = denominator < 0n ? -1n : 1n;
    return asScaled(divide(numerator * SCALE * sign, denominator * sign, 'half-even'));
};
/**
 * Round a fixed-point value to `digits` fraction digits.
 *
 * @since 0.1.0
 * @category math
 */
export const round = (value, digits, mode) => {
    const step = 10n ** BigInt(SCALE_DIGITS - digits);
    return asScaled(divide(value, step, mode) * step);
};
/**
 * Express a fixed-point value as an integer count of `10^-digits` units.
 *
 * @since 0.1.0
 * @category conversions
 */
export const toUnits = (value, digits, mode) => divide(value, 10n ** BigInt(SCALE_DIGITS - digits), mode);
/**
 * The fixed-point value of an integer count of `10^-digits` units.
 *
 * @since 0.1.0
 * @category conversions
 */
export const fromUnits = (units, digits) => asScaled(units * 10n ** BigInt(SCALE_DIGITS - digits));
//# sourceMappingURL=Decimal.js.map