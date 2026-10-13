/**
 * Period-end revaluation of open intercompany (or third-party) receivables and
 * payables, and realized gain or loss on settlement (ASC 830-20-35-1, 830-20-40;
 * IAS 21 ¶23, ¶28).
 *
 * Balances flagged `longTermInvestment` (settlement neither planned nor
 * anticipated in the foreseeable future) keep their differences in profit or
 * loss in the entity's separate statements but report them in CTA/OCI on
 * consolidation (ASC 830-20-35-3(b); IAS 21 ¶32, ¶45). The flag is an input:
 * this package does not determine it.
 *
 * Signs: debit positive. A receivable is positive, a payable negative. A
 * positive `gainLoss` is a gain.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';

import type { Sha256 } from '../core/CanonicalJson.ts';
import type { CurrencyCode, CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { CurrencyMismatch, make, subtract, units, type Money } from '../core/Money.ts';
import { divide } from '../core/Rounding.ts';

import { convert, convertTo } from './Conversion.ts';
import { SettlementExceedsBalance } from './FxError.ts';
import type { FxSnapshot } from './FxSnapshot.ts';

/**
 * Revaluation bookkeeping method.
 * - `cumulative-adjust`: adjust from the current carrying amount; no reversal.
 * - `reverse-and-rebook`: adjust from the historical booked amount and auto-reverse at the start of the next period.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RevaluationMethod = Schema.Literals(['cumulative-adjust', 'reverse-and-rebook']);
/** @since 0.1.0 @category models */
export type RevaluationMethod = typeof RevaluationMethod.Type;

/**
 * Where a difference is reported.
 *
 * @since 0.1.0
 * @category models
 */
export type FxRole = 'pnl-unrealized' | 'pnl-realized' | 'oci-cta';

/**
 * An open balance in a transaction currency, carried in the functional currency.
 *
 * @since 0.1.0
 * @category models
 */
export interface OpenBalance {
  readonly id: string;
  readonly side: 'receivable' | 'payable';
  readonly amount: Money;
  /** Current functional carrying amount (after prior revaluations). */
  readonly carrying: Money;
  /** Functional amount originally booked. */
  readonly historical: Money;
  readonly longTermInvestment: boolean;
}

/**
 * One unrealized revaluation entry. `adjustment` is the debit to the balance
 * account; `gainLoss` (same value) is the credit-side gain, positive = gain.
 *
 * @since 0.1.0
 * @category models
 */
export interface RevaluationEntry {
  readonly balanceId: string;
  readonly method: RevaluationMethod;
  readonly revalued: Money;
  readonly adjustment: Money;
  readonly gainLoss: Money;
  readonly separateStatementsRole: 'pnl-unrealized';
  readonly consolidatedRole: 'pnl-unrealized' | 'oci-cta';
  readonly autoReverse: boolean;
  readonly snapshotDigest?: Sha256 | undefined;
}

/**
 * Revaluation output.
 *
 * @since 0.1.0
 * @category models
 */
export interface RevaluationResult {
  readonly entries: ReadonlyArray<RevaluationEntry>;
  readonly issues: ReadonlyArray<ValidationIssue>;
}

const signIssue = (balance: OpenBalance): ValidationIssue | undefined => {
  const value = units(balance.amount);
  const wrong = balance.side === 'receivable' ? value < 0n : value > 0n;
  return wrong ? issue('fx.revalue.side-sign-mismatch', 'error', balance.id, `a ${balance.side} must be ${balance.side === 'receivable' ? 'a debit' : 'a credit'}`) : undefined;
};

type EntryOrIssue = { readonly entry: RevaluationEntry } | { readonly issue: ValidationIssue };

const revalueOne = (
  balance: OpenBalance,
  options: { readonly functional: CurrencyCode; readonly closing: ReadonlyArray<FxSnapshot>; readonly method: RevaluationMethod; readonly table: CurrencyTableShape },
): Effect.Effect<EntryOrIssue, CurrencyMismatch | UnknownCurrency> =>
  Effect.gen(function* () {
    const sign = signIssue(balance);
    if (sign !== undefined) return { issue: sign };
    const converted = yield* convertTo({ amount: balance.amount, to: options.functional, snapshots: options.closing, table: options.table });
    if (converted === undefined) return { issue: issue('fx.revalue.snapshot-missing', 'hold', balance.id, `no closing snapshot for ${balance.amount.currency}→${options.functional}`) };
    const reverse = options.method === 'reverse-and-rebook';
    const adjustment = yield* subtract(converted.amount, reverse ? balance.historical : balance.carrying);
    return {
      entry: {
        balanceId: balance.id,
        method: options.method,
        revalued: converted.amount,
        adjustment,
        gainLoss: adjustment,
        separateStatementsRole: 'pnl-unrealized',
        consolidatedRole: balance.longTermInvestment ? 'oci-cta' : 'pnl-unrealized',
        autoReverse: reverse,
        snapshotDigest: converted.snapshotDigest,
      },
    };
  });

/**
 * Revalue open balances at closing snapshots.
 *
 * Issue codes: `fx.revalue.side-sign-mismatch` (error), `fx.revalue.snapshot-missing` (hold).
 *
 * @since 0.1.0
 * @category accounting
 */
export const revalueOpenBalances = (options: {
  readonly balances: ReadonlyArray<OpenBalance>;
  readonly functional: CurrencyCode;
  readonly closing: ReadonlyArray<FxSnapshot>;
  readonly method: RevaluationMethod;
  readonly table: CurrencyTableShape;
}): Effect.Effect<RevaluationResult, CurrencyMismatch | UnknownCurrency> =>
  Effect.map(
    Effect.forEach(options.balances, (balance) => revalueOne(balance, options), { concurrency: 1 }),
    (outcomes) => ({
      entries: outcomes.flatMap((outcome) => ('entry' in outcome ? [outcome.entry] : [])),
      issues: outcomes.flatMap((outcome) => ('issue' in outcome ? [outcome.issue] : [])),
    }),
  );

/**
 * Realized result of settling (all or part of) a balance.
 *
 * @since 0.1.0
 * @category models
 */
export interface Settlement {
  readonly balanceId: string;
  /** Functional amount of the settled portion at the settlement snapshot. */
  readonly settledFunctional: Money;
  /** Carrying amount relieved for the settled portion. */
  readonly carryingRelieved: Money;
  /** Positive = gain. */
  readonly realized: Money;
  readonly role: 'pnl-realized';
  readonly snapshotDigest: Sha256;
  readonly issues: ReadonlyArray<ValidationIssue>;
}

const settlementMagnitude = (part: bigint, whole: bigint, balance: OpenBalance): Effect.Effect<bigint, SettlementExceedsBalance> => {
  const magnitude = whole < 0n ? -whole : whole;
  if (whole === 0n || part * whole < 0n || (part < 0n ? -part : part) > magnitude) return Effect.fail(new SettlementExceedsBalance({ balanceId: balance.id }));
  return Effect.succeed(magnitude);
};

/**
 * Settle a balance (or `portion` of it, same currency and sign) at `snapshot`.
 * Realized = functional amount settled − carrying amount relieved.
 *
 * Fails with `SettlementExceedsBalance` when the portion has the wrong sign or exceeds the balance.
 * Issue code: `fx.settle.long-term-balance-settled` (warning: review the long-term designation).
 *
 * @since 0.1.0
 * @category accounting
 */
export const settle = (options: {
  readonly balance: OpenBalance;
  readonly snapshot: FxSnapshot;
  readonly table: CurrencyTableShape;
  readonly portion?: Money | undefined;
}): Effect.Effect<Settlement, CurrencyMismatch | UnknownCurrency | SettlementExceedsBalance> =>
  Effect.gen(function* () {
    const { balance, snapshot } = options;
    const portion = options.portion ?? balance.amount;
    if (portion.currency !== balance.amount.currency) return yield* Effect.fail(new CurrencyMismatch({ left: portion.currency, right: balance.amount.currency }));
    const [part, whole] = [units(portion), units(balance.amount)];
    const magnitude = yield* settlementMagnitude(part, whole, balance);
    const direction = snapshot.base === portion.currency ? 'forward' : 'reverse';
    const settledFunctional = yield* convert({ amount: portion, snapshot, table: options.table, direction });
    // Pro-rata carrying amount; the sign of `whole` is moved to the numerator because `divide` needs a positive divisor.
    const carryingRelieved = make(divide(units(balance.carrying) * part * (whole < 0n ? -1n : 1n), magnitude, snapshot.rounding), balance.carrying.currency);
    const realized = yield* subtract(settledFunctional, carryingRelieved);
    const issues = balance.longTermInvestment ? [issue('fx.settle.long-term-balance-settled', 'warning', balance.id, 'a long-term-investment balance is being settled; review its designation')] : [];
    return { balanceId: balance.id, settledFunctional, carryingRelieved, realized, role: 'pnl-realized', snapshotDigest: snapshot.digest, issues };
  });
