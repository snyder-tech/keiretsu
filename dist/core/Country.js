/**
 * ISO 3166 country and subdivision codes (shape; membership comes from data packs).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export const CountryCode = Schema.String.check(Schema.isPattern(/^[A-Z]{2}$/)).pipe(Schema.brand('keiretsu/CountryCode'));
/**
 * ISO 3166-2 subdivision such as `US-PA` or `IN-KA`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SubdivisionCode = Schema.String.check(Schema.isPattern(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)).pipe(Schema.brand('keiretsu/SubdivisionCode'));
/**
 * A place: country plus optional subdivision (which must lie in that country).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Situs = Schema.Struct({ country: CountryCode, subdivision: Schema.optional(SubdivisionCode) }).check(Schema.makeFilter((situs) => (situs.subdivision === undefined || situs.subdivision.startsWith(`${situs.country}-`) ? undefined : 'subdivision must lie within country')));
//# sourceMappingURL=Country.js.map