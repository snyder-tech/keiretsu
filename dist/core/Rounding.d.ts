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
export declare const RoundingMode: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
/** @since 0.1.0 @category models */
export type RoundingMode = typeof RoundingMode.Type;
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
export declare const divide: (dividend: bigint, divisor: bigint, mode: RoundingMode) => bigint;
//# sourceMappingURL=Rounding.d.ts.map