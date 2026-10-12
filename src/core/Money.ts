/**
 * Money: an integer count of a currency's minor units.
 *
 * Totals are money; rates and quantities are {@link Decimal}. Converting a
 * decimal amount to money is the single rounding point and records its mode.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';

import { CurrencyCode, minorUnits, type CurrencyTableShape, type UnknownCurrency } from './Currency.ts';
import { fromUnits, toUnits, type Decimal, type Scaled, toScaled, fromScaled } from './Decimal.ts';
import type { RoundingMode } from './Rounding.ts';

/** @since 0.1.0 @category patterns */
export const MINOR_UNITS_PATTERN: RegExp = /^(?:0|-?[1-9]\d*)$/;

/**
 * Signed integer minor units as a canonical string (bigint-safe on the wire).
 *
 * @since 0.1.0
 * @category schemas
 */
export const MinorUnits = Schema.String.check(Schema.isPattern(MINOR_UNITS_PATTERN)).pipe(Schema.brand('keiretsu/MinorUnits'));
/** @since 0.1.0 @category models */
export type MinorUnits = typeof MinorUnits.Type;

/**
 * A money total.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Money = Schema.Struct({ minor: MinorUnits, currency: CurrencyCode });
/** @since 0.1.0 @category models */
export type Money = typeof Money.Type;

/**
 * Operands in different currencies.
 *
 * @since 0.1.0
 * @category errors
 */
export class CurrencyMismatch extends Data.TaggedError('CurrencyMismatch')<{ readonly left: string; readonly right: string }> {}

const minor = (value: bigint): MinorUnits =>
  // SAFETY: bigint#toString renders an optional sign and digits with no leading zeros, i.e. MINOR_UNITS_PATTERN.
  value.toString() as MinorUnits;

/** @since 0.1.0 @category constructors */
export const make = (units: bigint, currency: CurrencyCode): Money => ({ minor: minor(units), currency });

/** @since 0.1.0 @category accessors */
export const units = (money: Money): bigint => BigInt(money.minor);

/** @since 0.1.0 @category constructors */
export const zero = (currency: CurrencyCode): Money => make(0n, currency);

const sameCurrency = (left: Money, right: Money): Effect.Effect<CurrencyCode, CurrencyMismatch> =>
  left.currency === right.currency ? Effect.succeed(left.currency) : Effect.fail(new CurrencyMismatch({ left: left.currency, right: right.currency }));

/** @since 0.1.0 @category math */
export const add = (left: Money, right: Money): Effect.Effect<Money, CurrencyMismatch> =>
  Effect.map(sameCurrency(left, right), (currency) => make(units(left) + units(right), currency));

/** @since 0.1.0 @category math */
export const subtract = (left: Money, right: Money): Effect.Effect<Money, CurrencyMismatch> =>
  Effect.map(sameCurrency(left, right), (currency) => make(units(left) - units(right), currency));

/** @since 0.1.0 @category math */
export const abs = (money: Money): Money => (units(money) < 0n ? make(-units(money), money.currency) : money);

/** @since 0.1.0 @category predicates */
export const sign = (money: Money): -1 | 0 | 1 => {
  const value = units(money);
  if (value === 0n) return 0;
  return value < 0n ? -1 : 1;
};

/** @since 0.1.0 @category math */
export const negate = (money: Money): Money => make(-units(money), money.currency);

/**
 * Sum amounts of one currency. An empty list sums to zero in `currency`.
 *
 * @since 0.1.0
 * @category math
 */
export const sum = (currency: CurrencyCode, amounts: ReadonlyArray<Money>): Effect.Effect<Money, CurrencyMismatch> =>
  Effect.reduce(amounts, () => zero(currency), (total, amount) => add(total, amount));

/**
 * Round a fixed-point amount to `currency` minor units — the single rounding point.
 *
 * @since 0.1.0
 * @category conversions
 */
export const fromScaledAmount = (options: {
  readonly amount: Scaled;
  readonly currency: CurrencyCode;
  readonly table: CurrencyTableShape;
  readonly rounding: RoundingMode;
}): Effect.Effect<Money, UnknownCurrency> =>
  Effect.map(minorUnits(options.table, options.currency), (digits) => make(toUnits(options.amount, digits, options.rounding), options.currency));

/** @since 0.1.0 @category conversions */
export const fromDecimal = (options: {
  readonly amount: Decimal;
  readonly currency: CurrencyCode;
  readonly table: CurrencyTableShape;
  readonly rounding: RoundingMode;
}): Effect.Effect<Money, UnknownCurrency> => fromScaledAmount({ ...options, amount: toScaled(options.amount) });

/** @since 0.1.0 @category conversions */
export const toScaledAmount = (money: Money, table: CurrencyTableShape): Effect.Effect<Scaled, UnknownCurrency> =>
  Effect.map(minorUnits(table, money.currency), (digits) => fromUnits(units(money), digits));

/** @since 0.1.0 @category conversions */
export const toDecimal = (money: Money, table: CurrencyTableShape): Effect.Effect<Decimal, UnknownCurrency> => Effect.map(toScaledAmount(money, table), fromScaled);
