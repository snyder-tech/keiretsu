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
import { Effect, Schema } from 'effect';
import * as Decimal from '../core/Decimal.ts';
/**
 * Range rule.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RangeRule: Schema.Literals<readonly ["interquartile", "percentile-35-65", "full"]>;
/** @since 0.1.0 @category models */
export type RangeRule = typeof RangeRule.Type;
/**
 * One comparable's result.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Comparable: Schema.Struct<{
    readonly name: Schema.NonEmptyString;
    readonly country: Schema.optional<Schema.brand<Schema.String, "keiretsu/CountryCode">>;
    readonly years: Schema.NonEmptyArray<Schema.Number>;
    readonly result: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly accepted: Schema.Boolean;
    readonly rejectionReason: Schema.optional<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type Comparable = typeof Comparable.Type;
/**
 * A benchmarking study.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Benchmark: Schema.Struct<{
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly id: Schema.brand<Schema.String, "keiretsu/BenchmarkId">;
    readonly pli: Schema.Literals<readonly ["net-cost-plus", "operating-margin", "berry-ratio"]>;
    readonly comparables: Schema.NonEmptyArray<Schema.Struct<{
        readonly name: Schema.NonEmptyString;
        readonly country: Schema.optional<Schema.brand<Schema.String, "keiretsu/CountryCode">>;
        readonly years: Schema.NonEmptyArray<Schema.Number>;
        readonly result: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly accepted: Schema.Boolean;
        readonly rejectionReason: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly rangeRule: Schema.Literals<readonly ["interquartile", "percentile-35-65", "full"]>;
    readonly searchStrategy: Schema.NonEmptyString;
    readonly dataVintage: Schema.NonEmptyString;
    readonly preparedBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type Benchmark = typeof Benchmark.Type;
/**
 * A computed range.
 *
 * @since 0.1.0
 * @category models
 */
export interface Range {
    readonly low: Decimal.Decimal;
    readonly median: Decimal.Decimal;
    readonly high: Decimal.Decimal;
    readonly rule: RangeRule;
    readonly count: number;
}
declare const RangeUnavailable_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "RangeUnavailable";
} & Readonly<A>;
/**
 * A range cannot be computed (no accepted comparables, or too few for the rule).
 *
 * @since 0.1.0
 * @category errors
 */
export declare class RangeUnavailable extends RangeUnavailable_base<{
    readonly code: string;
    readonly reason: string;
}> {
}
/**
 * Range over accepted results.
 *
 * Codes: `benchmark.no-accepted-comparables`, `benchmark.too-few-comparables`.
 *
 * @since 0.1.0
 * @category math
 */
export declare const quantileRange: (values: ReadonlyArray<Decimal.Decimal>, rule: RangeRule) => Effect.Effect<Range, RangeUnavailable>;
/**
 * Range of a benchmark's accepted comparables under its own rule.
 *
 * @since 0.1.0
 * @category math
 */
export declare const benchmarkRange: (benchmark: Benchmark) => Effect.Effect<Range, RangeUnavailable>;
export {};
//# sourceMappingURL=Benchmark.d.ts.map