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
import { CurrencyCode, minorUnits } from "./Currency.js";
import { fromUnits, toUnits, toScaled, fromScaled } from "./Decimal.js";
/** @since 0.1.0 @category patterns */
export const MINOR_UNITS_PATTERN = /^(?:0|-?[1-9]\d*)$/;
/**
 * Signed integer minor units as a canonical string (bigint-safe on the wire).
 *
 * @since 0.1.0
 * @category schemas
 */
export const MinorUnits = Schema.String.check(Schema.isPattern(MINOR_UNITS_PATTERN)).pipe(Schema.brand('keiretsu/MinorUnits'));
/**
 * A money total.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Money = Schema.Struct({ minor: MinorUnits, currency: CurrencyCode });
/**
 * Operands in different currencies.
 *
 * @since 0.1.0
 * @category errors
 */
export class CurrencyMismatch extends Data.TaggedError('CurrencyMismatch') {
}
const minor = (value) => 
// SAFETY: bigint#toString renders an optional sign and digits with no leading zeros, i.e. MINOR_UNITS_PATTERN.
value.toString();
/** @since 0.1.0 @category constructors */
export const make = (units, currency) => ({ minor: minor(units), currency });
/** @since 0.1.0 @category accessors */
export const units = (money) => BigInt(money.minor);
/** @since 0.1.0 @category constructors */
export const zero = (currency) => make(0n, currency);
const sameCurrency = (left, right) => left.currency === right.currency ? Effect.succeed(left.currency) : Effect.fail(new CurrencyMismatch({ left: left.currency, right: right.currency }));
/** @since 0.1.0 @category math */
export const add = (left, right) => Effect.map(sameCurrency(left, right), (currency) => make(units(left) + units(right), currency));
/** @since 0.1.0 @category math */
export const subtract = (left, right) => Effect.map(sameCurrency(left, right), (currency) => make(units(left) - units(right), currency));
/** @since 0.1.0 @category math */
export const abs = (money) => (units(money) < 0n ? make(-units(money), money.currency) : money);
/** @since 0.1.0 @category predicates */
export const sign = (money) => {
    const value = units(money);
    if (value === 0n)
        return 0;
    return value < 0n ? -1 : 1;
};
/** @since 0.1.0 @category math */
export const negate = (money) => make(-units(money), money.currency);
/**
 * Sum amounts of one currency. An empty list sums to zero in `currency`.
 *
 * @since 0.1.0
 * @category math
 */
export const sum = (currency, amounts) => Effect.reduce(amounts, () => zero(currency), (total, amount) => add(total, amount));
/**
 * Round a fixed-point amount to `currency` minor units — the single rounding point.
 *
 * @since 0.1.0
 * @category conversions
 */
export const fromScaledAmount = (options) => Effect.map(minorUnits(options.table, options.currency), (digits) => make(toUnits(options.amount, digits, options.rounding), options.currency));
/** @since 0.1.0 @category conversions */
export const fromDecimal = (options) => fromScaledAmount({ ...options, amount: toScaled(options.amount) });
/** @since 0.1.0 @category conversions */
export const toScaledAmount = (money, table) => Effect.map(minorUnits(table, money.currency), (digits) => fromUnits(units(money), digits));
/** @since 0.1.0 @category conversions */
export const toDecimal = (money, table) => Effect.map(toScaledAmount(money, table), fromScaled);
//# sourceMappingURL=Money.js.map