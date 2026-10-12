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
import { Data, Effect } from 'effect';
import * as Decimal from "../core/Decimal.js";
import * as Money from "../core/Money.js";
import { benchmarkRange } from "./Benchmark.js";
/**
 * The PLI cannot be computed from the figures given.
 *
 * @since 0.1.0
 * @category errors
 */
export class PliUnavailable extends Data.TaggedError('PliUnavailable') {
}
/**
 * Compute a PLI as an exact decimal (12 fraction digits, half-even).
 *
 * @since 0.1.0
 * @category math
 */
export const plIndicator = (options) => Effect.gen(function* () {
    const { pnl, pli } = options;
    const operatingProfit = yield* Money.subtract(pnl.revenue, pnl.totalCost);
    const ratio = (numerator, denominator) => Effect.gen(function* () {
        if (numerator.currency !== denominator.currency)
            return yield* Effect.fail(new Money.CurrencyMismatch({ left: numerator.currency, right: denominator.currency }));
        if (Money.units(denominator) === 0n)
            return yield* Effect.fail(new PliUnavailable({ pli, reason: 'denominator is zero' }));
        return Decimal.fromScaled(Decimal.divideBy(yield* Money.toScaledAmount(numerator, options.table), yield* Money.toScaledAmount(denominator, options.table)));
    });
    if (pli === 'net-cost-plus')
        return yield* ratio(operatingProfit, pnl.totalCost);
    if (pli === 'operating-margin')
        return yield* ratio(operatingProfit, pnl.revenue);
    if (pnl.grossProfit === undefined || pnl.operatingExpenses === undefined)
        return yield* Effect.fail(new PliUnavailable({ pli, reason: 'berry ratio needs gross profit and operating expenses' }));
    return yield* ratio(pnl.grossProfit, pnl.operatingExpenses);
});
/**
 * Place a tested PLI against a benchmark's range (inclusive bounds).
 *
 * @since 0.1.0
 * @category tests
 */
export const armsLengthTest = (tested, benchmark) => Effect.map(benchmarkRange(benchmark), (range) => {
    const value = Decimal.toScaled(tested);
    const position = value < Decimal.toScaled(range.low) ? 'below' : value > Decimal.toScaled(range.high) ? 'above' : 'within';
    const base = { benchmarkId: benchmark.id, pli: benchmark.pli, tested, range, position };
    return position === 'within' ? base : { ...base, candidateAdjustmentPoint: range.median };
});
//# sourceMappingURL=ArmsLength.js.map