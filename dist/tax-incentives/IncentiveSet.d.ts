/**
 * The input set screened together: regimes, entity profiles, components,
 * labour/wage/transfer facts from other packages, slices, funding assessments,
 * controlled groups, attributions and base-period facts.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { BusinessComponent } from './BusinessComponent.ts';
import { ControlledGroupYear } from './ControlledGroupYear.ts';
import { EntityTaxProfile } from './EntityTaxProfile.ts';
import { FundingAssessment } from './FundingAssessment.ts';
import { IncentiveRegime } from './IncentiveRegime.ts';
import { LabourFact } from './LabourFact.ts';
import { TaxActivitySlice } from './TaxActivitySlice.ts';
import { TransferFact } from './TransferFact.ts';
/**
 * An incentive screening set.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IncentiveSet: Schema.Struct<{
    /** The date the screen is run for (citation staleness is measured to it). */
    readonly asOf: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly regimes: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/RegimeId">;
        readonly code: Schema.String;
        readonly title: Schema.NonEmptyString;
        readonly jurisdiction: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly workSitus: Schema.Literals<readonly ["within", "outside", "not-applicable"]>;
        readonly kind: Schema.Literals<readonly ["credit", "deduction", "amortisation", "reduced-rate", "exemption"]>;
        readonly axis: Schema.Literals<readonly ["qre", "sre", "export-proceeds"]>;
        readonly categories: Schema.NonEmptyArray<Schema.Literals<readonly ["wages", "supplies", "contract-research", "computer-use", "software-development", "research-experimental", "export-proceeds"]>>;
        readonly claimantBases: Schema.NonEmptyArray<Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder", "registered-exporter"]>>;
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
        readonly basePeriodYears: Schema.Number;
        readonly requiresRegistration: Schema.optional<Schema.String>;
        readonly citations: Schema.NonEmptyArray<Schema.Struct<{
            readonly source: Schema.Literals<readonly ["statute", "regulation", "rev-proc", "notice", "public-law", "form-instructions", "official-guidance"]>;
            readonly locator: Schema.NonEmptyString;
            readonly url: Schema.optional<Schema.String>;
        }>>;
        readonly notes: Schema.$Array<Schema.NonEmptyString>;
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
    }>>;
    readonly entities: Schema.$Array<Schema.Struct<{
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly situs: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly functionalCurrency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly fiscalYearEndMonth: Schema.Number;
        readonly passThrough: Schema.Boolean;
        readonly registrations: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.String;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>>;
    readonly components: Schema.$Array<Schema.Struct<{
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/BusinessComponentId">;
        readonly name: Schema.NonEmptyString;
        readonly version: Schema.optional<Schema.NonEmptyString>;
        readonly kind: Schema.Literals<readonly ["product", "process", "software", "technique", "formula", "invention"]>;
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly internalUseClass: Schema.Literals<readonly ["commercial", "internal-use", "dual-function", "undetermined"]>;
        readonly uncertaintyAtOutset: Schema.optional<Schema.Struct<{
            readonly statement: Schema.NonEmptyString;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
        readonly alternativesEvidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly experimentationEvidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly developmentStart: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly commercialReadinessDate: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>>;
    readonly labour: Schema.$Array<Schema.Struct<{
        readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
        readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly engagementId: Schema.brand<Schema.String, "keiretsu/EngagementId">;
        readonly employer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly situs: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly workDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly minutes: Schema.Number;
        readonly aiAssisted: Schema.Boolean;
    }>>;
    readonly wages: Schema.$Array<Schema.Struct<{
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly payer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
        readonly wageKind: Schema.Union<readonly [Schema.Literals<readonly ["us-3401-box1", "statutory", "bonus", "benefits", "employer-tax", "overhead", "contractor-payment", "foreign-local-payroll", "loaded-rate"]>, Schema.String]>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly transfers: Schema.$Array<Schema.Struct<{
        readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
        readonly legId: Schema.optional<Schema.brand<Schema.String, "keiretsu/LegId">>;
        readonly agreementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AgreementId">>;
        readonly fromEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly toEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly legKind: Schema.Union<readonly [Schema.Literals<readonly ["cost-plus", "time-and-materials", "fixed-fee", "value-based", "pass-through", "resale"]>, Schema.String]>;
    }>>;
    readonly slices: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
        readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
        readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly qreCategory: Schema.Literals<readonly ["qualified-research", "direct-supervision", "direct-support", "non-qualified"]>;
        readonly sreCategory: Schema.Literals<readonly ["software-development", "research-experimental", "not-sre"]>;
        readonly businessComponentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/BusinessComponentId">>;
        readonly minutes: Schema.Number;
        readonly quarter: Schema.String;
        readonly substantiation: Schema.Literals<readonly ["contemporaneous", "reconstructed", "estimated"]>;
        readonly attestedBy: Schema.TaggedStruct<"human", {
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
        readonly attestedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>>;
    readonly fundings: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
        readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
        readonly performer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly payer: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly paymentContingentOnSuccess: Schema.Literals<readonly ["yes", "no", "unknown"]>;
        readonly performerRetainsSubstantialRights: Schema.Literals<readonly ["yes", "no", "unknown"]>;
        readonly economicRiskBearer: Schema.Literals<readonly ["performer", "payer", "shared", "unknown"]>;
        readonly agreementPredatesWork: Schema.Literals<readonly ["yes", "no", "unknown"]>;
        readonly performerVerdict: Schema.Literals<readonly ["funded", "not-funded", "partially-funded", "undetermined"]>;
        readonly payerVerdict: Schema.Literals<readonly ["contract-research-candidate", "no-contract-research", "undetermined"]>;
        readonly decisionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DecisionId">>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>>;
    readonly groups: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
        readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
        readonly members: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/EntityId">>;
        readonly status: Schema.Literals<readonly ["established", "undetermined"]>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly attributions: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
        readonly sliceId: Schema.brand<Schema.String, "keiretsu/AttributionId">;
        readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
        readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly regimeId: Schema.brand<Schema.String, "keiretsu/RegimeId">;
        readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
        readonly claimant: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly basis: Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder"]>;
        readonly controlledGroupRef: Schema.optional<Schema.brand<Schema.String, "keiretsu/AttributionId">>;
        readonly fundingAssessmentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AttributionId">>;
        readonly passThroughToOwners: Schema.Boolean;
        readonly status: Schema.Literal<"candidate">;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>>;
    readonly basePeriods: Schema.$Array<Schema.Struct<{
        readonly claimant: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly regimeId: Schema.brand<Schema.String, "keiretsu/RegimeId">;
        readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
        readonly status: Schema.Literals<readonly ["known", "unknown", "attested-none"]>;
        readonly amount: Schema.optional<Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type IncentiveSet = typeof IncentiveSet.Type;
/**
 * Lookup tables over a set (first record wins on duplicate ids; duplicates are reported by the screen).
 *
 * @since 0.1.0
 * @category models
 */
export interface SetIndex {
    readonly set: IncentiveSet;
    readonly regimes: ReadonlyMap<string, IncentiveRegime>;
    readonly entities: ReadonlyMap<string, EntityTaxProfile>;
    readonly components: ReadonlyMap<string, BusinessComponent>;
    readonly labour: ReadonlyMap<string, LabourFact>;
    readonly slices: ReadonlyMap<string, TaxActivitySlice>;
    readonly fundings: ReadonlyMap<string, FundingAssessment>;
    readonly groups: ReadonlyMap<string, ControlledGroupYear>;
    readonly transfersByEvent: ReadonlyMap<string, ReadonlyArray<TransferFact>>;
}
/**
 * Build the lookup tables.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const indexSet: (set: IncentiveSet) => SetIndex;
//# sourceMappingURL=IncentiveSet.d.ts.map