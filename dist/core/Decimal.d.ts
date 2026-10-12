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
import { type RoundingMode } from './Rounding.ts';
/**
 * Maximum fraction digits on the wire.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const MAX_FRACTION_DIGITS = 12;
/**
 * Internal fixed-point scale (spec-versioned: changing it changes results).
 *
 * @since 0.1.0
 * @category constants
 */
export declare const SCALE_DIGITS = 12;
/** @since 0.1.0 @category patterns */
export declare const CANONICAL_DECIMAL_PATTERN: RegExp;
/**
 * Canonical decimal string.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Decimal: Schema.brand<Schema.String, "keiretsu/Decimal">;
/** @since 0.1.0 @category models */
export type Decimal = typeof Decimal.Type;
/**
 * A fixed-point value: `units / 10^SCALE_DIGITS`.
 *
 * @since 0.1.0
 * @category models
 */
export type Scaled = bigint & {
    readonly __scaled: unique symbol;
};
/**
 * Parse a canonical decimal. Throws on non-canonical text; decode with {@link Decimal} first at boundaries.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const toScaled: (value: Decimal | string) => Scaled;
/**
 * Render a fixed-point value canonically.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const fromScaled: (value: Scaled) => Decimal;
/** @since 0.1.0 @category math */
export declare const fromInteger: (value: number | bigint) => Scaled;
/** @since 0.1.0 @category math */
export declare const add: (left: Scaled, right: Scaled) => Scaled;
/** @since 0.1.0 @category math */
export declare const subtract: (left: Scaled, right: Scaled) => Scaled;
/** @since 0.1.0 @category math */
export declare const multiply: (left: Scaled, right: Scaled) => Scaled;
/**
 * Divide at the fixed scale. Throws on a zero divisor.
 *
 * @since 0.1.0
 * @category math
 */
export declare const divideBy: (numerator: Scaled, denominator: Scaled) => Scaled;
/**
 * Round a fixed-point value to `digits` fraction digits.
 *
 * @since 0.1.0
 * @category math
 */
export declare const round: (value: Scaled, digits: number, mode: RoundingMode) => Scaled;
/**
 * Express a fixed-point value as an integer count of `10^-digits` units.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const toUnits: (value: Scaled, digits: number, mode: RoundingMode) => bigint;
/**
 * The fixed-point value of an integer count of `10^-digits` units.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const fromUnits: (units: bigint, digits: number) => Scaled;
//# sourceMappingURL=Decimal.d.ts.map