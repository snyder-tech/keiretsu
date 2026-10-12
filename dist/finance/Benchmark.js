/**
 * Benchmarking studies and arm's-length ranges.
 *
 * A benchmark records comparables (accepted and rejected, with reasons), the
 * PLI and the range rule. Ranges use the "lowest result such that at least p%
 * of results are at or below it; if exactly p%, the average of that result
 * and the next" percentile convention — the convention of Treas. Reg.
 * §1.482-1(e)(2)(iii)(C) for the interquartile range and of Indian Income-tax
 * Rules, Rule 10CA for the 35th–65th percentile range (which also needs at
 * least six comparables). Rule citations are `needs-verification` data.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';
import { Actor } from "../core/Actor.js";
import { CountryCode } from "../core/Country.js";
import * as Decimal from "../core/Decimal.js";
import { AssertionFields, validInterval, verifiedHasEvidence } from "../core/Envelope.js";
import { IsoDate } from "../core/Temporal.js";
import { BenchmarkId, Pli } from "./TpMethod.js";
/**
 * Range rule.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RangeRule = Schema.Literals(['interquartile', 'percentile-35-65', 'full']);
/**
 * One comparable's result.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Comparable = Schema.Struct({
    name: Schema.NonEmptyString,
    country: Schema.optional(CountryCode),
    years: Schema.NonEmptyArray(Schema.Number.check(Schema.isInt())),
    result: Decimal.Decimal,
    accepted: Schema.Boolean,
    rejectionReason: Schema.optional(Schema.NonEmptyString),
}).check(Schema.makeFilter((comparable) => (comparable.accepted || comparable.rejectionReason !== undefined ? undefined : 'benchmark.rejection-reason: rejected comparables state why')));
/**
 * A benchmarking study.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Benchmark = Schema.Struct({
    id: BenchmarkId,
    pli: Pli,
    comparables: Schema.NonEmptyArray(Comparable),
    rangeRule: RangeRule,
    searchStrategy: Schema.NonEmptyString,
    dataVintage: Schema.NonEmptyString,
    preparedBy: Actor,
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    ...AssertionFields,
}).check(validInterval, verifiedHasEvidence);
/**
 * A range cannot be computed (no accepted comparables, or too few for the rule).
 *
 * @since 0.1.0
 * @category errors
 */
export class RangeUnavailable extends Data.TaggedError('RangeUnavailable') {
}
const percentile = (sorted, numerator) => {
    const n = sorted.length;
    const position = n * numerator;
    const at = (index) => {
        const value = sorted[Math.min(Math.max(index, 0), n - 1)];
        // SAFETY: callers pass a non-empty array and the index is clamped into range.
        return value;
    };
    if (position % 100 === 0) {
        const k = position / 100;
        return k >= n ? at(n - 1) : Decimal.divideBy(Decimal.add(at(k - 1), at(k)), Decimal.fromInteger(2));
    }
    return at(Math.ceil(position / 100) - 1);
};
const BOUNDS = { interquartile: [25, 75], 'percentile-35-65': [35, 65], full: [0, 100] };
/**
 * Range over accepted results.
 *
 * Codes: `benchmark.no-accepted-comparables`, `benchmark.too-few-comparables`.
 *
 * @since 0.1.0
 * @category math
 */
export const quantileRange = (values, rule) => {
    if (values.length === 0)
        return Effect.fail(new RangeUnavailable({ code: 'benchmark.no-accepted-comparables', reason: 'no accepted comparables' }));
    if (rule === 'percentile-35-65' && values.length < 6) {
        return Effect.fail(new RangeUnavailable({ code: 'benchmark.too-few-comparables', reason: `${values.length} comparables; the 35–65 percentile range needs at least 6` }));
    }
    const sorted = values.map((value) => Decimal.toScaled(value)).sort((left, right) => (left === right ? 0 : left < right ? -1 : 1));
    const [lowP, highP] = BOUNDS[rule];
    // SAFETY: sorted is non-empty (checked above).
    const first = sorted[0];
    // SAFETY: sorted is non-empty (checked above).
    const last = sorted[sorted.length - 1];
    return Effect.succeed({
        low: Decimal.fromScaled(lowP === 0 ? first : percentile(sorted, lowP)),
        median: Decimal.fromScaled(percentile(sorted, 50)),
        high: Decimal.fromScaled(highP === 100 ? last : percentile(sorted, highP)),
        rule,
        count: sorted.length,
    });
};
/**
 * Range of a benchmark's accepted comparables under its own rule.
 *
 * @since 0.1.0
 * @category math
 */
export const benchmarkRange = (benchmark) => quantileRange(benchmark.comparables.filter((comparable) => comparable.accepted).map((comparable) => comparable.result), benchmark.rangeRule);
//# sourceMappingURL=Benchmark.js.map