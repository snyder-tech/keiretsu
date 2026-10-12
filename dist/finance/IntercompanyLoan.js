/**
 * Intercompany loans: daily interest accrual and safe-harbour flags.
 *
 * Interest accrues on the end-of-day balance at the rate in effect, using the
 * facility's day-count convention, summed exactly and rounded once. Floating
 * rates need a rate reset on or before each accrual day; without one the
 * accrual fails rather than guessing. Safe-harbour bands (e.g. 100–130% of
 * the US applicable federal rate, Treas. Reg. §1.482-2(a)(2)(iii)(B)) produce
 * flags only.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';
import { CurrencyCode } from "../core/Currency.js";
import * as Decimal from "../core/Decimal.js";
import { brand } from "../core/Id.js";
import { AgreementId, EntityId } from "../core/Ids.js";
import { issue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { IsoDate } from "../core/Temporal.js";
/** @since 0.1.0 @category schemas */
export const LoanId = brand('keiretsu/IntercompanyLoanId');
/**
 * Day-count convention. `30/360` is the US (bond basis) variant.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DayCount = Schema.Literals(['act/365f', 'act/360', '30/360']);
/**
 * Loan facility.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IntercompanyLoan = Schema.Struct({
    id: LoanId,
    lender: EntityId,
    borrower: EntityId,
    agreementId: Schema.optional(AgreementId),
    currency: CurrencyCode,
    limit: Money.Money,
    rate: Schema.TaggedUnion({
        fixed: { annualRate: Decimal.Decimal },
        floating: { index: Schema.NonEmptyString, spread: Decimal.Decimal },
    }),
    dayCount: DayCount,
    startDate: IsoDate,
    maturity: Schema.optional(IsoDate),
    subordinated: Schema.Boolean,
}).check(Schema.makeFilter((loan) => (loan.lender === loan.borrower ? 'loan.same-party: lender and borrower differ' : undefined)), Schema.makeFilter((loan) => (loan.limit.currency === loan.currency ? undefined : 'loan.currency: limit is in the loan currency')));
/**
 * Loan event. A floating-rate reset carries the index fixing; the spread is added.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LoanEvent = Schema.TaggedUnion({
    advance: { date: IsoDate, amount: Money.Money },
    repayment: { date: IsoDate, amount: Money.Money },
    'rate-reset': { date: IsoDate, indexRate: Decimal.Decimal },
});
/**
 * No rate is in effect on an accrual day.
 *
 * @since 0.1.0
 * @category errors
 */
export class LoanRateMissing extends Data.TaggedError('LoanRateMissing') {
}
const dayNumber = (date) => Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) / 86_400_000;
/**
 * Days between two dates under a convention (`from` inclusive, `to` exclusive).
 *
 * @since 0.1.0
 * @category math
 */
export const daysBetween = (from, to, convention) => {
    if (convention !== '30/360')
        return dayNumber(to) - dayNumber(from);
    const [y1, m1, rawD1] = [Number(from.slice(0, 4)), Number(from.slice(5, 7)), Number(from.slice(8, 10))];
    const [y2, m2, rawD2] = [Number(to.slice(0, 4)), Number(to.slice(5, 7)), Number(to.slice(8, 10))];
    const d1 = Math.min(rawD1, 30);
    const d2 = d1 === 30 ? Math.min(rawD2, 30) : rawD2;
    return 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1);
};
const YEAR_BASIS = { 'act/365f': 365, 'act/360': 360, '30/360': 360 };
const rateOn = (loan, events, date) => {
    if (loan.rate._tag === 'fixed')
        return Effect.succeed(Decimal.toScaled(loan.rate.annualRate));
    const spread = Decimal.toScaled(loan.rate.spread);
    const resets = events.filter((event) => event._tag === 'rate-reset' && event.date <= date).sort((left, right) => (left.date < right.date ? -1 : 1));
    const latest = resets[resets.length - 1];
    return latest?._tag === 'rate-reset' ? Effect.succeed(Decimal.add(Decimal.toScaled(latest.indexRate), spread)) : Effect.fail(new LoanRateMissing({ date }));
};
const balanceOn = (events, date) => events.reduce((sum, event) => {
    if (event._tag === 'rate-reset' || event.date > date)
        return sum;
    return event._tag === 'advance' ? sum + Money.units(event.amount) : sum - Money.units(event.amount);
}, 0n);
/**
 * Accrue interest over `[from, to)`.
 *
 * Issue codes: `loan.over-limit` (warning), `loan.negative-balance` (error), `loan.event-currency` (error).
 *
 * @since 0.1.0
 * @category accrual
 */
export const accrueInterest = (options) => Effect.gen(function* () {
    const { loan, events } = options;
    const { from, to } = options.period;
    const issues = [];
    for (const event of events) {
        if (event._tag !== 'rate-reset' && event.amount.currency !== loan.currency)
            issues.push(issue('loan.event-currency', 'error', loan.id, `${event._tag} on ${event.date} is in ${event.amount.currency}`));
    }
    const boundaries = [...new Set([from, to, ...events.map((event) => event.date).filter((date) => date > from && date < to)])].sort();
    const segments = [];
    let total = Decimal.fromInteger(0);
    const basis = Decimal.fromInteger(YEAR_BASIS[loan.dayCount]);
    for (let index = 0; index + 1 < boundaries.length; index += 1) {
        // SAFETY: index + 1 < boundaries.length, so both elements exist.
        const [start, end] = [boundaries[index], boundaries[index + 1]];
        const balanceUnits = balanceOn(events, start);
        if (balanceUnits < 0n)
            issues.push(issue('loan.negative-balance', 'error', loan.id, `balance below zero on ${start}`));
        if (balanceUnits > Money.units(loan.limit))
            issues.push(issue('loan.over-limit', 'warning', loan.id, `balance above the facility limit on ${start}`));
        const balance = Money.make(balanceUnits, loan.currency);
        const rate = yield* rateOn(loan, events, start);
        const days = daysBetween(start, end, loan.dayCount);
        const scaledBalance = yield* Money.toScaledAmount(balance, options.money.table);
        total = Decimal.add(total, Decimal.divideBy(Decimal.multiply(Decimal.multiply(scaledBalance, rate), Decimal.fromInteger(days)), basis));
        segments.push({ from: start, to: end, days, balance, annualRate: Decimal.fromScaled(rate) });
    }
    const interest = yield* Money.fromScaledAmount({ amount: total, currency: loan.currency, table: options.money.table, rounding: options.money.rounding });
    return { interest, segments, issues };
});
/**
 * A safe-harbour rate band from a cited, versioned data pack.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SafeHarbourBand = Schema.Struct({
    low: Decimal.Decimal,
    high: Decimal.Decimal,
    citation: Schema.NonEmptyString,
    status: Schema.Literals(['needs-verification', 'verified']),
});
/**
 * The 100–130% of AFR band for a given AFR (status `needs-verification`).
 *
 * @since 0.1.0
 * @category constructors
 */
export const afrBand = (afr) => ({
    low: afr,
    high: Decimal.fromScaled(Decimal.multiply(Decimal.toScaled(afr), Decimal.toScaled('1.3'))),
    citation: 'Treas. Reg. §1.482-2(a)(2)(iii)(B); IRC §1274(d)',
    status: 'needs-verification',
});
/**
 * Flag a rate outside a band. Code: `loan.outside-safe-harbour` (warning).
 *
 * @since 0.1.0
 * @category checks
 */
export const safeHarbourCheck = (rate, band) => {
    const value = Decimal.toScaled(rate);
    return value < Decimal.toScaled(band.low) || value > Decimal.toScaled(band.high)
        ? [issue('loan.outside-safe-harbour', 'warning', 'rate', `rate ${rate} outside ${band.low}–${band.high} (${band.citation}); professional review`)]
        : [];
};
//# sourceMappingURL=IntercompanyLoan.js.map