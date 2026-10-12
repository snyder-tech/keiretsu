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

import { Decimal } from '../core/Decimal.ts';
import { AssertionFields, revisionChain, RevisionFields, verifiedHasEvidence } from '../core/Envelope.ts';
import { DocumentId } from '../core/Ids.ts';
import { make, Money, units, type Money as MoneyType } from '../core/Money.ts';
import { Period } from '../core/Temporal.ts';

import { OpenCode } from './Code.ts';
import { rule, toCheck } from './Invariant.ts';
import { PartyRef, sameParty } from './Party.ts';

interface CertificateShape {
  readonly deductor: PartyRef;
  readonly deductee: PartyRef;
  readonly base: MoneyType;
  readonly amount: MoneyType;
}

/**
 * Certificate invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const withholdingRules = {
  parties: rule<CertificateShape>('withholding.same-party', (certificate) => (sameParty(certificate.deductor, certificate.deductee) ? 'deductor and deductee differ' : undefined)),
  currency: rule<CertificateShape>('withholding.currency-mismatch', (certificate) => (certificate.base.currency === certificate.amount.currency ? undefined : 'base and amount share a currency')),
  bounds: rule<CertificateShape>('withholding.amount-out-of-bounds', (certificate) =>
    units(certificate.amount) >= 0n && units(certificate.amount) <= units(certificate.base) ? undefined : 'withholding lies between zero and its base',
  ),
} as const;

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
/** @since 0.1.0 @category models */
export type WithholdingCertificate = typeof WithholdingCertificate.Type;

/**
 * Cash expected for a document: its payable less withholding certificates that cite it.
 * The document's payable (and revenue) is unchanged.
 *
 * @since 0.1.0
 * @category accessors
 */
export const expectedCash = (document: { readonly id: string; readonly payable: MoneyType }, certificates: ReadonlyArray<WithholdingCertificate>): MoneyType => {
  const withheld = certificates
    .filter((certificate) => certificate.documentIds.some((id) => id === document.id) && certificate.amount.currency === document.payable.currency)
    .reduce((total, certificate) => total + units(certificate.amount), 0n);
  return make(units(document.payable) - withheld, document.payable.currency);
};
