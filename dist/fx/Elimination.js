/**
 * Intercompany elimination across functional currencies (ASC 810-10-45-1;
 * IFRS 10 ¶B86).
 *
 * Two matched sides (a receivable in one entity, the mirror payable in another)
 * are translated into the presentation currency and eliminated. When the
 * sides translate at different rates or were booked at different dates, the
 * translated amounts do not cancel; the residual is reported as an FX
 * difference with its role (profit or loss, or CTA for long-term-investment
 * balances), never plugged. A residual is only called FX when both sides
 * agree in transaction currency; otherwise the pair holds as a mismatch.
 *
 * @since 0.1.0
 * @module
 */
import { Effect } from 'effect';
import { issue } from "../core/Issue.js";
import { add, negate, units } from "../core/Money.js";
import { convertTo } from "./Conversion.js";
const transactionIssues = (matchKey, receivable, payable) => {
    if (receivable.transactionAmount.currency !== payable.transactionAmount.currency) {
        return [issue('fx.eliminate.transaction-currency-differs', 'hold', matchKey, 'the two sides record different transaction currencies')];
    }
    if (units(receivable.transactionAmount) + units(payable.transactionAmount) !== 0n) {
        return [issue('fx.eliminate.transaction-amounts-differ', 'hold', matchKey, 'transaction-currency amounts do not mirror; reconcile before eliminating')];
    }
    return units(receivable.transactionAmount) > 0n ? [] : [issue('fx.eliminate.receivable-not-debit', 'error', matchKey, 'the receivable side must be a debit')];
};
const sideLine = (side, options) => Effect.map(convertTo({ amount: side.functionalAmount, to: options.presentation, snapshots: options.snapshots, table: options.table }), (converted) => converted === undefined
    ? issue('fx.eliminate.snapshot-missing', 'hold', options.matchKey, `no presentation snapshot for ${side.functionalAmount.currency}→${options.presentation}`)
    : { entity: side.entity, translated: converted.amount, elimination: negate(converted.amount), snapshotDigest: converted.snapshotDigest });
/**
 * Eliminate a matched pair and report the residual FX difference.
 *
 * Issue codes: `fx.eliminate.transaction-currency-differs` (hold), `fx.eliminate.transaction-amounts-differ` (hold),
 * `fx.eliminate.receivable-not-debit` (error), `fx.eliminate.snapshot-missing` (hold).
 *
 * @since 0.1.0
 * @category accounting
 */
export const eliminate = (options) => Effect.gen(function* () {
    const { receivable, payable, longTermInvestment } = options.pair;
    const context = { presentation: options.presentation.currency, snapshots: options.presentation.snapshots, table: options.table, matchKey: options.matchKey };
    const sides = yield* Effect.forEach([receivable, payable], (side) => sideLine(side, context), { concurrency: 1 });
    const lines = sides.filter((entry) => 'entity' in entry);
    const issues = [...transactionIssues(options.matchKey, receivable, payable), ...sides.filter((entry) => 'code' in entry)];
    const [first, second] = lines;
    if (issues.length > 0 || first === undefined || second === undefined)
        return { matchKey: options.matchKey, lines, issues };
    const fxDifference = yield* add(first.translated, second.translated);
    return { matchKey: options.matchKey, lines, fxDifference, fxDifferenceRole: longTermInvestment ? 'oci-cta' : 'pnl', issues };
});
//# sourceMappingURL=Elimination.js.map