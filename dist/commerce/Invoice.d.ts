/**
 * Billing documents: invoices (UNCL 1001 `380`) and credit notes (`381`).
 *
 * Every invoice line traces at least one charge line and each charge line is
 * consumed by at most one live document line. Totals follow EN 16931
 * (BR-CO-10..16): Σ lines = line extension; payable = line extension + tax.
 * Withholding never alters a document (see `Withholding`). An issued document
 * is immutable: the only permitted revision is cancellation; any change is a
 * credit note plus a new invoice. A credit note states positive amounts and
 * cites the invoice it corrects.
 *
 * Invoices are claims, not revenue: revenue is posted from recognition
 * entries in the finance package, never from these documents.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type CanonicalJsonError } from '../core/CanonicalJson.ts';
import type { ValidationIssue } from '../core/Issue.ts';
import { DocumentNumber } from './Numbering.ts';
import { PartyRef } from './Party.ts';
import { TaxLine } from './TaxLine.ts';
/**
 * One document line, collapsed from charge lines.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DocumentLine: Schema.Struct<{
    readonly lineNo: Schema.Number;
    readonly chargeIds: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
    readonly legId: Schema.brand<Schema.String, "keiretsu/LegId">;
    readonly billingModeTag: Schema.Literals<readonly ["cost-reimbursement", "cost-plus", "time-and-materials", "fixed-fee", "retainer", "unit-price", "value-based", "revenue-share", "pass-through-disbursement", "no-charge"]>;
    readonly unit: Schema.Literals<readonly ["minute", "value-unit", "period", "amount"]>;
    readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly description: Schema.optional<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type DocumentLine = typeof DocumentLine.Type;
/**
 * Document totals in the document currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DocumentTotals: Schema.Struct<{
    readonly lineExtension: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly taxTotal: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly payable: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type DocumentTotals = typeof DocumentTotals.Type;
interface DocumentShape {
    readonly issuer: PartyRef;
    readonly recipient: PartyRef;
    readonly currency: string;
    readonly status: string;
    readonly number?: DocumentNumber | undefined;
    readonly issueDate?: string | undefined;
    readonly lines: ReadonlyArray<DocumentLine>;
    readonly taxLines: ReadonlyArray<TaxLine>;
    readonly totals: DocumentTotals;
}
/**
 * Document invariants shared by invoices and credit notes.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const documentRules: {
    readonly parties: import("./Invariant.ts").Rule<DocumentShape>;
    readonly lineCurrency: import("./Invariant.ts").Rule<DocumentShape>;
    readonly lineNumbers: import("./Invariant.ts").Rule<DocumentShape>;
    readonly positive: import("./Invariant.ts").Rule<DocumentShape>;
    readonly consumedOnce: import("./Invariant.ts").Rule<DocumentShape>;
    readonly lineExtension: import("./Invariant.ts").Rule<DocumentShape>;
    readonly taxTotal: import("./Invariant.ts").Rule<DocumentShape>;
    readonly taxCurrency: import("./Invariant.ts").Rule<DocumentShape>;
    readonly payable: import("./Invariant.ts").Rule<DocumentShape>;
    readonly issuedNumbered: import("./Invariant.ts").Rule<DocumentShape>;
};
/**
 * A commercial invoice.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Invoice: Schema.Struct<{
    readonly documentTypeCode: Schema.Literal<"380">;
    readonly issuer: Schema.TaggedUnion<{
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
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly purchaseOrder: Schema.optional<Schema.Struct<{
        readonly number: Schema.NonEmptyString;
        readonly documentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
    }>>;
    readonly status: Schema.Literals<readonly ["draft", "issued", "cancelled"]>;
    readonly number: Schema.optional<Schema.Struct<{
        readonly series: Schema.String;
        readonly fiscalYear: Schema.String;
        readonly sequence: Schema.Number;
        readonly text: Schema.NonEmptyString;
    }>>;
    readonly issueDate: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly lines: Schema.NonEmptyArray<Schema.Struct<{
        readonly lineNo: Schema.Number;
        readonly chargeIds: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
        readonly legId: Schema.brand<Schema.String, "keiretsu/LegId">;
        readonly billingModeTag: Schema.Literals<readonly ["cost-reimbursement", "cost-plus", "time-and-materials", "fixed-fee", "retainer", "unit-price", "value-based", "revenue-share", "pass-through-disbursement", "no-charge"]>;
        readonly unit: Schema.Literals<readonly ["minute", "value-unit", "period", "amount"]>;
        readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly description: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly taxLines: Schema.$Array<Schema.TaggedUnion<{
        readonly none: Schema.TaggedStruct<"none", {
            readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
            readonly base: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly components: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
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
            readonly determination: Schema.optional<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>;
    }>>;
    readonly totals: Schema.Struct<{
        readonly lineExtension: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly taxTotal: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly payable: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
    }>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/DocumentId">;
}>;
/** @since 0.1.0 @category models */
export type Invoice = typeof Invoice.Type;
/**
 * A credit note against an earlier invoice of the same issuer, recipient and currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CreditNote: Schema.Struct<{
    readonly documentTypeCode: Schema.Literal<"381">;
    readonly precedingInvoiceId: Schema.brand<Schema.String, "keiretsu/DocumentId">;
    readonly issuer: Schema.TaggedUnion<{
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
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly purchaseOrder: Schema.optional<Schema.Struct<{
        readonly number: Schema.NonEmptyString;
        readonly documentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
    }>>;
    readonly status: Schema.Literals<readonly ["draft", "issued", "cancelled"]>;
    readonly number: Schema.optional<Schema.Struct<{
        readonly series: Schema.String;
        readonly fiscalYear: Schema.String;
        readonly sequence: Schema.Number;
        readonly text: Schema.NonEmptyString;
    }>>;
    readonly issueDate: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly lines: Schema.NonEmptyArray<Schema.Struct<{
        readonly lineNo: Schema.Number;
        readonly chargeIds: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
        readonly legId: Schema.brand<Schema.String, "keiretsu/LegId">;
        readonly billingModeTag: Schema.Literals<readonly ["cost-reimbursement", "cost-plus", "time-and-materials", "fixed-fee", "retainer", "unit-price", "value-based", "revenue-share", "pass-through-disbursement", "no-charge"]>;
        readonly unit: Schema.Literals<readonly ["minute", "value-unit", "period", "amount"]>;
        readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly description: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly taxLines: Schema.$Array<Schema.TaggedUnion<{
        readonly none: Schema.TaggedStruct<"none", {
            readonly category: Schema.Literals<readonly ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]>;
            readonly base: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly components: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
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
            readonly determination: Schema.optional<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>;
    }>>;
    readonly totals: Schema.Struct<{
        readonly lineExtension: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly taxTotal: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly payable: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
    }>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/DocumentId">;
}>;
/** @since 0.1.0 @category models */
export type CreditNote = typeof CreditNote.Type;
/**
 * Replace a draft's tax lines and recompute its totals.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const withTaxLines: <D extends Invoice | CreditNote>(document: D, taxLines: ReadonlyArray<TaxLine>) => D;
/**
 * SHA-256 of a document's canonical wire form (the digest a later revision supersedes).
 *
 * @since 0.1.0
 * @category digests
 */
export declare const documentDigest: (document: Invoice | CreditNote) => Effect.Effect<string & import("effect/Brand").Brand<"keiretsu/Sha256">, CanonicalJsonError, never>;
/**
 * Check a proposed revision against the previous one: `document.revision-chain`
 * (revision + 1, supersedes the previous digest) and `document.issued-immutable`
 * (an issued document may only be cancelled; a cancelled one never changes).
 *
 * @since 0.1.0
 * @category validators
 */
export declare const checkRevision: (previous: Invoice | CreditNote, next: Invoice | CreditNote) => Effect.Effect<ReadonlyArray<ValidationIssue>, CanonicalJsonError>;
export {};
//# sourceMappingURL=Invoice.d.ts.map