/**
 * Translate a functional-currency trial balance into a presentation currency
 * (ASC 830-30-45-3; IAS 21 ¶39).
 *
 * Assets and liabilities translate at the closing rate, income and expense at
 * the average rate (or a per-line transaction-date snapshot), and equity at
 * historical amounts the caller supplies. The difference is the cumulative
 * translation adjustment (CTA) in other comprehensive income. CTA is computed
 * only from a balanced input with every line translated: an unbalanced trial
 * balance or a missing rate holds rather than letting CTA absorb it.
 * Each line rounds once; per-line rounding differences are part of CTA.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';

import type { Sha256 } from '../core/CanonicalJson.ts';
import type { CurrencyCode, CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { CurrencyMismatch, negate, sum, type Money } from '../core/Money.ts';

import { convertTo } from './Conversion.ts';
import { HyperinflationaryUnsupported } from './FxError.ts';
import type { FxSnapshot } from './FxSnapshot.ts';

/**
 * Trial-balance class of a line.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BalanceClass = Schema.Literals(['asset', 'liability', 'equity', 'income', 'expense']);
/** @since 0.1.0 @category models */
export type BalanceClass = typeof BalanceClass.Type;

/**
 * A functional-currency line (debit positive).
 *
 * @since 0.1.0
 * @category models
 */
export interface TranslateLine {
  readonly id: string;
  readonly balanceClass: BalanceClass;
  readonly amount: Money;
  /** Equity: the historical presentation-currency amount (required). */
  readonly historical?: Money | undefined;
  /** Income/expense: a transaction-date snapshot that overrides the average. */
  readonly snapshot?: FxSnapshot | undefined;
}

/**
 * Basis used for a translated line.
 *
 * @since 0.1.0
 * @category models
 */
export type TranslationBasis = 'closing' | 'average' | 'historical' | 'line-snapshot';

/**
 * A translated line.
 *
 * @since 0.1.0
 * @category models
 */
export interface TranslatedLine {
  readonly id: string;
  readonly balanceClass: BalanceClass;
  readonly basis: TranslationBasis;
  readonly amount: Money;
  readonly snapshotDigest?: Sha256 | undefined;
}

/**
 * Translation output. `cta` is the debit to CTA (OCI) that balances the
 * translated trial balance; absent while any hold or error is open.
 *
 * @since 0.1.0
 * @category models
 */
export interface TranslationResult {
  readonly lines: ReadonlyArray<TranslatedLine>;
  readonly cta?: Money | undefined;
  readonly issues: ReadonlyArray<ValidationIssue>;
}

interface Rates {
  readonly presentation: CurrencyCode;
  readonly closing: FxSnapshot;
  readonly average: FxSnapshot;
  readonly table: CurrencyTableShape;
}

type LineOrIssue = { readonly line: TranslatedLine } | { readonly issue: ValidationIssue };

const basisOf = (line: TranslateLine): TranslationBasis => {
  if (line.balanceClass === 'equity') return 'historical';
  if (line.balanceClass === 'asset' || line.balanceClass === 'liability') return 'closing';
  return line.snapshot === undefined ? 'average' : 'line-snapshot';
};

const snapshotFor = (line: TranslateLine, basis: TranslationBasis, rates: Rates): FxSnapshot | undefined => {
  if (basis === 'closing') return rates.closing;
  if (basis === 'average') return rates.average;
  return line.snapshot;
};

const translateOne = (line: TranslateLine, rates: Rates): Effect.Effect<LineOrIssue, CurrencyMismatch | UnknownCurrency> =>
  Effect.gen(function* () {
    const basis = basisOf(line);
    if (basis === 'historical') {
      if (line.historical === undefined) return { issue: issue('fx.translate.equity-historical-missing', 'hold', line.id, 'equity needs its historical presentation amount') };
      if (line.historical.currency !== rates.presentation) return yield* Effect.fail(new CurrencyMismatch({ left: line.historical.currency, right: rates.presentation }));
      return { line: { id: line.id, balanceClass: line.balanceClass, basis, amount: line.historical } };
    }
    const snapshot = snapshotFor(line, basis, rates);
    const converted = yield* convertTo({ amount: line.amount, to: rates.presentation, snapshots: snapshot === undefined ? [] : [snapshot], table: rates.table });
    if (converted === undefined) return { issue: issue('fx.translate.snapshot-missing', 'hold', line.id, `no ${basis} snapshot for ${line.amount.currency}→${rates.presentation}`) };
    return { line: { id: line.id, balanceClass: line.balanceClass, basis, amount: converted.amount, snapshotDigest: converted.snapshotDigest } };
  });

/**
 * Translate a trial balance.
 *
 * Issue codes: `fx.translate.unbalanced-input` (error), `fx.translate.equity-historical-missing` (hold),
 * `fx.translate.snapshot-missing` (hold).
 *
 * @since 0.1.0
 * @category accounting
 */
export const translate = (options: {
  readonly lines: ReadonlyArray<TranslateLine>;
  readonly functional: CurrencyCode;
  readonly rates: Rates;
  /** Hyperinflationary functional currencies are refused (ASC 830-10-45-11; IAS 29). */
  readonly hyperinflationary?: boolean | undefined;
}): Effect.Effect<TranslationResult, CurrencyMismatch | UnknownCurrency | HyperinflationaryUnsupported> =>
  Effect.gen(function* () {
    if (options.hyperinflationary === true) return yield* Effect.fail(new HyperinflationaryUnsupported({ currency: options.functional }));
    const functionalTotal = yield* sum(
      options.functional,
      options.lines.map((line) => line.amount),
    );
    const balanceIssue = functionalTotal.minor === '0' ? [] : [issue('fx.translate.unbalanced-input', 'error', options.functional, `trial balance is out by ${functionalTotal.minor} minor units`)];
    const outcomes = yield* Effect.forEach(options.lines, (line) => translateOne(line, options.rates), { concurrency: 1 });
    const lines = outcomes.flatMap((outcome) => ('line' in outcome ? [outcome.line] : []));
    const issues = [...balanceIssue, ...outcomes.flatMap((outcome) => ('issue' in outcome ? [outcome.issue] : []))];
    if (issues.length > 0) return { lines, issues };
    const translatedTotal = yield* sum(
      options.rates.presentation,
      lines.map((line) => line.amount),
    );
    return { lines, cta: negate(translatedTotal), issues };
  });
