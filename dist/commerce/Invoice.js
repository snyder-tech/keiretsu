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
import { digestValue } from "../core/CanonicalJson.js";
import { CurrencyCode } from "../core/Currency.js";
import { Decimal } from "../core/Decimal.js";
import { revisionChain, RevisionFields } from "../core/Envelope.js";
import { AgreementId, ChargeId, DocumentId, LegId } from "../core/Ids.js";
import { make, Money, units } from "../core/Money.js";
import { IsoDate, Period } from "../core/Temporal.js";
import { BillingModeTagSchema } from "./BillingMode.js";
import { ChargeUnit } from "./Charge.js";
import { PurchaseOrderRef } from "./ChargeLine.js";
import { fault, rule, toCheck } from "./Invariant.js";
import { DocumentNumber } from "./Numbering.js";
import { PartyRef, sameParty } from "./Party.js";
import { TaxLine } from "./TaxLine.js";
/**
 * One document line, collapsed from charge lines.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DocumentLine = Schema.Struct({
    lineNo: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    chargeIds: Schema.NonEmptyArray(ChargeId),
    legId: LegId,
    billingModeTag: BillingModeTagSchema,
    unit: ChargeUnit,
    quantity: Decimal,
    amount: Money,
    description: Schema.optional(Schema.NonEmptyString.check(Schema.isMaxLength(500))),
});
/**
 * Document totals in the document currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DocumentTotals = Schema.Struct({ lineExtension: Money, taxTotal: Money, payable: Money });
const DocumentFields = {
    id: DocumentId,
    ...RevisionFields,
    issuer: PartyRef,
    recipient: PartyRef,
    agreementId: AgreementId,
    period: Period,
    currency: CurrencyCode,
    purchaseOrder: Schema.optional(PurchaseOrderRef),
    status: Schema.Literals(['draft', 'issued', 'cancelled']),
    number: Schema.optional(DocumentNumber),
    issueDate: Schema.optional(IsoDate),
    lines: Schema.NonEmptyArray(DocumentLine),
    taxLines: Schema.Array(TaxLine),
    totals: DocumentTotals,
};
const total = (amounts) => amounts.reduce((sum, money) => sum + units(money), 0n);
const taxInDocumentCurrency = (document) => document.taxLines.filter((line) => line.amount.currency === document.currency).map((line) => line.amount);
/**
 * Document invariants shared by invoices and credit notes.
 *
 * @since 0.1.0
 * @category invariants
 */
export const documentRules = {
    parties: rule('document.same-party', (document) => (sameParty(document.issuer, document.recipient) ? 'issuer and recipient differ' : undefined)),
    lineCurrency: rule('document.line-currency', (document) => document.lines.every((line) => line.amount.currency === document.currency) && Object.values(document.totals).every((money) => money.currency === document.currency)
        ? undefined
        : 'one currency per document'),
    lineNumbers: rule('document.line-numbers', (document) => (document.lines.every((line, index) => line.lineNo === index + 1) ? undefined : 'lines are numbered 1..n')),
    positive: rule('document.negative-line', (document) => (document.lines.some((line) => units(line.amount) < 0n) ? 'lines are stated non-negative; credits are credit notes' : undefined)),
    consumedOnce: rule('document.charge-consumed-twice', (document) => {
        const ids = document.lines.flatMap((line) => line.chargeIds);
        return new Set(ids).size === ids.length ? undefined : 'each charge line is consumed once';
    }),
    lineExtension: rule('document.line-extension', (document) => total(document.lines.map((line) => line.amount)) === units(document.totals.lineExtension) ? undefined : 'line extension is the sum of the lines'),
    taxTotal: rule('document.tax-total', (document) => total(taxInDocumentCurrency(document)) === units(document.totals.taxTotal) ? undefined : 'tax total is the sum of tax lines in the document currency'),
    taxCurrency: rule('document.tax-currency', (document) => document.taxLines.some((line) => line.amount.currency !== document.currency && units(line.amount) !== 0n)
        ? 'non-zero tax in another currency needs a tax-currency total (not yet modelled); hold for review'
        : undefined),
    payable: rule('document.payable', (document) => units(document.totals.lineExtension) + units(document.totals.taxTotal) === units(document.totals.payable) ? undefined : 'payable = line extension + tax total'),
    issuedNumbered: rule('document.issued-without-number', (document) => document.status !== 'draft' && (document.number === undefined || document.issueDate === undefined) ? 'an issued document has a number and issue date' : undefined),
};
const documentChecks = [
    revisionChain,
    toCheck(documentRules.parties),
    toCheck(documentRules.lineCurrency),
    toCheck(documentRules.lineNumbers),
    toCheck(documentRules.positive),
    toCheck(documentRules.consumedOnce),
    toCheck(documentRules.lineExtension),
    toCheck(documentRules.taxTotal),
    toCheck(documentRules.taxCurrency),
    toCheck(documentRules.payable),
    toCheck(documentRules.issuedNumbered),
];
/**
 * A commercial invoice.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Invoice = Schema.Struct({ ...DocumentFields, documentTypeCode: Schema.Literal('380') }).check(...documentChecks);
/**
 * A credit note against an earlier invoice of the same issuer, recipient and currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CreditNote = Schema.Struct({ ...DocumentFields, documentTypeCode: Schema.Literal('381'), precedingInvoiceId: DocumentId }).check(...documentChecks);
/**
 * Replace a draft's tax lines and recompute its totals.
 *
 * @since 0.1.0
 * @category combinators
 */
export const withTaxLines = (document, taxLines) => {
    const tax = total(taxLines.filter((line) => line.amount.currency === document.currency).map((line) => line.amount));
    const lineExtension = units(document.totals.lineExtension);
    return {
        ...document,
        taxLines,
        totals: { lineExtension: document.totals.lineExtension, taxTotal: make(tax, document.currency), payable: make(lineExtension + tax, document.currency) },
    };
};
const IMMUTABLE_OMIT = new Set(['revision', 'supersedesDigest', 'status']);
const content = (encoded) => Object.fromEntries(Object.entries(encoded).filter(([key]) => !IMMUTABLE_OMIT.has(key)));
const encodeDocument = (document) => document.documentTypeCode === '380' ? { ...Schema.encodeSync(Invoice)(document) } : { ...Schema.encodeSync(CreditNote)(document) };
/**
 * SHA-256 of a document's canonical wire form (the digest a later revision supersedes).
 *
 * @since 0.1.0
 * @category digests
 */
export const documentDigest = (document) => digestValue(encodeDocument(document));
/**
 * Check a proposed revision against the previous one: `document.revision-chain`
 * (revision + 1, supersedes the previous digest) and `document.issued-immutable`
 * (an issued document may only be cancelled; a cancelled one never changes).
 *
 * @since 0.1.0
 * @category validators
 */
export const checkRevision = (previous, next) => Effect.gen(function* () {
    const previousDigest = yield* documentDigest(previous);
    const before = yield* digestValue(content(encodeDocument(previous)));
    const after = yield* digestValue(content(encodeDocument(next)));
    const chained = next.id === previous.id && next.revision === previous.revision + 1 && next.supersedesDigest === previousDigest;
    const frozen = previous.status !== 'draft';
    const allowed = previous.status === 'issued' ? next.status === 'issued' || next.status === 'cancelled' : next.status === previous.status;
    return [
        ...(chained ? [] : [fault('document.revision-chain', next.id, 'a revision increments revision and supersedes the previous digest')]),
        ...(frozen && (before !== after || !allowed) ? [fault('document.issued-immutable', next.id, 'issued documents are immutable; correct with a credit note and a new invoice')] : []),
    ];
});
//# sourceMappingURL=Invoice.js.map