/**
 * Billing modes: how one transfer leg is priced.
 *
 * Price is always separate from cost. Cost-based modes cite the
 * `CostBaseDefinition` (owned by `@snyder-tech/keiretsu/finance`) by id and
 * digest, so costing, cost-plus charges and true-ups share one base.
 *
 * - `cost-reimbursement`: cost at cost, no markup.
 * - `cost-plus`: cost × (1 + markup).
 * - `time-and-materials`: minutes × role rate from a rate card, optionally capped (cap in the mode currency).
 * - `fixed-fee`: an agreed amount; `recognitionHint` informs the revenue package, it never posts revenue.
 * - `retainer`: a period amount with included minutes and an overage rate card.
 * - `unit-price`: accepted units of a versioned offering × unit price.
 * - `value-based`: baseline effort per unit × rate; the efficiency dividend is split by the leg.
 * - `revenue-share`: a share of revenue earned on a referenced work object.
 * - `pass-through-disbursement`: expenses and usage re-billed at cost, as an amount (no time, no markup).
 * - `no-charge`: recorded for cost and attribution only.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Port: a `CostBaseDefinition` pinned by id and digest (finance package).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBaseRef: Schema.Struct<{
    readonly definitionId: Schema.brand<Schema.String, "keiretsu/RuleId">;
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
/** @since 0.1.0 @category models */
export type CostBaseRef = typeof CostBaseRef.Type;
/**
 * A billing mode.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BillingMode: Schema.TaggedUnion<{
    readonly "cost-reimbursement": Schema.TaggedStruct<"cost-reimbursement", {
        readonly costBase: Schema.Struct<{
            readonly definitionId: Schema.brand<Schema.String, "keiretsu/RuleId">;
            readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
    }>;
    readonly "cost-plus": Schema.TaggedStruct<"cost-plus", {
        readonly costBase: Schema.Struct<{
            readonly definitionId: Schema.brand<Schema.String, "keiretsu/RuleId">;
            readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
        readonly markupBps: Schema.Number;
    }>;
    readonly "time-and-materials": Schema.TaggedStruct<"time-and-materials", {
        readonly rateCardId: Schema.brand<Schema.String, "keiretsu/RateCardId">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly cap: Schema.optional<Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>>;
    }>;
    readonly "fixed-fee": Schema.TaggedStruct<"fixed-fee", {
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly recognitionHint: Schema.Union<readonly [Schema.Literals<readonly ["over-time", "at-milestone", "point-in-time"]>, Schema.String]>;
    }>;
    readonly retainer: Schema.TaggedStruct<"retainer", {
        readonly periodAmount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly includedMinutes: Schema.Number;
        readonly overageRateCardId: Schema.optional<Schema.brand<Schema.String, "keiretsu/RateCardId">>;
    }>;
    readonly "unit-price": Schema.TaggedStruct<"unit-price", {
        readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
        readonly offeringVersion: Schema.NonEmptyString;
        readonly valueUnit: Schema.String;
        readonly unitPrice: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly "value-based": Schema.TaggedStruct<"value-based", {
        readonly offeringId: Schema.optional<Schema.brand<Schema.String, "keiretsu/OfferingId">>;
        readonly valueUnit: Schema.String;
        /** Baseline human effort for one value unit (catalog capability baseline or agreed estimate). */
        readonly baselineMinutesPerUnit: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly baselineStatus: Schema.Literals<readonly ["estimated", "calibrated"]>;
        /** Rate per hour applied to billed baseline minutes, in `currency`. */
        readonly hourlyRate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly "revenue-share": Schema.TaggedStruct<"revenue-share", {
        readonly shareBps: Schema.Number;
        readonly revenueSource: Schema.Struct<{
            readonly system: Schema.String;
            readonly owner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
            readonly recordId: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>;
    }>;
    readonly "pass-through-disbursement": Schema.TaggedStruct<"pass-through-disbursement", {
        readonly components: Schema.NonEmptyArray<Schema.Union<readonly [Schema.Literals<readonly ["expense", "ai", "tooling"]>, Schema.String]>>;
    }>;
    readonly "no-charge": Schema.TaggedStruct<"no-charge", {
        readonly reason: Schema.Union<readonly [Schema.Literals<readonly ["same-entity", "internal-investment", "warranty", "goodwill", "pre-sales"]>, Schema.String]>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type BillingMode = typeof BillingMode.Type;
/** @since 0.1.0 @category models */
export type BillingModeTag = BillingMode['_tag'];
/**
 * All mode tags.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const BILLING_MODE_TAGS: readonly ["cost-reimbursement", "cost-plus", "time-and-materials", "fixed-fee", "retainer", "unit-price", "value-based", "revenue-share", "pass-through-disbursement", "no-charge"];
/**
 * A billing-mode tag on the wire.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BillingModeTagSchema: Schema.Literals<readonly ["cost-reimbursement", "cost-plus", "time-and-materials", "fixed-fee", "retainer", "unit-price", "value-based", "revenue-share", "pass-through-disbursement", "no-charge"]>;
/**
 * Modes whose charge rests on an accepted outcome (cite acceptance events).
 *
 * @since 0.1.0
 * @category constants
 */
export declare const OUTCOME_MODES: ReadonlySet<BillingModeTag>;
/**
 * Modes priced from a cost-base measurement (cite the cost-base digest).
 *
 * @since 0.1.0
 * @category constants
 */
export declare const COST_BASE_MODES: ReadonlySet<BillingModeTag>;
/**
 * Mode-level invariants (run by the leg check, since tagged unions keep their matchers unrefined).
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const billingModeRules: {
    readonly capCurrency: import("./Invariant.ts").Rule<{
        readonly _tag: "cost-reimbursement";
        readonly costBase: {
            readonly definitionId: string & import("effect/Brand").Brand<"keiretsu/RuleId">;
            readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        };
    } | {
        readonly _tag: "cost-plus";
        readonly costBase: {
            readonly definitionId: string & import("effect/Brand").Brand<"keiretsu/RuleId">;
            readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        };
        readonly markupBps: number;
    } | {
        readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        readonly _tag: "time-and-materials";
        readonly rateCardId: string & import("effect/Brand").Brand<"keiretsu/RateCardId">;
        readonly cap?: {
            readonly minor: string & import("effect/Brand").Brand<"keiretsu/MinorUnits">;
            readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        } | undefined;
    } | {
        readonly _tag: "fixed-fee";
        readonly amount: {
            readonly minor: string & import("effect/Brand").Brand<"keiretsu/MinorUnits">;
            readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        };
        readonly recognitionHint: string;
    } | {
        readonly _tag: "retainer";
        readonly periodAmount: {
            readonly minor: string & import("effect/Brand").Brand<"keiretsu/MinorUnits">;
            readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        };
        readonly includedMinutes: number;
        readonly overageRateCardId?: (string & import("effect/Brand").Brand<"keiretsu/RateCardId">) | undefined;
    } | {
        readonly _tag: "unit-price";
        readonly offeringId: string & import("effect/Brand").Brand<"keiretsu/OfferingId">;
        readonly offeringVersion: string;
        readonly valueUnit: string;
        readonly unitPrice: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
    } | {
        readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        readonly _tag: "value-based";
        readonly baselineStatus: "estimated" | "calibrated";
        readonly valueUnit: string;
        readonly baselineMinutesPerUnit: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly hourlyRate: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly offeringId?: (string & import("effect/Brand").Brand<"keiretsu/OfferingId">) | undefined;
    } | {
        readonly _tag: "revenue-share";
        readonly shareBps: number;
        readonly revenueSource: {
            readonly kind: string;
            readonly system: string;
            readonly owner: {
                readonly _tag: "entity";
                readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
            } | {
                readonly _tag: "counterparty";
                readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
            };
            readonly recordId: string;
            readonly label?: string | undefined;
        };
    } | {
        readonly _tag: "pass-through-disbursement";
        readonly components: readonly [string, ...string[]];
    } | {
        readonly _tag: "no-charge";
        readonly reason: string;
    }>;
    readonly nonNegative: import("./Invariant.ts").Rule<{
        readonly _tag: "cost-reimbursement";
        readonly costBase: {
            readonly definitionId: string & import("effect/Brand").Brand<"keiretsu/RuleId">;
            readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        };
    } | {
        readonly _tag: "cost-plus";
        readonly costBase: {
            readonly definitionId: string & import("effect/Brand").Brand<"keiretsu/RuleId">;
            readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        };
        readonly markupBps: number;
    } | {
        readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        readonly _tag: "time-and-materials";
        readonly rateCardId: string & import("effect/Brand").Brand<"keiretsu/RateCardId">;
        readonly cap?: {
            readonly minor: string & import("effect/Brand").Brand<"keiretsu/MinorUnits">;
            readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        } | undefined;
    } | {
        readonly _tag: "fixed-fee";
        readonly amount: {
            readonly minor: string & import("effect/Brand").Brand<"keiretsu/MinorUnits">;
            readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        };
        readonly recognitionHint: string;
    } | {
        readonly _tag: "retainer";
        readonly periodAmount: {
            readonly minor: string & import("effect/Brand").Brand<"keiretsu/MinorUnits">;
            readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        };
        readonly includedMinutes: number;
        readonly overageRateCardId?: (string & import("effect/Brand").Brand<"keiretsu/RateCardId">) | undefined;
    } | {
        readonly _tag: "unit-price";
        readonly offeringId: string & import("effect/Brand").Brand<"keiretsu/OfferingId">;
        readonly offeringVersion: string;
        readonly valueUnit: string;
        readonly unitPrice: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
    } | {
        readonly currency: string & import("effect/Brand").Brand<"keiretsu/CurrencyCode">;
        readonly _tag: "value-based";
        readonly baselineStatus: "estimated" | "calibrated";
        readonly valueUnit: string;
        readonly baselineMinutesPerUnit: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly hourlyRate: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly offeringId?: (string & import("effect/Brand").Brand<"keiretsu/OfferingId">) | undefined;
    } | {
        readonly _tag: "revenue-share";
        readonly shareBps: number;
        readonly revenueSource: {
            readonly kind: string;
            readonly system: string;
            readonly owner: {
                readonly _tag: "entity";
                readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
            } | {
                readonly _tag: "counterparty";
                readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
            };
            readonly recordId: string;
            readonly label?: string | undefined;
        };
    } | {
        readonly _tag: "pass-through-disbursement";
        readonly components: readonly [string, ...string[]];
    } | {
        readonly _tag: "no-charge";
        readonly reason: string;
    }>;
};
//# sourceMappingURL=BillingMode.d.ts.map