/**
 * Transfer-pricing methods (OECD TPG 2022, Ch. II; low-value services Ch. VII 7.43–7.65).
 *
 * A method is a declared choice in an agreement schedule. Cost-based methods
 * cite the `CostBaseDefinition` digest they price against. The
 * low-value-services simplified approach fixes the markup at 5% and is
 * flagged when the service falls in an excluded category (OECD 7.47).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { type ValidationIssue } from '../core/Issue.ts';
/** @since 0.1.0 @category schemas */
export declare const BenchmarkId: Schema.brand<Schema.String, "keiretsu/BenchmarkId">;
/** @since 0.1.0 @category models */
export type BenchmarkId = typeof BenchmarkId.Type;
/**
 * Profit level indicators for TNMM.
 *
 * - `net-cost-plus`: operating profit / total cost
 * - `operating-margin`: operating profit / revenue
 * - `berry-ratio`: gross profit / operating expenses
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Pli: Schema.Literals<readonly ["net-cost-plus", "operating-margin", "berry-ratio"]>;
/** @since 0.1.0 @category models */
export type Pli = typeof Pli.Type;
/**
 * Reference to a cost-base definition by id and digest.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBaseRef: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
/** @since 0.1.0 @category models */
export type CostBaseRef = typeof CostBaseRef.Type;
/**
 * The fixed markup of the low-value-services simplified approach.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const LVAS_MARKUP = "0.05";
/**
 * Transfer-pricing method.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TpMethod: Schema.TaggedUnion<{
    readonly "cost-plus": Schema.TaggedStruct<"cost-plus", {
        readonly markup: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly costBase: Schema.Struct<{
            readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
            readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
    }>;
    readonly cup: Schema.TaggedStruct<"cup", {
        readonly comparableRef: Schema.NonEmptyString;
    }>;
    readonly "resale-price": Schema.TaggedStruct<"resale-price", {
        readonly grossMargin: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>;
    readonly tnmm: Schema.TaggedStruct<"tnmm", {
        readonly pli: Schema.Literals<readonly ["net-cost-plus", "operating-margin", "berry-ratio"]>;
        readonly testedParty: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly benchmarkId: Schema.brand<Schema.String, "keiretsu/BenchmarkId">;
        readonly costBase: Schema.optional<Schema.Struct<{
            readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
            readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>>;
    }>;
    readonly "profit-split": Schema.TaggedStruct<"profit-split", {
        readonly approach: Schema.Literals<readonly ["contribution", "residual"]>;
        readonly keys: Schema.NonEmptyArray<Schema.NonEmptyString>;
    }>;
    readonly "low-value-services": Schema.TaggedStruct<"low-value-services", {
        readonly markup: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly costBase: Schema.Struct<{
            readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
            readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
        /** OECD 7.47 exclusions, each answered by a human screen. */
        readonly exclusionScreen: Schema.Struct<{
            readonly coreBusiness: Schema.Boolean;
            readonly research: Schema.Boolean;
            readonly financial: Schema.Boolean;
            readonly extractive: Schema.Boolean;
        }>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type TpMethod = typeof TpMethod.Type;
export declare const methodFlags: (method: TpMethod, options: {
    readonly associated: boolean;
    readonly hasCurrentBenchmark: boolean;
}) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=TpMethod.d.ts.map