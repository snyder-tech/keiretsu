/**
 * Bounded exact rational arithmetic. Fractions are reduced on construction,
 * carry no binary floats, and round only at an explicit conversion boundary.
 * Wire form is canonical integer text; zero is exactly 0/1.
 * @since 0.44.12 @module
 */
import { Effect, Schema } from 'effect';
import { Decimal } from './Decimal.ts';
import { RoundingMode } from './Rounding.ts';
/** Maximum decimal digits in either reduced component. @since 0.44.12 @category constants */
export declare const MAX_COMPONENT_DIGITS = 256;
/**
 * Maximum requested output precision. Scaling a bounded numerator by this
 * power of ten produces at most 512 intermediate digits. Rounded output
 * still obeys MAX_COMPONENT_DIGITS; precision never silently truncates inputs.
 * @since 0.44.12 @category constants
 */
export declare const MAX_OUTPUT_DIGITS = 256;
/** Canonical, reduced wire fraction with positive denominator. @since 0.44.12 @category schemas */
export declare const ExactRatio: Schema.brand<Schema.Struct<{
    readonly numerator: Schema.String;
    readonly denominator: Schema.String;
}>, "keiretsu/ExactRatio">;
/** @since 0.44.12 @category models */
export type ExactRatio = typeof ExactRatio.Type;
declare const ExactRatioError_base: Schema.Class<ExactRatioError, Schema.TaggedStruct<"ExactRatioError", {
    readonly code: Schema.Literals<readonly ["invalid-input", "division-by-zero", "bound-exceeded", "invalid-precision", "invalid-rounding"]>;
    readonly operation: Schema.String;
}>, import("effect/Cause").YieldableError>;
/** Closed expected failures; no operand text is disclosed. @since 0.44.12 @category errors */
export declare class ExactRatioError extends ExactRatioError_base {
}
/** Checked synchronous constructor; throws ExactRatioError. @since 0.44.12 @category constructors */
export declare const fromPartsSync: (numerator: bigint | string, denominator: bigint | string) => ExactRatio;
/** Construct and reduce a fraction, rejecting unsafe numeric inputs. @since 0.44.12 @category constructors */
export declare const fromParts: (numerator: bigint | string, denominator: bigint | string) => Effect.Effect<ExactRatio, ExactRatioError>;
/** Parse a canonical wire fraction without normalising received bytes. @since 0.44.12 @category constructors */
export declare const decode: (input: unknown) => Effect.Effect<ExactRatio, ExactRatioError>;
/** Checked synchronous decimal conversion; throws ExactRatioError. @since 0.44.12 @category constructors */
export declare const fromDecimalSync: (value: Decimal) => ExactRatio;
/** Decimal to exact rational, with no rounding. @since 0.44.12 @category constructors */
export declare const fromDecimal: (value: Decimal) => Effect.Effect<ExactRatio, ExactRatioError>;
/** Exact multiplicative identity. @since 0.44.12 @category constants */
export declare const ONE: ExactRatio;
/** Exact additive identity. @since 0.44.12 @category constants */
export declare const ZERO: ExactRatio;
/** Checked synchronous multiplication; throws ExactRatioError. @since 0.44.12 @category math */
export declare const multiplySync: (left: ExactRatio, right: ExactRatio) => ExactRatio;
/** @since 0.44.12 @category math */
export declare const multiply: (left: ExactRatio, right: ExactRatio) => Effect.Effect<ExactRatio, ExactRatioError>;
/** Checked synchronous inverse; zero fails with ExactRatioError. @since 0.44.12 @category math */
export declare const inverseSync: (value: ExactRatio) => ExactRatio;
/** @since 0.44.12 @category math */
export declare const inverse: (value: ExactRatio) => Effect.Effect<ExactRatio, ExactRatioError>;
/** @since 0.44.12 @category math */
export declare const divide: (left: ExactRatio, right: ExactRatio) => Effect.Effect<ExactRatio, ExactRatioError>;
/** @since 0.44.12 @category math */
export declare const add: (left: ExactRatio, right: ExactRatio) => Effect.Effect<ExactRatio, ExactRatioError>;
/** @since 0.44.12 @category math */
export declare const subtract: (left: ExactRatio, right: ExactRatio) => Effect.Effect<ExactRatio, ExactRatioError>;
/** Options at the single declared rounding boundary. @since 0.44.12 @category models */
export interface ToUnitsOptions {
    readonly digits: number;
    readonly rounding: RoundingMode;
}
/** Checked synchronous rounding to integer units; throws ExactRatioError. @since 0.44.12 @category conversions */
export declare const toUnitsSync: (value: ExactRatio, options: ToUnitsOptions) => bigint;
/** Round once to integer minor units with an explicit mode. @since 0.44.12 @category conversions */
export declare const toUnits: (value: ExactRatio, options: ToUnitsOptions) => Effect.Effect<bigint, ExactRatioError>;
/** Explicitly rounded Decimal projection, never an exact-arithmetic intermediate. @since 0.44.12 @category conversions */
export declare const toDecimal: (value: ExactRatio, options: ToUnitsOptions) => Effect.Effect<Decimal, ExactRatioError>;
export {};
//# sourceMappingURL=ExactRatio.d.ts.map