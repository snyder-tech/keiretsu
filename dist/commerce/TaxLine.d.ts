/**
 * Invoice tax lines, by regime, with UNCL 5305 duty/tax category codes.
 *
 * Tax lines are produced by a tax-determination step **after** invoice
 * assembly, never from charge lines, and this package never decides a rate,
 * place of supply or exemption: it records what was determined and checks
 * the line's internal consistency. Rules that depend on law are flagged as
 * holds for a professional, not resolved. Decision support; professional
 * review required.
 *
 * Categories (UNCL 5305): `S` standard, `Z` zero-rated, `E` exempt, `AE`
 * reverse charge, `K` intra-community (EEA) supply, `G` export outside the
 * EU / free export, `O` outside scope, `L`/`M` Canary Islands / Ceuta and Melilla.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import type { CurrencyTableShape } from '../core/Currency.ts';
import type { ValidationIssue } from '../core/Issue.ts';
import { IsoDate } from '../core/Temporal.ts';
/**
 * UNCL 5305 duty/tax/fee category code.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TaxCategory: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
/** @since 0.1.0 @category models */
export type TaxCategory = typeof TaxCategory.Type;
/**
 * Categories that carry an exemption reason (EN 16931 BT-120/121).
 *
 * @since 0.1.0
 * @category constants
 */
export declare const EXEMPTION_REASON_CATEGORIES: ReadonlySet<TaxCategory>;
/**
 * One rated component (GST CGST/SGST/IGST, a state and a local sales tax…).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TaxComponent: Schema.Struct<{
    readonly kind: Schema.NonEmptyString;
    /** Rate as a fraction (`0.09` for 9%). */
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type TaxComponent = typeof TaxComponent.Type;
/**
 * India GST treatment. Export under LUT is zero-rated without IGST; export with
 * payment charges IGST that is refunded later.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const InGstTreatment: Schema.Literals<readonly ["intra-state", "inter-state", "export-lut", "export-with-payment"]>;
/** @since 0.1.0 @category models */
export type InGstTreatment = typeof InGstTreatment.Type;
/**
 * A tax line.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TaxLine: Schema.TaggedUnion<{
    readonly none: Schema.TaggedStruct<"none", {
        readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
        readonly base: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly components: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            /** Rate as a fraction (`0.09` for 9%). */
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
        }>>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly exemptionReason: Schema.optional<Schema.NonEmptyString>;
        /** The determination this line came from (tax package or adviser). */
        readonly determination: Schema.optional<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
    readonly "us-sales-tax": Schema.TaggedStruct<"us-sales-tax", {
        readonly jurisdiction: Schema.brand<Schema.String, "keiretsu/SubdivisionCode">;
        readonly localJurisdiction: Schema.optional<Schema.NonEmptyString>;
        readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
        readonly base: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly components: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            /** Rate as a fraction (`0.09` for 9%). */
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
        }>>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly exemptionReason: Schema.optional<Schema.NonEmptyString>;
        /** The determination this line came from (tax package or adviser). */
        readonly determination: Schema.optional<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
    readonly "in-gst": Schema.TaggedStruct<"in-gst", {
        readonly treatment: Schema.Literals<readonly ["intra-state", "inter-state", "export-lut", "export-with-payment"]>;
        readonly supplierGstState: Schema.brand<Schema.String, "keiretsu/SubdivisionCode">;
        readonly placeOfSupply: Schema.Struct<{
            readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
            readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
        }>;
        readonly sacCode: Schema.String;
        readonly lut: Schema.optional<Schema.Struct<{
            readonly ref: Schema.NonEmptyString;
            readonly fiscalYear: Schema.String;
        }>>;
        /** Receipt of convertible foreign exchange (FIRC/BRC) that zero-rating depends on. */
        readonly realisation: Schema.optional<Schema.Struct<{
            readonly currency: Schema.String;
            readonly dueBy: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly evidence: Schema.optional<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
        readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
        readonly base: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly components: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            /** Rate as a fraction (`0.09` for 9%). */
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
        }>>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly exemptionReason: Schema.optional<Schema.NonEmptyString>;
        /** The determination this line came from (tax package or adviser). */
        readonly determination: Schema.optional<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
    readonly "pk-provincial-sales-tax": Schema.TaggedStruct<"pk-provincial-sales-tax", {
        readonly province: Schema.brand<Schema.String, "keiretsu/SubdivisionCode">;
        readonly authority: Schema.NonEmptyString;
        readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
        readonly base: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly components: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            /** Rate as a fraction (`0.09` for 9%). */
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
        }>>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly exemptionReason: Schema.optional<Schema.NonEmptyString>;
        /** The determination this line came from (tax package or adviser). */
        readonly determination: Schema.optional<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
    readonly "eu-vat": Schema.TaggedStruct<"eu-vat", {
        readonly memberState: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly reverseCharge: Schema.Boolean;
        readonly buyerVatId: Schema.optional<Schema.NonEmptyString>;
        readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
        readonly base: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly components: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            /** Rate as a fraction (`0.09` for 9%). */
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly amount: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
        }>>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly exemptionReason: Schema.optional<Schema.NonEmptyString>;
        /** The determination this line came from (tax package or adviser). */
        readonly determination: Schema.optional<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type TaxLine = typeof TaxLine.Type;
/**
 * Facts about the document a tax line sits on.
 *
 * @since 0.1.0
 * @category models
 */
export interface TaxLineContext {
    readonly documentCurrency: string;
    readonly issueDate: string;
    readonly table?: CurrencyTableShape;
}
/**
 * Validate one tax line: category/exemption consistency, arithmetic and regime rules.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateTaxLine: (line: TaxLine, options: {
    readonly subject: string;
    readonly context: TaxLineContext;
}) => ReadonlyArray<ValidationIssue>;
/**
 * Exposed for tests and adapters: the Indian fiscal year (`2026-27`) of a date.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const inFiscalYear: (date: IsoDate | string) => string;
//# sourceMappingURL=TaxLine.d.ts.map