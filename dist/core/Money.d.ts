/**
 * Money: an integer count of a currency's minor units.
 *
 * Totals are money; rates and quantities are {@link Decimal}. Converting a
 * decimal amount to money is the single rounding point and records its mode.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { CurrencyCode, type CurrencyTableShape, type UnknownCurrency } from './Currency.ts';
import { type Decimal, type Scaled } from './Decimal.ts';
import type { RoundingMode } from './Rounding.ts';
/** @since 0.1.0 @category patterns */
export declare const MINOR_UNITS_PATTERN: RegExp;
/**
 * Signed integer minor units as a canonical string (bigint-safe on the wire).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const MinorUnits: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
/** @since 0.1.0 @category models */
export type MinorUnits = typeof MinorUnits.Type;
/**
 * A money total.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Money: Schema.Struct<{
    readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
}>;
/** @since 0.1.0 @category models */
export type Money = typeof Money.Type;
declare const CurrencyMismatch_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "CurrencyMismatch";
} & Readonly<A>;
/**
 * Operands in different currencies.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class CurrencyMismatch extends CurrencyMismatch_base<{
    readonly left: string;
    readonly right: string;
}> {
}
/** @since 0.1.0 @category constructors */
export declare const make: (units: bigint, currency: CurrencyCode) => Money;
/** @since 0.1.0 @category accessors */
export declare const units: (money: Money) => bigint;
/** @since 0.1.0 @category constructors */
export declare const zero: (currency: CurrencyCode) => Money;
/** @since 0.1.0 @category math */
export declare const add: (left: Money, right: Money) => Effect.Effect<Money, CurrencyMismatch>;
/** @since 0.1.0 @category math */
export declare const subtract: (left: Money, right: Money) => Effect.Effect<Money, CurrencyMismatch>;
/** @since 0.1.0 @category math */
export declare const abs: (money: Money) => Money;
/** @since 0.1.0 @category predicates */
export declare const sign: (money: Money) => -1 | 0 | 1;
/** @since 0.1.0 @category math */
export declare const negate: (money: Money) => Money;
/**
 * Sum amounts of one currency. An empty list sums to zero in `currency`.
 *
 * @since 0.1.0
 * @category math
 */
export declare const sum: (currency: CurrencyCode, amounts: ReadonlyArray<Money>) => Effect.Effect<Money, CurrencyMismatch>;
/**
 * Round a fixed-point amount to `currency` minor units — the single rounding point.
 *
 * @since 0.1.0
 * @category conversions
 */
export declare const fromScaledAmount: (options: {
    readonly amount: Scaled;
    readonly currency: CurrencyCode;
    readonly table: CurrencyTableShape;
    readonly rounding: RoundingMode;
}) => Effect.Effect<Money, UnknownCurrency>;
/** @since 0.1.0 @category conversions */
export declare const fromDecimal: (options: {
    readonly amount: Decimal;
    readonly currency: CurrencyCode;
    readonly table: CurrencyTableShape;
    readonly rounding: RoundingMode;
}) => Effect.Effect<Money, UnknownCurrency>;
/** @since 0.1.0 @category conversions */
export declare const toScaledAmount: (money: Money, table: CurrencyTableShape) => Effect.Effect<Scaled, UnknownCurrency>;
/** @since 0.1.0 @category conversions */
export declare const toDecimal: (money: Money, table: CurrencyTableShape) => Effect.Effect<Decimal, UnknownCurrency>;
export {};
//# sourceMappingURL=Money.d.ts.map