/**
 * A cost-base amount that is either known money, unknown (with the reason),
 * or not applicable to the regime/basis. Unknown is never rendered as zero.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Known, unknown or not-applicable amount.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBaseAmount: Schema.TaggedUnion<{
    readonly unknown: Schema.TaggedStruct<"unknown", {
        readonly reason: Schema.NonEmptyString;
    }>;
    readonly amount: Schema.TaggedStruct<"amount", {
        readonly money: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
    }>;
    readonly "not-applicable": Schema.TaggedStruct<"not-applicable", {
        readonly reason: Schema.NonEmptyString;
    }>;
}>;
/** @since 0.1.0 @category models */
export type CostBaseAmount = typeof CostBaseAmount.Type;
//# sourceMappingURL=CostBaseAmount.d.ts.map