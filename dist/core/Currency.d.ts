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
/**
 * Three uppercase letters.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CurrencyCode: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
/** @since 0.1.0 @category models */
export type CurrencyCode = typeof CurrencyCode.Type;
declare const UnknownCurrency_base: Schema.Class<UnknownCurrency, Schema.TaggedStruct<"UnknownCurrency", {
    readonly code: Schema.String;
    readonly edition: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A currency code unknown to the active table.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class UnknownCurrency extends UnknownCurrency_base {
}
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
declare const CurrencyTable_base: Context.ServiceClass<CurrencyTable, "@snyder-tech/keiretsu/core/CurrencyTable", CurrencyTableShape>;
/**
 * The active currency table.
 *
 * @since 0.1.0
 * @category services
 */
export declare class CurrencyTable extends CurrencyTable_base {
    /** Bundled ISO 4217 edition. */
    static readonly iso4217: Layer.Layer<CurrencyTable>;
}
/**
 * The bundled table as a plain value, for pure code paths.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const iso4217: CurrencyTableShape;
/**
 * A table with accounting overrides (e.g. an entity that books a currency in whole units).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const withOverrides: (base: CurrencyTableShape, overrides: Readonly<Record<string, number>>) => CurrencyTableShape;
/**
 * Minor-unit exponent of `code`, failing with {@link UnknownCurrency}.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const minorUnits: (table: CurrencyTableShape, code: string) => Effect.Effect<number, UnknownCurrency>;
export {};
//# sourceMappingURL=Currency.d.ts.map