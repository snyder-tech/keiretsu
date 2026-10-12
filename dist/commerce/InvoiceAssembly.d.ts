import { Schema } from 'effect';
import { ChargeId, DocumentId } from '../core/Ids.ts';
import { type ChargeLine } from './ChargeLine.ts';
import type { CreditNote, Invoice } from './Invoice.ts';
import { type TransferRoute } from './TransferRoute.ts';
/**
 * One charge consumed by one document line. Append-only.
 *
 * @since 0.1.0
 * @category models
 */
export declare const ConsumptionLink: Schema.Struct<{
    readonly chargeId: Schema.brand<Schema.String, "keiretsu/ChargeId">;
    readonly documentId: Schema.brand<Schema.String, "keiretsu/DocumentId">;
    readonly documentTypeCode: Schema.Literals<readonly ["380", "381"]>;
    readonly lineNo: Schema.Int;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly correctsChargeId: Schema.optional<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
}>;
/** @since 0.1.0 @category models */
export type ConsumptionLink = typeof ConsumptionLink.Type;
/**
 * Assembly inputs besides the charge lines.
 *
 * @since 0.1.0
 * @category models
 */
export interface AssemblyPolicy {
    readonly routes: ReadonlyArray<TransferRoute>;
    /** Links from earlier runs; consumed charges are skipped and credit targets resolved here. */
    readonly links: ReadonlyArray<ConsumptionLink>;
    /** Mint a document id for a group (deterministic in tests, UUIDv7 in production). */
    readonly newDocumentId: (groupKey: string) => DocumentId;
    /** Split invoices by purchase order (default true). */
    readonly groupByPurchaseOrder?: boolean;
}
/**
 * A charge left out, with its reason code.
 *
 * @since 0.1.0
 * @category models
 */
export interface Exclusion {
    readonly chargeId: ChargeId;
    readonly reasonCode: string;
    readonly message: string;
}
/**
 * Drafts, exclusions and the new consumption links.
 *
 * @since 0.1.0
 * @category models
 */
export interface AssemblyResult {
    readonly invoices: ReadonlyArray<Invoice>;
    readonly creditNotes: ReadonlyArray<CreditNote>;
    readonly excluded: ReadonlyArray<Exclusion>;
    readonly links: ReadonlyArray<ConsumptionLink>;
}
/**
 * Assemble drafts. Pure and deterministic for a given input and id minter.
 *
 * @since 0.1.0
 * @category assembly
 */
export declare const assembleInvoices: (chargeLines: ReadonlyArray<ChargeLine>, policy: AssemblyPolicy) => AssemblyResult;
//# sourceMappingURL=InvoiceAssembly.d.ts.map