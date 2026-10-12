/**
 * Resale margin rules for third-party products (in basis points, never floats).
 *
 * Whether the seller is principal or agent is an accounting judgment made by a
 * person; `undetermined` blocks activation, and an active rule cites the
 * human decision. Agent status means net revenue presentation in the finance
 * package. Pricing returns a price or a hold (missing upstream cost evidence,
 * negative margin) — never a guess. Decision support; professional review required.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { type CurrencyTableShape } from '../core/Currency.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
/**
 * How the resale price derives from upstream cost or list.
 *
 * - `markup-over-cost`: cost × (1 + markup)
 * - `discount-off-list`: list × (1 − discount)
 * - `margin-share`: cost + (list − cost) × (1 − sellerKeeps)
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const MarginMethod: Schema.TaggedUnion<{
    readonly "markup-over-cost": Schema.TaggedStruct<"markup-over-cost", {
        readonly markupBps: Schema.Number;
    }>;
    readonly "discount-off-list": Schema.TaggedStruct<"discount-off-list", {
        readonly discountBps: Schema.Number;
    }>;
    readonly "margin-share": Schema.TaggedStruct<"margin-share", {
        readonly sellerKeepsBps: Schema.Number;
    }>;
}>;
/** @since 0.1.0 @category models */
export type MarginMethod = typeof MarginMethod.Type;
interface RuleShape {
    readonly status: string;
    readonly revenueRole: string;
    readonly roleDecisionId?: string | undefined;
}
/**
 * Activation invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const resaleRules: {
    readonly roleDetermined: import("./Invariant.ts").Rule<RuleShape>;
    readonly roleDecided: import("./Invariant.ts").Rule<RuleShape>;
};
/**
 * A resale margin rule.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ResaleMarginRule: Schema.Struct<{
    readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    readonly method: Schema.TaggedUnion<{
        readonly "markup-over-cost": Schema.TaggedStruct<"markup-over-cost", {
            readonly markupBps: Schema.Number;
        }>;
        readonly "discount-off-list": Schema.TaggedStruct<"discount-off-list", {
            readonly discountBps: Schema.Number;
        }>;
        readonly "margin-share": Schema.TaggedStruct<"margin-share", {
            readonly sellerKeepsBps: Schema.Number;
        }>;
    }>;
    readonly revenueRole: Schema.Literals<readonly ["principal", "agent", "undetermined"]>;
    readonly roleDecisionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DecisionId">>;
    readonly status: Schema.Literals<readonly ["draft", "active", "retired"]>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
}>;
/** @since 0.1.0 @category models */
export type ResaleMarginRule = typeof ResaleMarginRule.Type;
/**
 * A resale price or a hold.
 *
 * @since 0.1.0
 * @category models
 */
export type ResaleResolution = {
    readonly _tag: 'priced';
    readonly price: Money.Money;
} | {
    readonly _tag: 'hold';
    readonly reasonCode: string;
    readonly message: string;
};
/**
 * Price one unit under an active rule. Holds: `resale.not-active`,
 * `resale.cost-missing`, `resale.list-missing`, `resale.currency-mismatch`,
 * `resale.negative-margin`, `resale.unknown-currency`.
 *
 * @since 0.1.0
 * @category computation
 */
export declare const resalePrice: (margin: ResaleMarginRule, inputs: {
    readonly cost?: Money.Money;
    readonly list?: Money.Money;
    readonly rounding: RoundingMode;
    readonly table?: CurrencyTableShape;
}) => ResaleResolution;
export {};
//# sourceMappingURL=ResaleMarginRule.d.ts.map