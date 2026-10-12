/**
 * Transfer routes: how work moves from the performing entity to the last
 * recipient, one legal hop (leg) at a time.
 *
 * Each leg names its agreement, the work object on each side, the
 * related-party status of its parties (derived by the finance package and
 * carried here with a determination reference), its billing mode, invoice
 * currency and rounding mode. Routes are acyclic chains: leg n+1 starts where
 * leg n ends and no party appears twice.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { BillingMode } from './BillingMode.ts';
import { DividendAllocation } from './DividendAllocation.ts';
import { PartyRef } from './Party.ts';
import { WorkObjectRef } from './WorkObjectRef.ts';
/**
 * Related-party status of a leg's parties for transfer pricing. `undetermined`
 * records work but holds every charge on the leg from invoicing.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RelatedPartyStatus: Schema.Literals<readonly ["associated", "unrelated", "undetermined"]>;
/** @since 0.1.0 @category models */
export type RelatedPartyStatus = typeof RelatedPartyStatus.Type;
/**
 * The status as carried on a leg, citing the finance package's `RelatedPartyDetermination`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RelatedParty: Schema.Struct<{
    readonly status: Schema.Literals<readonly ["associated", "unrelated", "undetermined"]>;
    readonly determination: Schema.optional<Schema.Struct<{
        readonly id: Schema.String;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type RelatedParty = typeof RelatedParty.Type;
interface LegShape {
    readonly provider: PartyRef;
    readonly recipient: PartyRef;
    readonly relatedParty: RelatedParty;
    readonly billingMode: BillingMode;
    readonly providerWorkObject: WorkObjectRef;
    readonly recipientWorkObject: WorkObjectRef;
    readonly dividendAllocation?: DividendAllocation | undefined;
}
/**
 * Leg invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const legRules: {
    readonly crossesBoundary: import("./Invariant.ts").Rule<LegShape>;
    readonly providerOwnsWorkObject: import("./Invariant.ts").Rule<LegShape>;
    readonly recipientOwnsWorkObject: import("./Invariant.ts").Rule<LegShape>;
    readonly dividendRequired: import("./Invariant.ts").Rule<LegShape>;
    readonly dividendMisplaced: import("./Invariant.ts").Rule<LegShape>;
    readonly determinationCited: import("./Invariant.ts").Rule<LegShape>;
    readonly capCurrency: import("./Invariant.ts").Rule<LegShape>;
    readonly nonNegativeTerms: import("./Invariant.ts").Rule<LegShape>;
};
/**
 * One hop of a route.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TransferLeg: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/LegId">;
    /** 1-based position on the route. */
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
    /** Transfer-pricing documentation (schedule, benchmark, study) supporting an associated leg. */
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
    /** Overrides the agreement's rate clause for this leg. */
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
}>;
/** @since 0.1.0 @category models */
export type TransferLeg = typeof TransferLeg.Type;
interface LegEnds {
    readonly id?: string | undefined;
    readonly seq: number;
    readonly provider: PartyRef;
    readonly recipient: PartyRef;
}
/**
 * Route invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const routeRules: {
    readonly chained: import("./Invariant.ts").Rule<{
        readonly legs: ReadonlyArray<LegEnds>;
    }>;
    readonly uniqueLegIds: import("./Invariant.ts").Rule<{
        readonly legs: ReadonlyArray<LegEnds>;
    }>;
    readonly dividendOwnerOnRoute: import("./Invariant.ts").Rule<{
        readonly legs: ReadonlyArray<TransferLeg>;
    }>;
};
/**
 * Ordered legs from the performing party to the last recipient. Same-entity
 * work has no route.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TransferRoute: Schema.Struct<{
    readonly label: Schema.NonEmptyString;
    readonly legs: Schema.NonEmptyArray<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/LegId">;
        /** 1-based position on the route. */
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
        /** Transfer-pricing documentation (schedule, benchmark, study) supporting an associated leg. */
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
        /** Overrides the agreement's rate clause for this leg. */
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
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/RouteId">;
}>;
/** @since 0.1.0 @category models */
export type TransferRoute = typeof TransferRoute.Type;
/**
 * The party where work on the route is performed (first provider).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const routeOrigin: (route: TransferRoute) => PartyRef;
/**
 * Find a leg by id.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const findLeg: (route: TransferRoute, legId: string) => TransferLeg | undefined;
export {};
//# sourceMappingURL=TransferRoute.d.ts.map