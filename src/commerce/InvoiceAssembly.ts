/**
 * Assemble draft invoices and credit notes from charge lines.
 *
 * Only `accrued` lines are billed. Lines are grouped by provider, recipient,
 * agreement, currency, period (the adjustment period for corrections) and
 * purchase order, then collapsed into document lines by (leg, mode, unit)
 * keeping every charge id. Negative lines never net into an invoice: each
 * becomes a credit-note line against the invoice that consumed the line it
 * corrects, and cumulative credits never exceed the original. Held,
 * no-charge, undetermined-leg and already-consumed lines are excluded with a
 * reason code. Every included charge is consumed exactly once, recorded in an
 * append-only consumption link. Tax lines are added afterwards
 * (`Invoice.withTaxLines`); numbers are allocated at issue.
 *
 * @since 0.1.0
 * @module
 */
import * as Decimal from '../core/Decimal.ts';
import { Schema } from 'effect';
import { ChargeId, DocumentId } from '../core/Ids.ts';
import { Money as MoneySchema } from '../core/Money.ts';
import { make, units } from '../core/Money.ts';
import type { Period } from '../core/Temporal.ts';

import { latestChargeLines, type ChargeLine } from './ChargeLine.ts';
import type { CreditNote, DocumentLine, Invoice } from './Invoice.ts';
import { partyKey } from './Party.ts';
import { findLeg, type TransferRoute } from './TransferRoute.ts';

/**
 * One charge consumed by one document line. Append-only.
 *
 * @since 0.1.0
 * @category models
 */
export const ConsumptionLink = Schema.Struct({
  chargeId: ChargeId,
  documentId: DocumentId,
  documentTypeCode: Schema.Literals(['380', '381']),
  lineNo: Schema.Int.check(Schema.isGreaterThan(0)),
  amount: MoneySchema,
  correctsChargeId: Schema.optional(ChargeId),
});
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

type Placement =
  | { readonly _tag: 'invoice' }
  | { readonly _tag: 'credit'; readonly precedingInvoiceId: DocumentId }
  | { readonly _tag: 'excluded'; readonly reasonCode: string; readonly message: string };

const excluded = (reasonCode: string, message: string): Placement => ({ _tag: 'excluded', reasonCode, message });

const abs = (value: bigint): bigint => (value < 0n ? -value : value);

interface CreditLedger {
  readonly invoiceLinks: ReadonlyMap<string, ConsumptionLink>;
  readonly credited: Map<string, bigint>;
}

const placeCredit = (line: ChargeLine, ledger: CreditLedger): Placement => {
  const target = line.correctsChargeId === undefined ? undefined : ledger.invoiceLinks.get(line.correctsChargeId);
  if (target === undefined || line.correctsChargeId === undefined) return excluded('assembly.credit-target-not-invoiced', 'the corrected charge has not been invoiced');
  if (target.amount.currency !== line.amount.currency) return excluded('assembly.credit-currency-mismatch', 'a credit is in the currency of the invoiced charge');
  const already = ledger.credited.get(line.correctsChargeId) ?? 0n;
  const next = already + abs(units(line.amount));
  if (next > units(target.amount)) return excluded('assembly.credit-exceeds-original', `credits of ${next} minor units exceed the invoiced ${target.amount.minor}`);
  ledger.credited.set(line.correctsChargeId, next);
  return { _tag: 'credit', precedingInvoiceId: target.documentId };
};

const place = (line: ChargeLine, context: { readonly policy: AssemblyPolicy; readonly consumed: ReadonlySet<string>; readonly ledger: CreditLedger }): Placement => {
  if (context.consumed.has(line.id)) return excluded('assembly.already-consumed', 'the charge is already on a document');
  if (line.status === 'held') return excluded('assembly.held', `held: ${line.holdReasonCode ?? 'no reason code'}`);
  if (line.status !== 'accrued') return excluded('assembly.not-accrued', `status ${line.status} is not billable`);
  if (line.billingModeTag === 'no-charge') return excluded('assembly.no-charge', 'no-charge lines are recorded, not billed');
  const route = context.policy.routes.find((entry) => entry.id === line.routeId);
  const leg = route === undefined ? undefined : findLeg(route, line.legId);
  if (leg === undefined) return excluded('assembly.leg-unresolved', 'route or leg is not available');
  if (leg.relatedParty.status === 'undetermined') return excluded('assembly.leg-undetermined', 'related-party status is undetermined; invoicing holds');
  const amount = units(line.amount);
  if (amount === 0n) return excluded('assembly.zero-amount', 'zero lines are not billed');
  return amount < 0n ? placeCredit(line, context.ledger) : { _tag: 'invoice' };
};

const groupKey = (line: ChargeLine, options: { readonly byPurchaseOrder: boolean; readonly suffix: string }): string =>
  [
    partyKey(line.provider),
    partyKey(line.recipient),
    line.agreementId,
    line.amount.currency,
    line.adjustmentPeriod ?? line.period,
    options.byPurchaseOrder ? (line.purchaseOrder?.number ?? '-') : '-',
    options.suffix,
  ].join('|');

const sumQuantity = (lines: ReadonlyArray<ChargeLine>): Decimal.Decimal =>
  Decimal.fromScaled(lines.reduce((total, line) => Decimal.add(total, Decimal.toScaled(line.quantity)), Decimal.fromInteger(0)));

const buildLines = (lines: ReadonlyArray<ChargeLine>): ReadonlyArray<DocumentLine> => {
  const collapsed = new Map<string, Array<ChargeLine>>();
  for (const line of [...lines].sort((left, right) => left.id.localeCompare(right.id))) {
    const key = `${line.legId}|${line.billingModeTag}|${line.unit}`;
    collapsed.set(key, [...(collapsed.get(key) ?? []), line]);
  }
  return [...collapsed.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group], index) => {
      const [first, ...rest] = group;
      if (first === undefined) throw new RangeError('empty document line group');
      return {
        lineNo: index + 1,
        chargeIds: [first.id, ...rest.map((line) => line.id)],
        legId: first.legId,
        billingModeTag: first.billingModeTag,
        unit: first.unit,
        quantity: sumQuantity(group),
        amount: make(abs(group.reduce((total, line) => total + units(line.amount), 0n)), first.amount.currency),
      };
    });
};

const draftFields = (options: { readonly id: DocumentId; readonly lines: ReadonlyArray<ChargeLine> }) => {
  const [first] = options.lines;
  if (first === undefined) throw new RangeError('empty document group');
  const documentLines = buildLines(options.lines);
  const [head, ...tail] = documentLines;
  if (head === undefined) throw new RangeError('empty document');
  const lineExtension = documentLines.reduce((total, line) => total + units(line.amount), 0n);
  const currency = first.amount.currency;
  return {
    id: options.id,
    revision: 1,
    issuer: first.provider,
    recipient: first.recipient,
    agreementId: first.agreementId,
    period: (first.adjustmentPeriod ?? first.period) satisfies Period,
    currency,
    ...(first.purchaseOrder === undefined ? {} : { purchaseOrder: first.purchaseOrder }),
    status: 'draft' as const,
    lines: [head, ...tail] as const,
    taxLines: [],
    totals: { lineExtension: make(lineExtension, currency), taxTotal: make(0n, currency), payable: make(lineExtension, currency) },
  };
};

const linksFor = (
  document: { readonly id: DocumentId; readonly lines: ReadonlyArray<DocumentLine> },
  options: { readonly code: '380' | '381'; readonly byId: ReadonlyMap<string, ChargeLine> },
): ReadonlyArray<ConsumptionLink> =>
  document.lines.flatMap((line) =>
    line.chargeIds.flatMap((chargeId) => {
      const charge = options.byId.get(chargeId);
      if (charge === undefined) return [];
      return [
        {
          chargeId,
          documentId: document.id,
          documentTypeCode: options.code,
          lineNo: line.lineNo,
          amount: charge.amount,
          ...(charge.correctsChargeId === undefined ? {} : { correctsChargeId: charge.correctsChargeId }),
        },
      ];
    }),
  );

const priorCredits = (links: ReadonlyArray<ConsumptionLink>): Map<string, bigint> => {
  const credited = new Map<string, bigint>();
  for (const link of links) {
    if (link.documentTypeCode !== '381' || link.correctsChargeId === undefined) continue;
    credited.set(link.correctsChargeId, (credited.get(link.correctsChargeId) ?? 0n) + abs(units(link.amount)));
  }
  return credited;
};

/**
 * Assemble drafts. Pure and deterministic for a given input and id minter.
 *
 * @since 0.1.0
 * @category assembly
 */
export const assembleInvoices = (chargeLines: ReadonlyArray<ChargeLine>, policy: AssemblyPolicy): AssemblyResult => {
  const lines = [...latestChargeLines(chargeLines)].sort((left, right) => left.id.localeCompare(right.id));
  const byId = new Map(lines.map((line) => [line.id, line]));
  const ledger: CreditLedger = {
    invoiceLinks: new Map(policy.links.filter((link) => link.documentTypeCode === '380').map((link) => [link.chargeId, link])),
    credited: priorCredits(policy.links),
  };
  const context = { policy, consumed: new Set<string>(policy.links.map((link) => link.chargeId)), ledger };
  const byPurchaseOrder = policy.groupByPurchaseOrder ?? true;
  const invoiceGroups = new Map<string, Array<ChargeLine>>();
  const creditGroups = new Map<string, { readonly precedingInvoiceId: DocumentId; readonly lines: Array<ChargeLine> }>();
  const exclusions: Array<Exclusion> = [];
  for (const line of lines) {
    const placement = place(line, context);
    if (placement._tag === 'excluded') {
      exclusions.push({ chargeId: line.id, reasonCode: placement.reasonCode, message: placement.message });
    } else if (placement._tag === 'invoice') {
      const key = groupKey(line, { byPurchaseOrder, suffix: 'invoice' });
      invoiceGroups.set(key, [...(invoiceGroups.get(key) ?? []), line]);
    } else {
      const key = groupKey(line, { byPurchaseOrder, suffix: `credit:${placement.precedingInvoiceId}` });
      creditGroups.set(key, { precedingInvoiceId: placement.precedingInvoiceId, lines: [...(creditGroups.get(key)?.lines ?? []), line] });
    }
  }
  const invoices: ReadonlyArray<Invoice> = [...invoiceGroups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, group]) => ({ ...draftFields({ id: policy.newDocumentId(key), lines: group }), documentTypeCode: '380' as const }));
  const creditNotes: ReadonlyArray<CreditNote> = [...creditGroups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, group]) => ({ ...draftFields({ id: policy.newDocumentId(key), lines: group.lines }), documentTypeCode: '381' as const, precedingInvoiceId: group.precedingInvoiceId }));
  return {
    invoices,
    creditNotes,
    excluded: exclusions,
    links: [...invoices.flatMap((invoice) => linksFor(invoice, { code: '380', byId })), ...creditNotes.flatMap((note) => linksFor(note, { code: '381', byId }))],
  };
};
