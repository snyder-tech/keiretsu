/**
 * Profit level indicators and the arm's-length range test.
 *
 * {@link armsLengthTest} places a tested result against a benchmark range. It
 * reports `within`, `below` or `above` and, when outside, the median as a
 * candidate adjustment point (OECD TPG 3.62; Treas. Reg. §1.482-1(e)(3)). It
 * never concludes that a result is arm's length: the outcome is evidence for
 * professional review.
 *
 * @since 0.1.0
 * @module
 */
import { Effect } from 'effect';
import type { CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import * as Money from '../core/Money.ts';
import { type Benchmark, type Range, type RangeUnavailable } from './Benchmark.ts';
import type { Pli } from './TpMethod.ts';
/**
 * Segment figures of the tested party, all in one currency.
 *
 * @since 0.1.0
 * @category models
 */
export interface SegmentPnl {
    readonly revenue: Money.Money;
    readonly totalCost: Money.Money;
    readonly grossProfit?: Money.Money;
    readonly operatingExpenses?: Money.Money;
}
declare const PliUnavailable_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "PliUnavailable";
} & Readonly<A>;
/**
 * The PLI cannot be computed from the figures given.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class PliUnavailable extends PliUnavailable_base<{
    readonly pli: Pli;
    readonly reason: string;
}> {
}
/**
 * Compute a PLI as an exact decimal (12 fraction digits, half-even).
 *
 * @since 0.1.0
 * @category math
 */
export declare const plIndicator: (options: {
    readonly pnl: SegmentPnl;
    readonly pli: Pli;
    readonly table: CurrencyTableShape;
}) => Effect.Effect<Decimal.Decimal, PliUnavailable | UnknownCurrency | Money.CurrencyMismatch>;
/**
 * Outcome of a range test.
 *
 * @since 0.1.0
 * @category models
 */
export interface ArmsLengthTestResult {
    readonly benchmarkId: Benchmark['id'];
    readonly pli: Pli;
    readonly tested: Decimal.Decimal;
    readonly range: Range;
    readonly position: 'within' | 'below' | 'above';
    /** The median, when outside the range. A candidate only; adjustment is a professional decision. */
    readonly candidateAdjustmentPoint?: Decimal.Decimal;
}
/**
 * Place a tested PLI against a benchmark's range (inclusive bounds).
 *
 * @since 0.1.0
 * @category tests
 */
export declare const armsLengthTest: (tested: Decimal.Decimal, benchmark: Benchmark) => Effect.Effect<ArmsLengthTestResult, RangeUnavailable>;
export {};
//# sourceMappingURL=ArmsLength.d.ts.map