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
import { convertScaled } from "../fx/Conversion.js";
import { Effect, Schema } from 'effect';
import { iso4217, minorUnits } from "../core/Currency.js";
import * as Decimal from "../core/Decimal.js";
import * as Money from "../core/Money.js";
import * as Exact from "../core/ExactRatio.js";
import { BillingMode } from "./BillingMode.js";
/**
 * Charge quantity units.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ChargeUnit = Schema.Literals(['minute', 'value-unit', 'period', 'amount']);
/**
 * Missing or inconsistent inputs. `code` is a stable issue code.
 *
 * @since 0.1.0
 * @category errors
 */
export class ChargeComputationError extends Schema.TaggedError()('ChargeComputationError', {
    legId: Schema.String,
    code: Schema.String,
    reason: Schema.String,
}) {
}
const fail = (input, code, reason) => Effect.fail(new ChargeComputationError({ legId: input.leg.id, code, reason }));
const tableOf = (input) => input.table ?? iso4217;
const whole = (value) => Decimal.fromScaled(Decimal.fromInteger(value));
const bps = (value) => Decimal.fromUnits(BigInt(value), 4);
const SIXTY = Decimal.fromInteger(60);
const scaledOf = (input, money) => Effect.mapError(Money.toScaledAmount(money, tableOf(input)), (error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: `${error.code} is not in ${error.edition}` }));
const need = (input, value, code, reason) => value === undefined ? fail(input, code, reason) : Effect.succeed(value);
const costFor = (input, costBase) => Effect.flatMap(need(input, input.basis.cost, 'charge.cost-missing', 'a cost-based leg needs a cost measurement'), (cost) => {
    if (cost.definitionId !== costBase.definitionId || cost.definitionDigest !== costBase.digest)
        return fail(input, 'charge.compute.cost-base-mismatch', 'the cost measurement cites a different cost-base definition or digest than the leg');
    if (cost.markupBase.currency !== cost.passThrough.currency)
        return fail(input, 'charge.cost-currency-mismatch', 'markup base and pass-through use the same currency');
    return Effect.succeed(cost);
});
const timeRate = (input, options) => Effect.flatMap(need(input, input.basis.rate, 'charge.rate-missing', 'an hourly rate is required'), (rate) => {
    if (rate.currency !== options.currency)
        return fail(input, 'charge.rate-currency-mismatch', `rate is in ${rate.currency}, the mode prices in ${options.currency}`);
    if (options.rateCardId !== undefined && rate.rateCardId !== options.rateCardId)
        return fail(input, 'charge.rate-card-mismatch', 'rate comes from another rate card');
    return Effect.succeed(rate);
});
const minutesAt = (minutes, rate) => Decimal.divideBy(Decimal.multiply(Decimal.fromInteger(minutes), Decimal.toScaled(rate)), SIXTY);
const priceCost = (input, options) => Effect.gen(function* () {
    const cost = yield* costFor(input, options.costBase);
    const base = yield* scaledOf(input, cost.markupBase);
    const passThrough = yield* scaledOf(input, cost.passThrough);
    return {
        quantity: whole(input.basis.minutes),
        unit: 'minute',
        amount: Decimal.add(Decimal.multiply(base, bps(10_000 + options.markupBps)), passThrough),
        currency: cost.markupBase.currency,
    };
});
const priceCostReimbursement = (input, mode) => priceCost(input, { costBase: mode.costBase, markupBps: 0 });
const priceCostPlus = (input, mode) => priceCost(input, { costBase: mode.costBase, markupBps: mode.markupBps });
/** The cap bounds this computation; a cap across periods is tracked by the issuer against prior charges. */
const priceTimeAndMaterials = (input, mode) => {
    const cap = mode.cap;
    if (cap !== undefined && cap.currency !== mode.currency)
        return fail(input, 'charge.cap-currency-mismatch', `cap is in ${cap.currency}, rates are in ${mode.currency}`);
    return Effect.gen(function* () {
        const rate = yield* timeRate(input, { rateCardId: mode.rateCardId, currency: mode.currency });
        const raw = minutesAt(input.basis.minutes, rate.rate);
        const capped = cap === undefined ? raw : yield* Effect.map(scaledOf(input, cap), (limit) => (raw > limit ? limit : raw));
        return { quantity: whole(input.basis.minutes), unit: 'minute', amount: capped, currency: mode.currency };
    });
};
const priceFixedFee = (input, mode) => Effect.map(scaledOf(input, mode.amount), (amount) => ({ quantity: whole(1), unit: 'period', amount, currency: mode.amount.currency }));
const priceRetainer = (input, mode) => {
    const overage = Math.max(0, input.basis.minutes - mode.includedMinutes);
    const currency = mode.periodAmount.currency;
    return Effect.gen(function* () {
        const base = yield* scaledOf(input, mode.periodAmount);
        if (overage === 0 || mode.overageRateCardId === undefined)
            return { quantity: whole(1), unit: 'period', amount: base, currency };
        const rate = yield* timeRate(input, { rateCardId: mode.overageRateCardId, currency });
        return { quantity: whole(1), unit: 'period', amount: Decimal.add(base, minutesAt(overage, rate.rate)), currency };
    });
};
const priceUnitPrice = (input, mode) => Effect.map(need(input, input.basis.units, 'charge.units-missing', 'accepted units are required'), (units) => ({
    quantity: units,
    unit: 'value-unit',
    amount: Decimal.multiply(Decimal.toScaled(units), Decimal.toScaled(mode.unitPrice)),
    currency: mode.currency,
}));
/**
 * Baseline minutes = units × baseline per unit; dividend = max(0, baseline − actual);
 * billed minutes = baseline − dividend × recipient share; priced at the hourly rate.
 */
const priceValueBased = (input, mode) => Effect.gen(function* () {
    const split = yield* need(input, input.leg.dividendAllocation, 'charge.dividend-missing', 'a value-based leg declares its dividend allocation');
    const units = yield* need(input, input.basis.units, 'charge.units-missing', 'accepted units are required');
    const baseline = Decimal.multiply(Decimal.toScaled(units), Decimal.toScaled(mode.baselineMinutesPerUnit));
    const actual = Decimal.fromInteger(input.basis.minutes);
    const dividend = baseline > actual ? Decimal.subtract(baseline, actual) : Decimal.fromInteger(0);
    const billed = Decimal.subtract(baseline, Decimal.multiply(dividend, bps(split.recipientShareBps)));
    return { quantity: units, unit: 'value-unit', amount: Decimal.divideBy(Decimal.multiply(billed, Decimal.toScaled(mode.hourlyRate)), SIXTY), currency: mode.currency };
});
const priceRevenueShare = (input, mode) => Effect.gen(function* () {
    const revenue = yield* need(input, input.basis.revenue, 'charge.revenue-missing', 'revenue on the source work object is required');
    const base = yield* scaledOf(input, revenue);
    return { quantity: whole(1), unit: 'amount', amount: Decimal.multiply(base, bps(mode.shareBps)), currency: revenue.currency };
});
const pricePassThrough = (input) => Effect.gen(function* () {
    const disbursement = yield* need(input, input.basis.disbursement, 'charge.disbursement-missing', 'the disbursed amount is required');
    const amount = yield* scaledOf(input, disbursement);
    return { quantity: whole(1), unit: 'amount', amount, currency: disbursement.currency };
});
const priceNoCharge = (input) => Effect.succeed({ quantity: whole(input.basis.minutes), unit: 'minute', amount: Decimal.fromInteger(0), currency: input.leg.invoiceCurrency });
const priceLeg = (input) => BillingMode.match(input.leg.billingMode, {
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
const AT_COST_MODES = new Set(['cost-reimbursement', 'pass-through-disbursement']);
const discountingClass = (basis) => (basis.leadTimeClass?.discountBps === 0 ? undefined : basis.leadTimeClass);
/** Step 1, last part: the lead-time class discount on the priced amount. */
const discountForLeadTime = (input, priced) => {
    const leadTimeClass = discountingClass(input.basis);
    if (leadTimeClass === undefined)
        return Effect.succeed(priced);
    const tag = input.leg.billingMode._tag;
    if (AT_COST_MODES.has(tag))
        return fail(input, 'charge.lead-time-discount-at-cost', `a ${tag} leg bills at cost and takes no lead-time discount`);
    return Effect.succeed({ ...priced, amount: Decimal.multiply(priced.amount, bps(10_000 - leadTimeClass.discountBps)) });
};
const translate = (input, priced) => {
    const target = input.leg.invoiceCurrency;
    if (priced.currency === target)
        return roundTo(input, { amount: priced.amount, currency: target });
    const fx = input.basis.fx;
    if (fx === undefined)
        return fail(input, 'charge.compute.fx-missing', `an FX snapshot is required to translate ${priced.currency} to ${target}`);
    const direction = fx.base === priced.currency && fx.quote === target ? 'forward' : fx.quote === priced.currency && fx.base === target ? 'reverse' : undefined;
    if (direction === undefined)
        return fail(input, 'charge.compute.fx-pair-mismatch', `snapshot ${fx.base}/${fx.quote} cannot translate ${priced.currency} to ${target}`);
    return convertScaled({ amount: priced.amount, currency: priced.currency, snapshot: fx, table: tableOf(input), direction, rounding: input.leg.rounding }).pipe(Effect.mapError((error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: String(error) })));
};
const negativeMoney = (money) => money !== undefined && Money.units(money) < 0n;
const negativeQuantity = (basis) => !Number.isSafeInteger(basis.minutes) || basis.minutes < 0 || (basis.units !== undefined && basis.units.startsWith('-')) || (basis.rate !== undefined && basis.rate.rate.startsWith('-'));
const negativeMoneyAmounts = (basis) => negativeMoney(basis.cost?.markupBase) || negativeMoney(basis.cost?.passThrough) || negativeMoney(basis.revenue) || negativeMoney(basis.disbursement);
const rejectNegative = (input) => {
    const basis = input.basis;
    const negative = negativeQuantity(basis) || negativeMoneyAmounts(basis);
    return negative ? fail(input, 'charge.negative-input', 'minutes, units, rates, cost, revenue and disbursements are non-negative; credits are separate charge lines') : Effect.void;
};
const TP_DOCUMENTED_MODES = new Set(['cost-plus', 'value-based']);
const dispositionOf = (leg) => {
    if (leg.relatedParty.status === 'undetermined')
        return { _tag: 'hold', reasonCode: 'charge.related-party-undetermined', message: 'related-party status is undetermined; ownership and control evidence is required before invoicing' };
    if (leg.relatedParty.status === 'associated' && TP_DOCUMENTED_MODES.has(leg.billingMode._tag) && leg.tpDocumentation === undefined)
        return { _tag: 'hold', reasonCode: 'charge.tp-documentation-missing', message: `an associated ${leg.billingMode._tag} leg cites transfer-pricing documentation` };
    return { _tag: 'accrue' };
};
const roundTo = (input, options) => Effect.mapError(Money.fromScaledAmount({ amount: options.amount, currency: options.currency, table: tableOf(input), rounding: input.leg.rounding }), (error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: `${error.code} is not in ${error.edition}` }));
const costBaseOf = (mode) => (mode._tag === 'cost-plus' || mode._tag === 'cost-reimbursement' ? mode.costBase : undefined);
/**
 * Compute one leg's charge. Pure: no services, no clock, no FX resolution.
 *
 * @since 0.1.0
 * @category computation
 */
export const computeCharge = (input) => Effect.gen(function* () {
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
const ratioMoney = (input, amount, currency) => Effect.gen(function* () {
    const digits = yield* minorUnits(tableOf(input), currency).pipe(Effect.mapError((error) => new ChargeComputationError({ legId: input.leg.id, code: 'charge.unknown-currency', reason: `${error.code} is not in ${error.edition}` })));
    const units = yield* Exact.toUnits(amount, { digits, rounding: input.leg.rounding }).pipe(Effect.mapError((error) => exactFault(input, error)));
    return Money.make(units, currency);
});
const exactFault = (input, error) => new ChargeComputationError({ legId: input.leg.id, code: `charge.exact.${error.code}`, reason: `exact arithmetic failed in ${error.operation}` });
const exactFxProduct = (snapshot) => Effect.reduce(snapshot.legs, () => Exact.ONE, (product, leg) => Effect.gen(function* () {
    if (!Number.isSafeInteger(leg.unit) || leg.unit <= 0 || (leg.orientation !== 'multiply' && leg.orientation !== 'divide'))
        return yield* Effect.fail(new Exact.ExactRatioError({ code: 'invalid-input', operation: 'FX leg' }));
    const rate = yield* Exact.fromDecimal(leg.rate);
    if (BigInt(rate.numerator) <= 0n)
        return yield* Effect.fail(new Exact.ExactRatioError({ code: 'invalid-input', operation: 'FX rate' }));
    const unit = yield* Exact.fromParts(BigInt(leg.unit), 1n);
    const perUnit = yield* Exact.divide(rate, unit);
    const oriented = leg.orientation === 'multiply' ? perUnit : yield* Exact.inverse(perUnit);
    return yield* Exact.multiply(product, oriented);
}));
/**
 * Compute a unit-price charge without intermediate Decimal rounding. Exact
 * product, discount and FX remain rational. Other billing modes fail explicitly.
 * @since 0.44.12 @category computation
 */
export const computeExactUnitPriceCharge = Effect.fnUntraced(function* (input) {
    yield* rejectNegative(input);
    const mode = input.leg.billingMode;
    if (mode._tag !== 'unit-price')
        return yield* fail(input, 'charge.exact.billing-mode', 'the exact unit-price profile requires a unit-price leg');
    if (mode.unitPrice.startsWith('-'))
        return yield* fail(input, 'charge.negative-input', 'unit price is non-negative; credits are separate charge lines');
    const units = yield* need(input, input.basis.units, 'charge.units-missing', 'accepted units are required');
    const program = Effect.gen(function* () {
        const quantity = yield* Exact.fromDecimal(units);
        const unitPrice = yield* Exact.fromDecimal(mode.unitPrice);
        let priced = yield* Exact.multiply(quantity, unitPrice);
        const discount = discountingClass(input.basis);
        if (discount !== undefined) {
            if (!Number.isSafeInteger(discount.discountBps) || discount.discountBps < 0 || discount.discountBps > 10_000)
                return yield* Effect.fail(new Exact.ExactRatioError({ code: 'invalid-input', operation: 'lead-time discount' }));
            priced = yield* Exact.multiply(priced, yield* Exact.fromParts(BigInt(10_000 - discount.discountBps), 10000n));
        }
        return { priced, discount };
    });
    const { priced, discount } = yield* program.pipe(Effect.mapError((error) => exactFault(input, error)));
    const providerAmount = yield* ratioMoney(input, priced, mode.currency);
    const target = input.leg.invoiceCurrency;
    let translated = priced;
    const fx = mode.currency === target ? undefined : input.basis.fx;
    if (mode.currency !== target) {
        if (fx === undefined)
            return yield* fail(input, 'charge.compute.fx-missing', `an FX snapshot is required to translate ${mode.currency} to ${target}`);
        const forward = fx.base === mode.currency && fx.quote === target;
        const reverse = fx.quote === mode.currency && fx.base === target;
        if (!forward && !reverse)
            return yield* fail(input, 'charge.compute.fx-pair-mismatch', `snapshot ${fx.base}/${fx.quote} cannot translate ${mode.currency} to ${target}`);
        const conversion = Effect.gen(function* () {
            const product = yield* exactFxProduct(fx);
            return yield* Exact.multiply(priced, forward ? product : yield* Exact.inverse(product));
        });
        translated = yield* conversion.pipe(Effect.mapError((error) => exactFault(input, error)));
    }
    const amount = yield* ratioMoney(input, translated, target);
    return {
        computationProfile: 'exact-unit-price/1',
        legId: input.leg.id,
        billingModeTag: 'unit-price',
        quantity: units,
        unit: 'value-unit',
        priced: { amount: priced, currency: mode.currency },
        providerAmount,
        amount,
        ...(fx === undefined ? {} : { fx }),
        ...(discount === undefined ? {} : { leadTimeDiscount: { classKey: discount.key, discountBps: discount.discountBps } }),
        disposition: dispositionOf(input.leg),
    };
});
//# sourceMappingURL=Charge.js.map