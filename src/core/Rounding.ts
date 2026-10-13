/**
 * Rounding modes and exact integer division.
 *
 * Rounding happens at declared points only (line totals, tax amounts, FX
 * results). The mode is recorded on every rounded value so a receiver can
 * reproduce it.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

/**
 * - `half-away-from-zero`: 0.5 → 1, −0.5 → −1 (commercial rounding)
 * - `half-even`: 0.5 → 0, 1.5 → 2 (banker's rounding)
 * - `half-toward-positive`: 0.5 → 1, −0.5 → 0
 * - `toward-zero`, `away-from-zero`, `floor`, `ceiling`: directed rounding
 *
 * @since 0.1.0
 * @category schemas
 */
export const RoundingMode = Schema.Literals(['half-away-from-zero', 'half-even', 'half-toward-positive', 'toward-zero', 'away-from-zero', 'floor', 'ceiling']);
/** @since 0.1.0 @category models */
export type RoundingMode = typeof RoundingMode.Type;

interface RoundingDecision {
  readonly mode: RoundingMode;
  readonly negative: boolean;
  readonly quotient: bigint;
  readonly twiceRemainder: bigint;
  readonly divisor: bigint;
}

const halfTowardPositive = (twiceRemainder: bigint, divisor: bigint, negative: boolean): boolean => twiceRemainder > divisor || (twiceRemainder === divisor && !negative);
const halfEven = (twiceRemainder: bigint, divisor: bigint, quotient: bigint): boolean => twiceRemainder > divisor || (twiceRemainder === divisor && quotient % 2n === 1n);

const roundsAway = ({ mode, negative, quotient, twiceRemainder, divisor }: RoundingDecision): boolean => {
  if (twiceRemainder === 0n) return false;
  switch (mode) {
    case 'toward-zero':
      return false;
    case 'away-from-zero':
      return true;
    case 'floor':
      return negative;
    case 'ceiling':
      return !negative;
    case 'half-away-from-zero':
      return twiceRemainder >= divisor;
    case 'half-toward-positive':
      return halfTowardPositive(twiceRemainder, divisor, negative);
    case 'half-even':
      return halfEven(twiceRemainder, divisor, quotient);
  }
};

/**
 * Divide integers, rounding the quotient with `mode`. Throws unless `divisor` is positive.
 *
 * @example
 * ```ts
 * import { divide } from './Rounding.ts'
 * divide(25n, 10n, 'half-even') // 2n
 * divide(-25n, 10n, 'half-away-from-zero') // -3n
 * ```
 * @since 0.1.0
 * @category math
 */
export const divide = (dividend: bigint, divisor: bigint, mode: RoundingMode): bigint => {
  if (divisor <= 0n) throw new RangeError('divide requires a positive divisor');
  const negative = dividend < 0n;
  const magnitude = negative ? -dividend : dividend;
  const quotient = magnitude / divisor;
  const away = roundsAway({ mode, negative, quotient, twiceRemainder: (magnitude % divisor) * 2n, divisor });
  const rounded = away ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
};
