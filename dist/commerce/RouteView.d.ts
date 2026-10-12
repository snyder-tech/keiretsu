/**
 * Route views: a route as disclosed to one audience.
 *
 * Legs the audience is party to are complete. Every other leg is redacted to
 * who handed work to whom, without agreement, price, currency or work objects,
 * so an end customer can trace origin without seeing an intercompany price.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { PartyRef } from './Party.ts';
import { TransferLeg, type TransferRoute } from './TransferRoute.ts';
/**
 * A leg the audience is not party to.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RedactedLeg: Schema.Struct<{
    readonly seq: Schema.Number;
    readonly provider: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly recipient: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly redacted: Schema.Literal<true>;
}>;
/** @since 0.1.0 @category models */
export type RedactedLeg = typeof RedactedLeg.Type;
/**
 * View invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const routeViewRules: {
    readonly disclosure: import("./Invariant.ts").Rule<{
        readonly audience: PartyRef;
        readonly legs: ReadonlyArray<TransferLeg | RedactedLeg>;
    }>;
};
/**
 * A route as one audience sees it.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RouteView: Schema.Struct<{
    readonly routeId: Schema.brand<Schema.String, "keiretsu/RouteId">;
    readonly routeRevision: Schema.Number;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly label: Schema.NonEmptyString;
    readonly legs: Schema.NonEmptyArray<Schema.Union<readonly [Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/LegId">;
        readonly seq: Schema.Number;
        readonly provider: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly recipient: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
        readonly relatedParty: Schema.Struct<{
            readonly status: Schema.Literals<readonly ["associated", "unrelated", "undetermined"]>;
            readonly determination: Schema.optional<Schema.Struct<{
                readonly id: Schema.String;
                readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
            }>>;
        }>;
        readonly tpDocumentation: Schema.optional<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly billingMode: Schema.TaggedUnion<{
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
                readonly baselineMinutesPerUnit: Schema.brand<Schema.String, "keiretsu/Decimal">;
                readonly baselineStatus: Schema.Literals<readonly ["estimated", "calibrated"]>;
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
        readonly invoiceCurrency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly rateClause: Schema.optional<Schema.Struct<{
            readonly seriesId: Schema.String;
            readonly dateRule: Schema.NonEmptyString;
            readonly purpose: Schema.String;
            readonly clauseDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly providerWorkObject: Schema.Struct<{
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
        readonly recipientWorkObject: Schema.Struct<{
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
        readonly dividendAllocation: Schema.optional<Schema.Struct<{
            readonly capabilityOwner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly providerShareBps: Schema.Number;
            readonly recipientShareBps: Schema.Number;
        }>>;
    }>, Schema.Struct<{
        readonly seq: Schema.Number;
        readonly provider: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly recipient: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly redacted: Schema.Literal<true>;
    }>]>>;
}>;
/** @since 0.1.0 @category models */
export type RouteView = typeof RouteView.Type;
/**
 * Redact a route for an audience.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const viewFor: (route: TransferRoute, audience: PartyRef) => RouteView;
//# sourceMappingURL=RouteView.d.ts.map