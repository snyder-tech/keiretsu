/**
 * ISO 3166 country and subdivision codes (shape; membership comes from data packs).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const CountryCode: Schema.brand<Schema.String, "keiretsu/CountryCode">;
/** @since 0.1.0 @category models */
export type CountryCode = typeof CountryCode.Type;
/**
 * ISO 3166-2 subdivision such as `US-PA` or `IN-KA`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SubdivisionCode: Schema.brand<Schema.String, "keiretsu/SubdivisionCode">;
/** @since 0.1.0 @category models */
export type SubdivisionCode = typeof SubdivisionCode.Type;
/**
 * A place: country plus optional subdivision (which must lie in that country).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Situs: Schema.Struct<{
    readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
}>;
/** @since 0.1.0 @category models */
export type Situs = typeof Situs.Type;
//# sourceMappingURL=Country.d.ts.map