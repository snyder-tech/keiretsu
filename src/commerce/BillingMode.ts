/**
 * Billing modes: how one transfer leg is priced.
 *
 * Price is always separate from cost. Cost-based modes cite the
 * `CostBaseDefinition` (owned by `@snyder-tech/keiretsu/finance`) by id and
 * digest, so costing, cost-plus charges and true-ups share one base.
 *
 * - `cost-reimbursement`: cost at cost, no markup.
 * - `cost-plus`: cost × (1 + markup).
 * - `time-and-materials`: minutes × role rate from a rate card, optionally capped (cap in the mode currency).
 * - `fixed-fee`: an agreed amount; `recognitionHint` informs the revenue package, it never posts revenue.
 * - `retainer`: a period amount with included minutes and an overage rate card.
 * - `unit-price`: accepted units of a versioned offering × unit price.
 * - `value-based`: baseline effort per unit × rate; the efficiency dividend is split by the leg.
 * - `revenue-share`: a share of revenue earned on a referenced work object.
 * - `pass-through-disbursement`: expenses and usage re-billed at cost, as an amount (no time, no markup).
 * - `no-charge`: recorded for cost and attribution only.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Sha256 } from '../core/CanonicalJson.ts';
import { CurrencyCode } from '../core/Currency.ts';
import { Decimal } from '../core/Decimal.ts';
import { OfferingId, RuleId } from '../core/Ids.ts';
import { Money } from '../core/Money.ts';

import { MarkupBps, Minutes, OpenCode, openVocabulary, ShareBps } from './Code.ts';
import { RateCardId } from './CommerceIds.ts';
import { rule } from './Invariant.ts';
import { WorkObjectRef } from './WorkObjectRef.ts';

/**
 * Port: a `CostBaseDefinition` pinned by id and digest (finance package).
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseRef = Schema.Struct({ definitionId: RuleId, digest: Sha256 });
/** @since 0.1.0 @category models */
export type CostBaseRef = typeof CostBaseRef.Type;

/**
 * A billing mode.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BillingMode = Schema.TaggedUnion({
  'cost-reimbursement': { costBase: CostBaseRef },
  'cost-plus': { costBase: CostBaseRef, markupBps: MarkupBps },
  'time-and-materials': { rateCardId: RateCardId, currency: CurrencyCode, cap: Schema.optional(Money) },
  'fixed-fee': { amount: Money, recognitionHint: openVocabulary(['over-time', 'at-milestone', 'point-in-time'] as const) },
  retainer: { periodAmount: Money, includedMinutes: Minutes, overageRateCardId: Schema.optional(RateCardId) },
  'unit-price': { offeringId: OfferingId, offeringVersion: Schema.NonEmptyString.check(Schema.isMaxLength(32)), valueUnit: OpenCode, unitPrice: Decimal, currency: CurrencyCode },
  'value-based': {
    offeringId: Schema.optional(OfferingId),
    valueUnit: OpenCode,
    /** Baseline human effort for one value unit (catalog capability baseline or agreed estimate). */
    baselineMinutesPerUnit: Decimal,
    baselineStatus: Schema.Literals(['estimated', 'calibrated']),
    /** Rate per hour applied to billed baseline minutes, in `currency`. */
    hourlyRate: Decimal,
    currency: CurrencyCode,
  },
  'revenue-share': { shareBps: ShareBps, revenueSource: WorkObjectRef },
  'pass-through-disbursement': { components: Schema.NonEmptyArray(openVocabulary(['expense', 'ai', 'tooling'] as const)) },
  'no-charge': { reason: openVocabulary(['same-entity', 'internal-investment', 'warranty', 'goodwill', 'pre-sales'] as const) },
});
/** @since 0.1.0 @category models */
export type BillingMode = typeof BillingMode.Type;
/** @since 0.1.0 @category models */
export type BillingModeTag = BillingMode['_tag'];

/**
 * All mode tags.
 *
 * @since 0.1.0
 * @category constants
 */
export const BILLING_MODE_TAGS = [
  'cost-reimbursement',
  'cost-plus',
  'time-and-materials',
  'fixed-fee',
  'retainer',
  'unit-price',
  'value-based',
  'revenue-share',
  'pass-through-disbursement',
  'no-charge',
] as const satisfies ReadonlyArray<BillingModeTag>;

/**
 * A billing-mode tag on the wire.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BillingModeTagSchema = Schema.Literals(BILLING_MODE_TAGS);

/**
 * Modes whose charge rests on an accepted outcome (cite acceptance events).
 *
 * @since 0.1.0
 * @category constants
 */
export const OUTCOME_MODES: ReadonlySet<BillingModeTag> = new Set(['value-based', 'unit-price']);

/**
 * Modes priced from a cost-base measurement (cite the cost-base digest).
 *
 * @since 0.1.0
 * @category constants
 */
export const COST_BASE_MODES: ReadonlySet<BillingModeTag> = new Set(['cost-reimbursement', 'cost-plus']);

const negative = (value: string): boolean => value.startsWith('-');
const isNegativeMoney = (money: Money | undefined): boolean => money !== undefined && negative(money.minor);

/**
 * Mode-level invariants (run by the leg check, since tagged unions keep their matchers unrefined).
 *
 * @since 0.1.0
 * @category invariants
 */
export const billingModeRules = {
  capCurrency: rule<BillingMode>('billing-mode.cap-currency-mismatch', (mode) =>
    mode._tag === 'time-and-materials' && mode.cap !== undefined && mode.cap.currency !== mode.currency ? `cap is in ${mode.cap.currency}, rates are in ${mode.currency}` : undefined,
  ),
  nonNegative: rule<BillingMode>('billing-mode.negative-term', (mode) =>
    BillingMode.match(mode, {
      'cost-reimbursement': () => false,
      'cost-plus': () => false,
      'time-and-materials': (tm) => isNegativeMoney(tm.cap),
      'fixed-fee': (fee) => isNegativeMoney(fee.amount),
      retainer: (retainer) => isNegativeMoney(retainer.periodAmount),
      'unit-price': (unit) => negative(unit.unitPrice),
      'value-based': (value) => negative(value.hourlyRate) || negative(value.baselineMinutesPerUnit) || value.baselineMinutesPerUnit === '0',
      'revenue-share': () => false,
      'pass-through-disbursement': () => false,
      'no-charge': () => false,
    })
      ? 'prices, caps and baselines are non-negative (baselines positive)'
      : undefined,
  ),
} as const;
