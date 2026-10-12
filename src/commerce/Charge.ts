/**
 * Pure charge computation — one handler per billing mode.
 *
 * Order of operations (normative):
 *   1. price in the mode's own currency (cost modes: the cost measurement's
 *      currency) at full fixed-point precision, less the lead-time class
 *      discount when the basis names one;
 *   2. translate to the leg's invoice currency with the FX snapshot supplied
 *      through the fx port (never resolved here);
 *   3. round **once** to invoice minor units with the leg's rounding mode.
 * `providerAmount` (the pre-translation amount, rounded with the same mode) is
 * disclosure only; it never feeds step 3.
 *
 * Inputs are never guessed: a missing rate, cost, unit count or FX snapshot
 * fails with a coded {@link ChargeComputationError}; negative inputs are
 * rejected (credits are separate charge lines). A leg whose related-party
 * status is `undetermined`, or an associated cost-plus/value-based leg without
 * transfer-pricing documentation, prices normally but returns a `hold`
 * disposition.
 *
 * @since 0.1.0
 * @module
 */
import { convertScaled } from '../fx/Conversion.ts';
import { Effect, Schema } from 'effect';

import { iso4217, type CurrencyCode, type CurrencyTableShape } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import * as Money from '../core/Money.ts';

import { BillingMode, type BillingModeTag, type CostBaseRef } from './BillingMode.ts';
import type { LeadTimeClass } from './CapacityTerms.ts';
import type { FxSnapshotRef } from './FxPort.ts';
import type { ResolvedRate } from './RateCard.ts';
import type { TransferLeg } from './TransferRoute.ts';

/**
 * Charge quantity units.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ChargeUnit = Schema.Literals(['minute', 'value-unit', 'period', 'amount']);
/** @since 0.1.0 @category models */
export type ChargeUnit = typeof ChargeUnit.Type;

/**
 * Missing or inconsistent inputs. `code` is a stable issue code.
 *
 * @since 0.1.0
 * @category errors
 */
export class ChargeComputationError extends Schema.TaggedError<ChargeComputationError>()('ChargeComputationError', {
  legId: Schema.String,
  code: Schema.String,
  reason: Schema.String,
}) {}

/**
 * Port: a cost measurement against a cost-base definition (finance package).
 *
 * @since 0.1.0
 * @category models
 */
export interface CostMeasurement {
  readonly definitionId: string;
  readonly definitionDigest: string;
  readonly markupBase: Money.Money;
  readonly passThrough: Money.Money;
}

/**
 * Facts a leg's charge is computed from. Supply what the leg's mode needs.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeBasis {
  /** Human minutes allocated to the route for the period (non-negative integer). */
  readonly minutes: number;
  /** Cost of the cost base, for cost-reimbursement and cost-plus. */
  readonly cost?: CostMeasurement;
  /** Role rate resolved from the leg's rate card (time-and-materials, retainer overage). */
  readonly rate?: ResolvedRate;
  /** Accepted value units (unit-price, value-based). */
  readonly units?: Decimal.Decimal;
  /** Revenue earned on the revenue-share source for the period. */
  readonly revenue?: Money.Money;
  /** Disbursed amount re-billed at cost (pass-through). */
  readonly disbursement?: Money.Money;
  /** FX snapshot used when the priced currency differs from the invoice currency. */
  readonly fx?: FxSnapshotRef;
  /**
   * The agreement's lead-time class for this charge (resolve with `classFor`;
   * `validateChargeLines` checks the line's claim). Its discount applies to
   * the priced amount; at-cost modes take no discount.
   */
  readonly leadTimeClass?: LeadTimeClass;
}

/**
 * Whether the result may accrue or must hold for a human decision.
 *
 * @since 0.1.0
 * @category models
 */
export type Disposition = { readonly _tag: 'accrue' } | { readonly _tag: 'hold'; readonly reasonCode: string; readonly message: string };

/**
 * One leg's computed charge.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeComputation {
  readonly legId: string;
  readonly billingModeTag: BillingModeTag;
  readonly quantity: Decimal.Decimal;
  readonly unit: ChargeUnit;
  /** Unrounded amount in the priced currency. */
  readonly priced: { readonly amount: Decimal.Decimal; readonly currency: CurrencyCode };
  readonly providerAmount: Money.Money;
  readonly amount: Money.Money;
  readonly fx?: FxSnapshotRef;
  readonly costBase?: CostBaseRef;
  /** The lead-time discount applied in step 1, if any. */
  readonly leadTimeDiscount?: { readonly classKey: string; readonly discountBps: number };
  readonly disposition: Disposition;
}

/**
 * Input to {@link computeCharge}. `table` defaults to the bundled ISO 4217 edition.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeInput {
  readonly leg: TransferLeg;
  readonly basis: ChargeBasis;
  readonly table?: CurrencyTableShape;
}

interface Priced {
  readonly quantity: Decimal.Decimal;
  readonly unit: ChargeUnit;
  readonly amount: Decimal.Scaled;
  readonly currency: CurrencyCode;
}

type Pricing = Effect.Effect<Priced, ChargeComputationError>;
type Mode<T extends BillingModeTag> = Extract<BillingMode, { readonly _tag: T }>;

const fail = (input: ChargeInput, code: string, reason: string) => Effect.fail(new ChargeComputationError({ legId: input.leg.id, code, reason }));
const tableOf = (input: ChargeInput): CurrencyTableShape => input.table ?? iso4217;
const whole = (value: number | bigint): Decimal.Decimal => Decimal.fromScaled(Decimal.fromInteger(value));
const bps = (value: number): Decimal.Scaled => Decimal.fromUnits(BigInt(value), 4);
const SIXTY = Decimal.fromInteger(60);

const scaledOf = (input: ChargeInput, money: Money.Money): Effect.Effect<Decimal.Scaled, ChargeComputationError> =>
  Effect.mapError(
    Money.toScaledAmount(money, tableOf(input)),
    (error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: `${error.code} is not in ${error.edition}` }),
  );

const need = <A>(input: ChargeInput, value: A | undefined, code: string, reason: string): Effect.Effect<A, ChargeComputationError> =>
  value === undefined ? fail(input, code, reason) : Effect.succeed(value);

const costFor = (input: ChargeInput, costBase: CostBaseRef): Effect.Effect<CostMeasurement, ChargeComputationError> =>
  Effect.flatMap(need(input, input.basis.cost, 'charge.cost-missing', 'a cost-based leg needs a cost measurement'), (cost) => {
    if (cost.definitionId !== costBase.definitionId || cost.definitionDigest !== costBase.digest)
      return fail(input, 'charge.compute.cost-base-mismatch', 'the cost measurement cites a different cost-base definition or digest than the leg');
    if (cost.markupBase.currency !== cost.passThrough.currency) return fail(input, 'charge.cost-currency-mismatch', 'markup base and pass-through use the same currency');
    return Effect.succeed(cost);
  });

const timeRate = (input: ChargeInput, options: { readonly rateCardId: string | undefined; readonly currency: string }): Effect.Effect<ResolvedRate, ChargeComputationError> =>
  Effect.flatMap(need(input, input.basis.rate, 'charge.rate-missing', 'an hourly rate is required'), (rate) => {
    if (rate.currency !== options.currency) return fail(input, 'charge.rate-currency-mismatch', `rate is in ${rate.currency}, the mode prices in ${options.currency}`);
    if (options.rateCardId !== undefined && rate.rateCardId !== options.rateCardId) return fail(input, 'charge.rate-card-mismatch', 'rate comes from another rate card');
    return Effect.succeed(rate);
  });

const minutesAt = (minutes: number, rate: Decimal.Decimal): Decimal.Scaled => Decimal.divideBy(Decimal.multiply(Decimal.fromInteger(minutes), Decimal.toScaled(rate)), SIXTY);

const priceCost = (input: ChargeInput, options: { readonly costBase: CostBaseRef; readonly markupBps: number }): Pricing =>
  Effect.gen(function* () {
    const cost = yield* costFor(input, options.costBase);
    const base = yield* scaledOf(input, cost.markupBase);
    const passThrough = yield* scaledOf(input, cost.passThrough);
    return {
      quantity: whole(input.basis.minutes),
      unit: 'minute' as const,
      amount: Decimal.add(Decimal.multiply(base, bps(10_000 + options.markupBps)), passThrough),
      currency: cost.markupBase.currency,
    };
  });

const priceCostReimbursement = (input: ChargeInput, mode: Mode<'cost-reimbursement'>): Pricing => priceCost(input, { costBase: mode.costBase, markupBps: 0 });
const priceCostPlus = (input: ChargeInput, mode: Mode<'cost-plus'>): Pricing => priceCost(input, { costBase: mode.costBase, markupBps: mode.markupBps });

/** The cap bounds this computation; a cap across periods is tracked by the issuer against prior charges. */
const priceTimeAndMaterials = (input: ChargeInput, mode: Mode<'time-and-materials'>): Pricing => {
  const cap = mode.cap;
  if (cap !== undefined && cap.currency !== mode.currency) return fail(input, 'charge.cap-currency-mismatch', `cap is in ${cap.currency}, rates are in ${mode.currency}`);
  return Effect.gen(function* () {
    const rate = yield* timeRate(input, { rateCardId: mode.rateCardId, currency: mode.currency });
    const raw = minutesAt(input.basis.minutes, rate.rate);
    const capped = cap === undefined ? raw : yield* Effect.map(scaledOf(input, cap), (limit) => (raw > limit ? limit : raw));
    return { quantity: whole(input.basis.minutes), unit: 'minute' as const, amount: capped, currency: mode.currency };
  });
};

const priceFixedFee = (input: ChargeInput, mode: Mode<'fixed-fee'>): Pricing =>
  Effect.map(scaledOf(input, mode.amount), (amount) => ({ quantity: whole(1), unit: 'period' as const, amount, currency: mode.amount.currency }));

const priceRetainer = (input: ChargeInput, mode: Mode<'retainer'>): Pricing => {
  const overage = Math.max(0, input.basis.minutes - mode.includedMinutes);
  const currency = mode.periodAmount.currency;
  return Effect.gen(function* () {
    const base = yield* scaledOf(input, mode.periodAmount);
    if (overage === 0 || mode.overageRateCardId === undefined) return { quantity: whole(1), unit: 'period' as const, amount: base, currency };
    const rate = yield* timeRate(input, { rateCardId: mode.overageRateCardId, currency });
    return { quantity: whole(1), unit: 'period' as const, amount: Decimal.add(base, minutesAt(overage, rate.rate)), currency };
  });
};

const priceUnitPrice = (input: ChargeInput, mode: Mode<'unit-price'>): Pricing =>
  Effect.map(need(input, input.basis.units, 'charge.units-missing', 'accepted units are required'), (units) => ({
    quantity: units,
    unit: 'value-unit' as const,
    amount: Decimal.multiply(Decimal.toScaled(units), Decimal.toScaled(mode.unitPrice)),
    currency: mode.currency,
  }));

/**
 * Baseline minutes = units × baseline per unit; dividend = max(0, baseline − actual);
 * billed minutes = baseline − dividend × recipient share; priced at the hourly rate.
 */
const priceValueBased = (input: ChargeInput, mode: Mode<'value-based'>): Pricing =>
  Effect.gen(function* () {
    const split = yield* need(input, input.leg.dividendAllocation, 'charge.dividend-missing', 'a value-based leg declares its dividend allocation');
    const units = yield* need(input, input.basis.units, 'charge.units-missing', 'accepted units are required');
    const baseline = Decimal.multiply(Decimal.toScaled(units), Decimal.toScaled(mode.baselineMinutesPerUnit));
    const actual = Decimal.fromInteger(input.basis.minutes);
    const dividend = baseline > actual ? Decimal.subtract(baseline, actual) : Decimal.fromInteger(0);
    const billed = Decimal.subtract(baseline, Decimal.multiply(dividend, bps(split.recipientShareBps)));
    return { quantity: units, unit: 'value-unit' as const, amount: Decimal.divideBy(Decimal.multiply(billed, Decimal.toScaled(mode.hourlyRate)), SIXTY), currency: mode.currency };
  });

const priceRevenueShare = (input: ChargeInput, mode: Mode<'revenue-share'>): Pricing =>
  Effect.gen(function* () {
    const revenue = yield* need(input, input.basis.revenue, 'charge.revenue-missing', 'revenue on the source work object is required');
    const base = yield* scaledOf(input, revenue);
    return { quantity: whole(1), unit: 'amount' as const, amount: Decimal.multiply(base, bps(mode.shareBps)), currency: revenue.currency };
  });

const pricePassThrough = (input: ChargeInput): Pricing =>
  Effect.gen(function* () {
    const disbursement = yield* need(input, input.basis.disbursement, 'charge.disbursement-missing', 'the disbursed amount is required');
    const amount = yield* scaledOf(input, disbursement);
    return { quantity: whole(1), unit: 'amount' as const, amount, currency: disbursement.currency };
  });

const priceNoCharge = (input: ChargeInput): Pricing => Effect.succeed({ quantity: whole(input.basis.minutes), unit: 'minute', amount: Decimal.fromInteger(0), currency: input.leg.invoiceCurrency });

const priceLeg = (input: ChargeInput): Pricing =>
  BillingMode.match(input.leg.billingMode, {
    'cost-reimbursement': (mode) => priceCostReimbursement(input, mode),
    'cost-plus': (mode) => priceCostPlus(input, mode),
    'time-and-materials': (mode) => priceTimeAndMaterials(input, mode),
    'fixed-fee': (mode) => priceFixedFee(input, mode),
    retainer: (mode) => priceRetainer(input, mode),
    'unit-price': (mode) => priceUnitPrice(input, mode),
    'value-based': (mode) => priceValueBased(input, mode),
    'revenue-share': (mode) => priceRevenueShare(input, mode),
    'pass-through-disbursement': () => pricePassThrough(input),
    'no-charge': () => priceNoCharge(input),
  });

const AT_COST_MODES: ReadonlySet<BillingModeTag> = new Set(['cost-reimbursement', 'pass-through-disbursement']);

const discountingClass = (basis: ChargeBasis): LeadTimeClass | undefined => (basis.leadTimeClass?.discountBps === 0 ? undefined : basis.leadTimeClass);

/** Step 1, last part: the lead-time class discount on the priced amount. */
const discountForLeadTime = (input: ChargeInput, priced: Priced): Pricing => {
  const leadTimeClass = discountingClass(input.basis);
  if (leadTimeClass === undefined) return Effect.succeed(priced);
  const tag = input.leg.billingMode._tag;
  if (AT_COST_MODES.has(tag)) return fail(input, 'charge.lead-time-discount-at-cost', `a ${tag} leg bills at cost and takes no lead-time discount`);
  return Effect.succeed({ ...priced, amount: Decimal.multiply(priced.amount, bps(10_000 - leadTimeClass.discountBps)) });
};

const translate = (input: ChargeInput, priced: Priced): Effect.Effect<Money.Money, ChargeComputationError> => {
  const target = input.leg.invoiceCurrency;
  if (priced.currency === target) return roundTo(input, { amount: priced.amount, currency: target });
  const fx = input.basis.fx;
  if (fx === undefined) return fail(input, 'charge.compute.fx-missing', `an FX snapshot is required to translate ${priced.currency} to ${target}`);
  const direction = fx.base === priced.currency && fx.quote === target ? 'forward' : fx.quote === priced.currency && fx.base === target ? 'reverse' : undefined;
  if (direction === undefined) return fail(input, 'charge.compute.fx-pair-mismatch', `snapshot ${fx.base}/${fx.quote} cannot translate ${priced.currency} to ${target}`);
  return convertScaled({ amount: priced.amount, currency: priced.currency, snapshot: fx, table: tableOf(input), direction, rounding: input.leg.rounding }).pipe(
    Effect.mapError((error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: String(error) })),
  );
};

const negativeMoney = (money: Money.Money | undefined): boolean => money !== undefined && Money.units(money) < 0n;

const rejectNegative = (input: ChargeInput): Effect.Effect<void, ChargeComputationError> => {
  const basis = input.basis;
  const negative =
    !Number.isSafeInteger(basis.minutes) ||
    basis.minutes < 0 ||
    (basis.units !== undefined && basis.units.startsWith('-')) ||
    (basis.rate !== undefined && basis.rate.rate.startsWith('-')) ||
    negativeMoney(basis.cost?.markupBase) ||
    negativeMoney(basis.cost?.passThrough) ||
    negativeMoney(basis.revenue) ||
    negativeMoney(basis.disbursement);
  return negative ? fail(input, 'charge.negative-input', 'minutes, units, rates, cost, revenue and disbursements are non-negative; credits are separate charge lines') : Effect.void;
};

const TP_DOCUMENTED_MODES: ReadonlySet<BillingModeTag> = new Set(['cost-plus', 'value-based']);

const dispositionOf = (leg: TransferLeg): Disposition => {
  if (leg.relatedParty.status === 'undetermined')
    return { _tag: 'hold', reasonCode: 'charge.related-party-undetermined', message: 'related-party status is undetermined; ownership and control evidence is required before invoicing' };
  if (leg.relatedParty.status === 'associated' && TP_DOCUMENTED_MODES.has(leg.billingMode._tag) && leg.tpDocumentation === undefined)
    return { _tag: 'hold', reasonCode: 'charge.tp-documentation-missing', message: `an associated ${leg.billingMode._tag} leg cites transfer-pricing documentation` };
  return { _tag: 'accrue' };
};

const roundTo = (input: ChargeInput, options: { readonly amount: Decimal.Scaled; readonly currency: CurrencyCode }): Effect.Effect<Money.Money, ChargeComputationError> =>
  Effect.mapError(
    Money.fromScaledAmount({ amount: options.amount, currency: options.currency, table: tableOf(input), rounding: input.leg.rounding }),
    (error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: `${error.code} is not in ${error.edition}` }),
  );

const costBaseOf = (mode: BillingMode): CostBaseRef | undefined => (mode._tag === 'cost-plus' || mode._tag === 'cost-reimbursement' ? mode.costBase : undefined);

/**
 * Compute one leg's charge. Pure: no services, no clock, no FX resolution.
 *
 * @since 0.1.0
 * @category computation
 */
export const computeCharge = (input: ChargeInput): Effect.Effect<ChargeComputation, ChargeComputationError> =>
  Effect.gen(function* () {
    yield* rejectNegative(input);
    const priced = yield* Effect.flatMap(priceLeg(input), (undiscounted) => discountForLeadTime(input, undiscounted));
    const amount = yield* translate(input, priced);
    const providerAmount = yield* roundTo(input, { amount: priced.amount, currency: priced.currency });
    const costBase = costBaseOf(input.leg.billingMode);
    const fx = priced.currency === input.leg.invoiceCurrency ? undefined : input.basis.fx;
    const discount = discountingClass(input.basis);
    return {
      legId: input.leg.id,
      billingModeTag: input.leg.billingMode._tag,
      quantity: priced.quantity,
      unit: priced.unit,
      priced: { amount: Decimal.fromScaled(priced.amount), currency: priced.currency },
      providerAmount,
      amount,
      ...(fx === undefined ? {} : { fx }),
      ...(costBase === undefined ? {} : { costBase }),
      ...(discount === undefined ? {} : { leadTimeDiscount: { classKey: discount.key, discountBps: discount.discountBps } }),
      disposition: dispositionOf(input.leg),
    };
  });
