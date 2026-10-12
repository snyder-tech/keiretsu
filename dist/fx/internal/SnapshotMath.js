/**
 * Exact rates from snapshot legs. Internal.
 *
 * @since 0.1.0
 * @module
 */
import { fromScaled, fromUnits, SCALE_DIGITS } from "../../core/Decimal.js";
import { divide } from "../../core/Rounding.js";
import { dividedByInteger, fromDecimal, inverse, ONE, times } from "./ExactRate.js";
/** Exact `to` per 1 `from` for one leg. @since 0.1.0 @category math */
export const legRatio = (leg) => {
    const perUnit = dividedByInteger(fromDecimal(leg.rate), BigInt(leg.unit));
    return leg.orientation === 'multiply' ? perUnit : inverse(perUnit);
};
/** Exact product of legs, no intermediate rounding. @since 0.1.0 @category math */
export const chainRatio = (legs) => legs.reduce((product, leg) => times(product, legRatio(leg)), ONE);
/** Display decimal of a ratio, rounded half-even at the core scale. @since 0.1.0 @category conversions */
export const displayRate = (ratio) => {
    const units = divide(ratio.numerator * 10n ** BigInt(SCALE_DIGITS), ratio.denominator, 'half-even');
    return fromScaled(fromUnits(units, SCALE_DIGITS));
};
//# sourceMappingURL=SnapshotMath.js.map