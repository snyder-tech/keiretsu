/**
 * Incentive regimes as cited, versioned data.
 *
 * A regime says where it applies (situs), what kind of benefit it is, which
 * labour category axis it reads, who may claim it, which wage kinds form its
 * cost base and which date its effective interval is tested against. Rates are
 * exact decimals. Package-shipped regimes are always `needs-verification`; only
 * an adopter's human reviewer can mark a regime `verified-by-human`.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const RegimeKind: Schema.Literals<readonly ["credit", "deduction", "amortisation", "reduced-rate", "exemption"]>;
/** @since 0.1.0 @category models */
export type RegimeKind = typeof RegimeKind.Type;
/**
 * Which date the effective interval is tested against.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TestDate: Schema.Literals<readonly ["work-date", "claimant-taxable-year-start", "unit-start", "cost-paid"]>;
/** @since 0.1.0 @category models */
export type TestDate = typeof TestDate.Type;
/**
 * Which slice axis the regime reads: the credit axis (`qre`), the
 * deduction/amortisation axis (`sre`), or neither (`export-proceeds`, a
 * regime whose base is receipts rather than labour).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CategoryAxis: Schema.Literals<readonly ["qre", "sre", "export-proceeds"]>;
/** @since 0.1.0 @category models */
export type CategoryAxis = typeof CategoryAxis.Type;
/** @since 0.1.0 @category schemas */
export declare const BenefitCategory: Schema.Literals<readonly ["wages", "supplies", "contract-research", "computer-use", "software-development", "research-experimental", "export-proceeds"]>;
/** @since 0.1.0 @category models */
export type BenefitCategory = typeof BenefitCategory.Type;
/**
 * Basis on which an entity claims. `registered-exporter` serves receipt-based
 * export regimes.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ClaimantBasis: Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder", "registered-exporter"]>;
/** @since 0.1.0 @category models */
export type ClaimantBasis = typeof ClaimantBasis.Type;
/**
 * A legal source: instrument, pinpoint locator and optional URL.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Citation: Schema.Struct<{
    readonly source: Schema.Literals<readonly ["statute", "regulation", "rev-proc", "notice", "public-law", "form-instructions", "official-guidance"]>;
    readonly locator: Schema.NonEmptyString;
    readonly url: Schema.optional<Schema.String>;
}>;
/** @since 0.1.0 @category models */
export type Citation = typeof Citation.Type;
/**
 * A named decimal parameter (rate, percentage, month count).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RegimeParameter: Schema.Struct<{
    readonly key: Schema.String;
    readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly unit: Schema.Literals<readonly ["ratio", "months", "years", "currency-minor"]>;
    readonly citation: Schema.optional<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type RegimeParameter = typeof RegimeParameter.Type;
/**
 * Verification status. Package data is always `needs-verification`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RegimeStatus: Schema.TaggedUnion<{
    readonly "needs-verification": Schema.TaggedStruct<"needs-verification", {}>;
    readonly "verified-by-human": Schema.TaggedStruct<"verified-by-human", {
        readonly by: Schema.TaggedStruct<"human", {
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
        readonly on: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly decisionId: Schema.brand<Schema.String, "keiretsu/DecisionId">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type RegimeStatus = typeof RegimeStatus.Type;
/**
 * Wage kinds the regime's cost base may include. Everything else is excluded with a reason.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBaseRule: Schema.Struct<{
    readonly includedWageKinds: Schema.NonEmptyArray<Schema.Literals<readonly ["us-3401-box1", "statutory", "bonus", "benefits", "employer-tax", "overhead", "contractor-payment", "foreign-local-payroll", "loaded-rate"]>>;
    readonly source: Schema.NonEmptyString;
}>;
/** @since 0.1.0 @category models */
export type CostBaseRule = typeof CostBaseRule.Type;
/**
 * An incentive regime.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IncentiveRegime: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/RegimeId">;
    /** Stable human-readable code, e.g. `us.irc41`. */
    readonly code: Schema.String;
    readonly title: Schema.NonEmptyString;
    /** Country, plus subdivision for a state or provincial regime. */
    readonly jurisdiction: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    /** `within`: work must be performed in the jurisdiction; `outside`: only work performed elsewhere. */
    readonly workSitus: Schema.Literals<readonly ["within", "outside", "not-applicable"]>;
    readonly kind: Schema.Literals<readonly ["credit", "deduction", "amortisation", "reduced-rate", "exemption"]>;
    readonly axis: Schema.Literals<readonly ["qre", "sre", "export-proceeds"]>;
    readonly categories: Schema.NonEmptyArray<Schema.Literals<readonly ["wages", "supplies", "contract-research", "computer-use", "software-development", "research-experimental", "export-proceeds"]>>;
    readonly claimantBases: Schema.NonEmptyArray<Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder", "registered-exporter"]>>;
    /** `controlled-group`: outputs are tested at group level and need an established group. */
    readonly aggregation: Schema.Literals<readonly ["entity", "controlled-group"]>;
    readonly effective: Schema.Struct<{
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    }>;
    readonly testDate: Schema.Literals<readonly ["work-date", "claimant-taxable-year-start", "unit-start", "cost-paid"]>;
    readonly parameters: Schema.$Array<Schema.Struct<{
        readonly key: Schema.String;
        readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly unit: Schema.Literals<readonly ["ratio", "months", "years", "currency-minor"]>;
        readonly citation: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly costBase: Schema.optional<Schema.Struct<{
        readonly includedWageKinds: Schema.NonEmptyArray<Schema.Literals<readonly ["us-3401-box1", "statutory", "bonus", "benefits", "employer-tax", "overhead", "contractor-payment", "foreign-local-payroll", "loaded-rate"]>>;
        readonly source: Schema.NonEmptyString;
    }>>;
    /** Prior taxable years whose base amounts a computation would need (unknown is never zero). */
    readonly basePeriodYears: Schema.Number;
    /** Registration kind the claimant must hold on the test date. */
    readonly requiresRegistration: Schema.optional<Schema.String>;
    readonly citations: Schema.NonEmptyArray<Schema.Struct<{
        readonly source: Schema.Literals<readonly ["statute", "regulation", "rev-proc", "notice", "public-law", "form-instructions", "official-guidance"]>;
        readonly locator: Schema.NonEmptyString;
        readonly url: Schema.optional<Schema.String>;
    }>>;
    readonly notes: Schema.$Array<Schema.NonEmptyString>;
    /** Day the citations were last checked against the sources. */
    readonly reviewedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly status: Schema.TaggedUnion<{
        readonly "needs-verification": Schema.TaggedStruct<"needs-verification", {}>;
        readonly "verified-by-human": Schema.TaggedStruct<"verified-by-human", {
            readonly by: Schema.TaggedStruct<"human", {
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
            readonly on: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly decisionId: Schema.brand<Schema.String, "keiretsu/DecisionId">;
        }>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type IncentiveRegime = typeof IncentiveRegime.Type;
/**
 * Whether the regime is sub-national (requires a subdivision on the work situs).
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isSubnational: (regime: IncentiveRegime) => boolean;
/**
 * Look up a parameter by key.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const parameter: (regime: IncentiveRegime, key: string) => RegimeParameter | undefined;
//# sourceMappingURL=IncentiveRegime.d.ts.map