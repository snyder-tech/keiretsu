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

import { EDITION, MINOR_UNITS } from './Iso4217Data.ts';

/**
 * Three uppercase letters.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CurrencyCode = Schema.String.check(Schema.isPattern(/^[A-Z]{3}$/)).pipe(Schema.brand('keiretsu/CurrencyCode'));
/** @since 0.1.0 @category models */
export type CurrencyCode = typeof CurrencyCode.Type;

/**
 * A currency code unknown to the active table.
 *
 * @since 0.1.0
 * @category errors
 */
export class UnknownCurrency extends Schema.TaggedError<UnknownCurrency>()('UnknownCurrency', {
  code: Schema.String,
  edition: Schema.String,
}) {}

/**
 * Minor-unit lookup with its edition.
 *
 * @since 0.1.0
 * @category models
 */
export interface CurrencyTableShape {
  readonly edition: string;
  readonly minorUnits: (code: string) => number | undefined;
}

/**
 * The active currency table.
 *
 * @since 0.1.0
 * @category services
 */
export class CurrencyTable extends Context.Service<CurrencyTable, CurrencyTableShape>()('@snyder-tech/keiretsu/core/CurrencyTable') {
  /** Bundled ISO 4217 edition. */
  static readonly iso4217: Layer.Layer<CurrencyTable> = Layer.succeed(CurrencyTable, { edition: EDITION, minorUnits: (code) => MINOR_UNITS.get(code) });
}

/**
 * The bundled table as a plain value, for pure code paths.
 *
 * @since 0.1.0
 * @category constructors
 */
export const iso4217: CurrencyTableShape = { edition: EDITION, minorUnits: (code) => MINOR_UNITS.get(code) };

/**
 * A table with accounting overrides (e.g. an entity that books a currency in whole units).
 *
 * @since 0.1.0
 * @category constructors
 */
export const withOverrides = (base: CurrencyTableShape, overrides: Readonly<Record<string, number>>): CurrencyTableShape => ({
  edition: `${base.edition}+overrides`,
  minorUnits: (code) => overrides[code] ?? base.minorUnits(code),
});

/**
 * Minor-unit exponent of `code`, failing with {@link UnknownCurrency}.
 *
 * @since 0.1.0
 * @category accessors
 */
export const minorUnits = (table: CurrencyTableShape, code: string): Effect.Effect<number, UnknownCurrency> => {
  const digits = table.minorUnits(code);
  return digits === undefined ? Effect.fail(new UnknownCurrency({ code, edition: table.edition })) : Effect.succeed(digits);
};
