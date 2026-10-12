/**
 * Charge lines: the money on one leg for one period.
 *
 * `amount` is in the leg's invoice currency; `providerAmount` is the
 * pre-translation amount and, when its currency differs, the FX snapshot is
 * required. A **credit** is a line with a negative amount that cites the line
 * it corrects; it lands in `adjustmentPeriod` (after the corrected period) when
 * that period is closed. Status `credited` marks an original line that a
 * credit has reversed. Cost-plus and cost-reimbursement lines pin the
 * cost-base digest. A line for capacity priced by lead time states its
 * lead-time class with the booking and service-start dates, and is checked
 * against the agreement's classes.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Decimal } from '../core/Decimal.ts';
import { revisionChain, RevisionFields } from '../core/Envelope.ts';
import { AgreementId, ChargeId, DocumentId, AcceptanceId, LegId, RouteId } from '../core/Ids.ts';
import type { ValidationIssue } from '../core/Issue.ts';
import { Money } from '../core/Money.ts';
import { RoundingMode } from '../core/Rounding.ts';
import { IsoDate, Period } from '../core/Temporal.ts';

import { isExecutedOn, type Agreement } from './Agreement.ts';
import { BillingModeTagSchema, COST_BASE_MODES, CostBaseRef, OUTCOME_MODES, type BillingModeTag } from './BillingMode.ts';
import { classFor, leadDays } from './CapacityTerms.ts';
import { ChargeUnit, type ChargeComputation } from './Charge.ts';
import { OpenCode } from './Code.ts';
import { AllocationId } from './CommerceIds.ts';
import { FxSnapshotRef } from './FxPort.ts';
import { fault, rule, runRules, toCheck } from './Invariant.ts';
import { PartyRef, sameParty } from './Party.ts';
import { activeMinutes, latestAllocations, type TransferAllocation } from './TransferAllocation.ts';
import { findLeg, type TransferRoute } from './TransferRoute.ts';

/**
 * Charge lifecycle.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ChargeStatus = Schema.Literals(['estimated', 'accrued', 'held', 'invoiced', 'settled', 'disputed', 'credited']);
/** @since 0.1.0 @category models */
export type ChargeStatus = typeof ChargeStatus.Type;

/**
 * Statuses a line on an undetermined leg may carry.
 *
 * @since 0.1.0
 * @category constants
 */
export const HELD_LEG_STATUSES: ReadonlySet<ChargeStatus> = new Set(['estimated', 'held']);

/**
 * A purchase-order reference.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PurchaseOrderRef = Schema.Struct({ number: Schema.NonEmptyString.check(Schema.isMaxLength(64)), documentId: Schema.optional(DocumentId) });
/** @since 0.1.0 @category models */
export type PurchaseOrderRef = typeof PurchaseOrderRef.Type;

/**
 * The lead-time price class a line claims, with the dates it is judged by.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LeadTimeClaim = Schema.Struct({ classKey: OpenCode, bookedOn: IsoDate, serviceStart: IsoDate });
/** @since 0.1.0 @category models */
export type LeadTimeClaim = typeof LeadTimeClaim.Type;

interface LineShape {
  readonly status: ChargeStatus;
  readonly holdReasonCode?: string | undefined;
  readonly amount: Money;
  readonly providerAmount?: Money | undefined;
  readonly fx?: FxSnapshotRef | undefined;
  readonly correctsChargeId?: string | undefined;
  readonly period: string;
  readonly adjustmentPeriod?: string | undefined;
  readonly invoiceId?: string | undefined;
  readonly billingModeTag: BillingModeTag;
  readonly costBase?: CostBaseRef | undefined;
  readonly quantity: string;
  readonly provider: PartyRef;
  readonly recipient: PartyRef;
  readonly leadTime?: LeadTimeClaim | undefined;
}

const isNegative = (money: Money): boolean => money.minor.startsWith('-');

/**
 * Single-record charge-line invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const chargeLineRules = {
  heldReason: rule<LineShape>('charge.held-without-reason', (line) => (line.status === 'held' && line.holdReasonCode === undefined ? 'a held charge states its reason code' : undefined)),
  creditTarget: rule<LineShape>('charge.credit-without-target', (line) =>
    isNegative(line.amount) && line.correctsChargeId === undefined ? 'a negative line is a credit and cites the line it corrects' : undefined,
  ),
  creditedStatus: rule<LineShape>('charge.credited-status-on-credit', (line) =>
    line.status === 'credited' && isNegative(line.amount) ? 'status credited marks the original line, not the credit' : undefined,
  ),
  providerSign: rule<LineShape>('charge.provider-amount-sign', (line) =>
    line.providerAmount !== undefined && isNegative(line.providerAmount) !== isNegative(line.amount) && line.providerAmount.minor !== '0' && line.amount.minor !== '0'
      ? 'providerAmount and amount share a sign'
      : undefined,
  ),
  adjustmentOrder: rule<LineShape>('charge.adjustment-period-order', (line) =>
    line.adjustmentPeriod !== undefined && line.adjustmentPeriod <= line.period ? 'adjustmentPeriod follows the corrected period' : undefined,
  ),
  invoicedDocument: rule<LineShape>('charge.invoiced-without-document', (line) =>
    (line.status === 'invoiced' || line.status === 'settled') && line.invoiceId === undefined ? 'an invoiced charge cites its document' : undefined,
  ),
  fxRequired: rule<LineShape>('charge.fx-missing', (line) =>
    line.providerAmount !== undefined && line.providerAmount.currency !== line.amount.currency && line.fx === undefined ? 'a translated charge carries its FX snapshot' : undefined,
  ),
  fxPair: rule<LineShape>('charge.fx-pair-mismatch', (line) => {
    if (line.fx === undefined || line.providerAmount === undefined) return undefined;
    const pair = new Set([line.fx.base, line.fx.quote]);
    return pair.has(line.providerAmount.currency) && pair.has(line.amount.currency) && line.providerAmount.currency !== line.amount.currency
      ? undefined
      : 'the FX snapshot pair matches providerAmount and amount currencies';
  }),
  costBaseDigest: rule<LineShape>('charge.cost-base-missing', (line) =>
    COST_BASE_MODES.has(line.billingModeTag) && line.costBase === undefined ? `${line.billingModeTag} lines pin the cost-base definition digest` : undefined,
  ),
  quantitySign: rule<LineShape>('charge.negative-quantity', (line) => (line.quantity.startsWith('-') ? 'quantity is non-negative; the amount carries the credit sign' : undefined)),
  distinctParties: rule<LineShape>('charge.same-party', (line) => (sameParty(line.provider, line.recipient) ? 'a charge crosses parties' : undefined)),
  leadTimeOrder: rule<LineShape>('charge.lead-time-booked-after-start', (line) =>
    line.leadTime !== undefined && line.leadTime.bookedOn > line.leadTime.serviceStart ? 'capacity is booked on or before service starts' : undefined,
  ),
} as const;

/**
 * A charge line.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ChargeLine = Schema.Struct({
  id: ChargeId,
  ...RevisionFields,
  period: Period,
  adjustmentPeriod: Schema.optional(Period),
  routeId: RouteId,
  legId: LegId,
  agreementId: AgreementId,
  provider: PartyRef,
  recipient: PartyRef,
  billingModeTag: BillingModeTagSchema,
  quantity: Decimal,
  unit: ChargeUnit,
  providerAmount: Schema.optional(Money),
  amount: Money,
  fx: Schema.optional(FxSnapshotRef),
  costBase: Schema.optional(CostBaseRef),
  rounding: RoundingMode,
  allocationIds: Schema.Array(AllocationId),
  /** Acceptance events (work package) that make outcome-priced lines billable. */
  acceptanceIds: Schema.Array(AcceptanceId),
  purchaseOrder: Schema.optional(PurchaseOrderRef),
  status: ChargeStatus,
  holdReasonCode: Schema.optional(Schema.NonEmptyString),
  invoiceId: Schema.optional(DocumentId),
  correctsChargeId: Schema.optional(ChargeId),
  /** Lead-time price class claimed for capacity on this line. */
  leadTime: Schema.optional(LeadTimeClaim),
}).check(
  revisionChain,
  toCheck(chargeLineRules.heldReason),
  toCheck(chargeLineRules.creditTarget),
  toCheck(chargeLineRules.creditedStatus),
  toCheck(chargeLineRules.providerSign),
  toCheck(chargeLineRules.adjustmentOrder),
  toCheck(chargeLineRules.invoicedDocument),
  toCheck(chargeLineRules.fxRequired),
  toCheck(chargeLineRules.fxPair),
  toCheck(chargeLineRules.costBaseDigest),
  toCheck(chargeLineRules.quantitySign),
  toCheck(chargeLineRules.distinctParties),
  toCheck(chargeLineRules.leadTimeOrder),
);
/** @since 0.1.0 @category models */
export type ChargeLine = typeof ChargeLine.Type;

/**
 * Build a revision-1 charge line from a computation. A `hold` disposition yields status `held`.
 *
 * @since 0.1.0
 * @category constructors
 */
export const fromComputation = (options: {
  readonly id: string;
  readonly computation: ChargeComputation;
  readonly route: TransferRoute;
  readonly period: string;
  readonly allocationIds?: ReadonlyArray<string>;
  readonly acceptanceIds?: ReadonlyArray<string>;
  readonly purchaseOrder?: PurchaseOrderRef;
}): ChargeLine => {
  const leg = findLeg(options.route, options.computation.legId);
  if (leg === undefined) throw new RangeError(`leg ${options.computation.legId} is not on route ${options.route.id}`);
  const { computation } = options;
  const translated = computation.providerAmount.currency !== computation.amount.currency;
  return Schema.decodeUnknownSync(ChargeLine)({
    id: options.id,
    revision: 1,
    period: options.period,
    routeId: options.route.id,
    legId: leg.id,
    agreementId: leg.agreementId,
    provider: leg.provider,
    recipient: leg.recipient,
    billingModeTag: computation.billingModeTag,
    quantity: computation.quantity,
    unit: computation.unit,
    ...(translated ? { providerAmount: computation.providerAmount } : {}),
    amount: computation.amount,
    fx: computation.fx,
    costBase: computation.costBase,
    rounding: leg.rounding,
    allocationIds: options.allocationIds ?? [],
    acceptanceIds: options.acceptanceIds ?? [],
    purchaseOrder: options.purchaseOrder,
    status: computation.disposition._tag === 'hold' ? 'held' : 'accrued',
    holdReasonCode: computation.disposition._tag === 'hold' ? computation.disposition.reasonCode : undefined,
  });
};

/**
 * Keep the highest revision of each charge id.
 *
 * @since 0.1.0
 * @category combinators
 */
export const latestChargeLines = (lines: ReadonlyArray<ChargeLine>): ReadonlyArray<ChargeLine> => {
  const latest = new Map<string, ChargeLine>();
  for (const line of lines) {
    const current = latest.get(line.id);
    if (current === undefined || line.revision > current.revision) latest.set(line.id, line);
  }
  return [...latest.values()];
};

/**
 * The records charge lines are checked against. Agreements are optional; when
 * given, accruing on an agreement that is not executed raises a hold.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeContext {
  readonly routes: ReadonlyArray<TransferRoute>;
  readonly allocations: ReadonlyArray<TransferAllocation>;
  readonly agreements?: ReadonlyArray<Agreement>;
}

const ACCRUING: ReadonlySet<ChargeStatus> = new Set(['accrued', 'invoiced', 'settled']);

const lastDayOf = (period: string): string => {
  const [year = 0, month = 1] = period.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
};

const checkAgainstLeg = (line: ChargeLine, route: TransferRoute): ReadonlyArray<ValidationIssue> => {
  const leg = findLeg(route, line.legId);
  if (leg === undefined) return [fault('charge.leg-unresolved', line.id, `leg ${line.legId} is not on route ${route.id}`)];
  return [
    ...(sameParty(leg.provider, line.provider) && sameParty(leg.recipient, line.recipient) ? [] : [fault('charge.parties-mismatch', line.id, 'charge parties differ from its leg')]),
    ...(leg.agreementId === line.agreementId ? [] : [fault('charge.agreement-mismatch', line.id, 'charge agreement differs from its leg')]),
    ...(leg.billingMode._tag === line.billingModeTag ? [] : [fault('charge.mode-mismatch', line.id, `charge mode ${line.billingModeTag} differs from leg mode ${leg.billingMode._tag}`)]),
    ...(leg.invoiceCurrency === line.amount.currency ? [] : [fault('charge.currency-mismatch', line.id, 'amount is not in the leg invoice currency')]),
    ...(leg.relatedParty.status !== 'undetermined' || HELD_LEG_STATUSES.has(line.status)
      ? []
      : [fault('charge.not-held', line.id, 'charges on a leg with undetermined related-party status stay estimated or held')]),
    ...(leg.billingMode._tag === 'cost-plus' && line.costBase !== undefined && line.costBase.digest !== leg.billingMode.costBase.digest
      ? [fault('charge.cost-base-mismatch', line.id, 'charge cites a different cost-base digest than its leg')]
      : []),
  ];
};

const checkMinutes = (line: ChargeLine, context: ChargeContext): ReadonlyArray<ValidationIssue> => {
  if (line.unit !== 'minute' || line.correctsChargeId !== undefined) return [];
  const known = new Map(latestAllocations(context.allocations).map((allocation) => [allocation.id, allocation]));
  const unresolved = line.allocationIds.filter((id) => !known.has(id));
  if (unresolved.length > 0) return unresolved.map((id) => fault('charge.allocation-unresolved', line.id, `allocation ${id} is not in the set`, 'warning'));
  const offRoute = line.allocationIds.filter((id) => known.get(id)?.routeId !== line.routeId);
  if (offRoute.length > 0) return [fault('charge.allocation-route-mismatch', line.id, `allocations ${offRoute.join(', ')} are on another route`)];
  // Finalised quantities belong to the consumed revision; later allocation reversals do not rewrite them.
  if (['invoiced', 'settled', 'credited'].includes(line.status)) return [];
  const minutes = activeMinutes(context.allocations, line.allocationIds);
  return line.quantity === String(minutes) ? [] : [fault('charge.quantity-mismatch', line.id, `quantity ${line.quantity} differs from ${minutes} allocated minutes`)];
};

const checkOutcome = (line: ChargeLine): ReadonlyArray<ValidationIssue> =>
  OUTCOME_MODES.has(line.billingModeTag) && line.correctsChargeId === undefined && line.acceptanceIds.length === 0
    ? [fault('charge.outcome-not-accepted', line.id, 'value-based and unit-price lines cite an acceptance record')]
    : [];

const checkAgreement = (line: ChargeLine, context: ChargeContext): ReadonlyArray<ValidationIssue> => {
  if (context.agreements === undefined || !ACCRUING.has(line.status)) return [];
  const agreement = context.agreements.find((entry) => entry.id === line.agreementId);
  if (agreement === undefined) return [fault('charge.agreement-unresolved', line.id, `agreement ${line.agreementId} is not in the set`, 'warning')];
  return isExecutedOn(agreement, lastDayOf(line.period)) ? [] : [fault('charge.agreement-not-executed', line.id, 'the agreement is not executed and in force for the period', 'hold')];
};

const checkLeadTime = (line: ChargeLine, context: ChargeContext): ReadonlyArray<ValidationIssue> => {
  const claim = line.leadTime;
  const agreement = context.agreements?.find((entry) => entry.id === line.agreementId);
  if (claim === undefined || agreement === undefined) return [];
  const classes = agreement.leadTimeClasses ?? [];
  if (classes.length === 0) return [fault('charge.lead-time-classes-undeclared', line.id, 'the line claims a lead-time class; its agreement declares none')];
  const days = leadDays(claim.bookedOn, claim.serviceStart);
  const expected = classFor(classes, days);
  if (expected === undefined) return [fault('charge.lead-time-class-unknown', line.id, `the agreement has no lead-time class for ${days} days`)];
  return expected.key === claim.classKey ? [] : [fault('charge.lead-time-class-mismatch', line.id, `booked ${days} days ahead is class ${expected.key}, not ${claim.classKey}`)];
};

const checkCredit = (line: ChargeLine, byId: ReadonlyMap<string, ChargeLine>): ReadonlyArray<ValidationIssue> => {
  if (line.correctsChargeId === undefined) return [];
  const target = byId.get(line.correctsChargeId);
  if (target === undefined) return [fault('charge.credit-target-unresolved', line.id, `corrected line ${line.correctsChargeId} is not in the set`, 'warning')];
  return target.legId === line.legId && target.amount.currency === line.amount.currency
    ? []
    : [fault('charge.credit-target-mismatch', line.id, 'a correction stays on the leg and currency of the line it corrects')];
};

/**
 * Cross-record checks over charge lines (latest revisions), with codes:
 * `charge.leg-unresolved`, `charge.parties-mismatch`, `charge.mode-mismatch`,
 * `charge.currency-mismatch`, `charge.not-held`, `charge.quantity-mismatch`,
 * `charge.outcome-not-accepted`, `charge.agreement-not-executed` (hold),
 * `charge.lead-time-classes-undeclared`, `charge.lead-time-class-unknown`,
 * `charge.lead-time-class-mismatch`, `charge.credit-target-*`, plus every
 * single-record rule.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateChargeLines = (lines: ReadonlyArray<ChargeLine>, context: ChargeContext): ReadonlyArray<ValidationIssue> => {
  const latest = latestChargeLines(lines);
  const byId = new Map(latest.map((line) => [line.id, line]));
  const routes = new Map(context.routes.map((route) => [route.id, route]));
  return latest.flatMap((line) => {
    const route = routes.get(line.routeId);
    return [
      ...runRules({ rules: Object.values(chargeLineRules), value: line, subject: line.id }),
      ...(route === undefined ? [fault('charge.leg-unresolved', line.id, `route ${line.routeId} is not in the set`)] : checkAgainstLeg(line, route)),
      ...checkMinutes(line, context),
      ...checkOutcome(line),
      ...checkAgreement(line, context),
      ...checkLeadTime(line, context),
      ...checkCredit(line, byId),
    ];
  });
};
