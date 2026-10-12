/**
 * Withholding certificates.
 *
 * Withholding (India TDS, Pakistan s.153, US §1446 …) is recorded as its own
 * record, never on the invoice amount: it reduces the **cash expected**, not
 * revenue or the invoice payable. The amount becomes a tax asset or foreign
 * tax paid in the finance package. The regime and income character are
 * determined by people; this package records them. Decision support;
 * professional review required.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Decimal } from "../core/Decimal.js";
import { AssertionFields, revisionChain, RevisionFields, verifiedHasEvidence } from "../core/Envelope.js";
import { DocumentId } from "../core/Ids.js";
import { make, Money, units } from "../core/Money.js";
import { Period } from "../core/Temporal.js";
import { OpenCode } from "./Code.js";
import { rule, toCheck } from "./Invariant.js";
import { PartyRef, sameParty } from "./Party.js";
/**
 * Certificate invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const withholdingRules = {
    parties: rule('withholding.same-party', (certificate) => (sameParty(certificate.deductor, certificate.deductee) ? 'deductor and deductee differ' : undefined)),
    currency: rule('withholding.currency-mismatch', (certificate) => (certificate.base.currency === certificate.amount.currency ? undefined : 'base and amount share a currency')),
    bounds: rule('withholding.amount-out-of-bounds', (certificate) => units(certificate.amount) >= 0n && units(certificate.amount) <= units(certificate.base) ? undefined : 'withholding lies between zero and its base'),
};
/**
 * A withholding certificate (or the expectation of one).
 *
 * @since 0.1.0
 * @category schemas
 */
export const WithholdingCertificate = Schema.Struct({
    id: DocumentId,
    ...RevisionFields,
    /** Open regime code, e.g. `in-tds-194j`, `pk-ito-153`, `us-1446`. */
    regime: OpenCode,
    /** Income character as determined by a person (`fts`, `royalty`, `business-profits` …). */
    character: OpenCode,
    deductor: PartyRef,
    deductee: PartyRef,
    period: Period,
    documentIds: Schema.NonEmptyArray(DocumentId),
    base: Money,
    rate: Decimal,
    amount: Money,
    form: Schema.optional(OpenCode),
    certificateNumber: Schema.optional(Schema.NonEmptyString),
    status: Schema.Literals(['expected', 'received', 'reconciled', 'disputed']),
    ...AssertionFields,
}).check(revisionChain, verifiedHasEvidence, toCheck(withholdingRules.parties), toCheck(withholdingRules.currency), toCheck(withholdingRules.bounds));
/**
 * Cash expected for a document: its payable less withholding certificates that cite it.
 * The document's payable (and revenue) is unchanged.
 *
 * @since 0.1.0
 * @category accessors
 */
export const expectedCash = (document, certificates) => {
    const withheld = certificates
        .filter((certificate) => certificate.documentIds.some((id) => id === document.id) && certificate.amount.currency === document.payable.currency)
        .reduce((total, certificate) => total + units(certificate.amount), 0n);
    return make(units(document.payable) - withheld, document.payable.currency);
};
//# sourceMappingURL=Withholding.js.map