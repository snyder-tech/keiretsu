/**
 * ISO 4217 currency codes and minor-unit exponents.
 *
 * The code schema validates shape only (wire tier); whether a code is known,
 * and its exponent, comes from a {@link CurrencyTable} so adopters can pin an
 * edition or add per-entity accounting overrides.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Schema } from 'effect';
import { EDITION, MINOR_UNITS } from "./Iso4217Data.js";
/**
 * Three uppercase letters.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CurrencyCode = Schema.String.check(Schema.isPattern(/^[A-Z]{3}$/)).pipe(Schema.brand('keiretsu/CurrencyCode'));
/**
 * A currency code unknown to the active table.
 *
 * @since 0.1.0
 * @category errors
 */
export class UnknownCurrency extends Schema.TaggedError()('UnknownCurrency', {
    code: Schema.String,
    edition: Schema.String,
}) {
}
/**
 * The active currency table.
 *
 * @since 0.1.0
 * @category services
 */
export class CurrencyTable extends Context.Service()('@snyder-tech/keiretsu/core/CurrencyTable') {
    /** Bundled ISO 4217 edition. */
    static iso4217 = Layer.succeed(CurrencyTable, { edition: EDITION, minorUnits: (code) => MINOR_UNITS.get(code) });
}
/**
 * The bundled table as a plain value, for pure code paths.
 *
 * @since 0.1.0
 * @category constructors
 */
export const iso4217 = { edition: EDITION, minorUnits: (code) => MINOR_UNITS.get(code) };
/**
 * A table with accounting overrides (e.g. an entity that books a currency in whole units).
 *
 * @since 0.1.0
 * @category constructors
 */
export const withOverrides = (base, overrides) => ({
    edition: `${base.edition}+overrides`,
    minorUnits: (code) => overrides[code] ?? base.minorUnits(code),
});
/**
 * Minor-unit exponent of `code`, failing with {@link UnknownCurrency}.
 *
 * @since 0.1.0
 * @category accessors
 */
export const minorUnits = (table, code) => {
    const digits = table.minorUnits(code);
    return digits === undefined ? Effect.fail(new UnknownCurrency({ code, edition: table.edition })) : Effect.succeed(digits);
};
//# sourceMappingURL=Currency.js.map