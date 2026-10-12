/**
 * Exact rates from snapshot legs. Internal.
 *
 * @since 0.1.0
 * @module
 */
import { fromScaled, fromUnits, SCALE_DIGITS, type Decimal } from '../../core/Decimal.ts';
import { divide } from '../../core/Rounding.ts';

import { dividedByInteger, fromDecimal, inverse, ONE, times, type Ratio } from './ExactRate.ts';

interface LegLike {
  readonly rate: Decimal;
  readonly unit: number;
  readonly orientation: 'multiply' | 'divide';
}

/** Exact `to` per 1 `from` for one leg. @since 0.1.0 @category math */
export const legRatio = (leg: LegLike): Ratio => {
  const perUnit = dividedByInteger(fromDecimal(leg.rate), BigInt(leg.unit));
  return leg.orientation === 'multiply' ? perUnit : inverse(perUnit);
};

/** Exact product of legs, no intermediate rounding. @since 0.1.0 @category math */
export const chainRatio = (legs: ReadonlyArray<LegLike>): Ratio => legs.reduce((product, leg) => times(product, legRatio(leg)), ONE);

/** Display decimal of a ratio, rounded half-even at the core scale. @since 0.1.0 @category conversions */
export const displayRate = (ratio: Ratio): Decimal => {
  const units = divide(ratio.numerator * 10n ** BigInt(SCALE_DIGITS), ratio.denominator, 'half-even');
  return fromScaled(fromUnits(units, SCALE_DIGITS));
};
