/**
 * Ledger-agnostic journal entries.
 *
 * Lines carry **account roles** (`ic-receivable`, `labor-cogs`, `revenue`…),
 * never provider accounts; a per-entity {@link ChartMapping} resolves roles at
 * render time. Every entry balances per currency and cites the derivation
 * that produced it. Revenue roles are credited only by entries that cite a
 * revenue-recognition entry: invoices create receivables and contract
 * liabilities, never revenue.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';

import { Sha256 } from '../core/CanonicalJson.ts';
import { CostObjectId, CounterpartyId, DerivationId, EntityId, JournalEntryId } from '../core/Ids.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import { IsoDate, Period } from '../core/Temporal.ts';

import { extensible, firstError } from './internal/Codes.ts';

/**
 * Account role: lowercase words joined by `-` or `.` (open; adopters add their own).
 *
 * @since 0.1.0
 * @category schemas
 */
export const AccountRole = Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9]*(?:[-.][a-z0-9]+)*$/)).pipe(Schema.brand('keiretsu/AccountRole'));
/** @since 0.1.0 @category models */
export type AccountRole = typeof AccountRole.Type;

/**
 * Roles this package emits.
 *
 * @since 0.1.0
 * @category constants
 */
export const Roles = {
  revenue: 'revenue',
  revenueAgentNet: 'revenue-agent-net',
  revenueIntercompany: 'revenue-intercompany',
  tradeReceivable: 'trade-receivable',
  contractLiability: 'contract-liability',
  contractAsset: 'contract-asset',
  icReceivable: 'ic-receivable',
  icPayable: 'ic-payable',
  icServiceCost: 'ic-service-cost',
  icCapitalisedCost: 'ic-capitalised-cost',
  fxDifferenceElimination: 'fx-difference-elimination',
} as const satisfies Record<string, string>;

/**
 * Roles that represent revenue. Crediting them requires a recognition reference.
 *
 * @since 0.1.0
 * @category constants
 */
export const REVENUE_ROLES: ReadonlySet<string> = new Set([Roles.revenue, Roles.revenueAgentNet, Roles.revenueIntercompany]);

/**
 * Optional analysis dimensions (XBRL GL `gl-bus` style).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Dimensions = Schema.Struct({
  costObjectId: Schema.optional(CostObjectId),
  counterpartyId: Schema.optional(CounterpartyId),
  counterpartyEntityId: Schema.optional(EntityId),
  department: Schema.optional(Schema.NonEmptyString),
  location: Schema.optional(Schema.NonEmptyString),
});
/** @since 0.1.0 @category models */
export type Dimensions = typeof Dimensions.Type;

/**
 * One journal line. `amount` is positive; `side` gives direction. `transactionAmount`
 * keeps the original-currency amount when the line is booked in functional currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export const JournalLine = Schema.Struct({
  role: AccountRole,
  side: Schema.Literals(['debit', 'credit']),
  amount: Money.Money,
  transactionAmount: Schema.optional(Money.Money),
  dimensions: Schema.optional(Dimensions),
  memo: Schema.optional(Schema.NonEmptyString),
});
/** @since 0.1.0 @category models */
export type JournalLine = typeof JournalLine.Type;

/**
 * Where an entry came from. Open list of kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export const JournalSource = Schema.Struct({
  kind: extensible(['recognition-entry', 'invoice', 'cost-allocation', 'true-up', 'intercompany-mirror', 'elimination', 'loan-accrual', 'adjustment']),
  derivationId: DerivationId,
  digest: Schema.optional(Sha256),
});
/** @since 0.1.0 @category models */
export type JournalSource = typeof JournalSource.Type;

/**
 * Entry invariants.
 *
 * Codes: `journal.amount-positive`, `journal.unbalanced`, `journal.period-date`, `journal.revenue-from-recognition`.
 *
 * @since 0.1.0
 * @category checks
 */
export const validateEntry = (entry: {
  readonly date: string;
  readonly period: string;
  readonly lines: ReadonlyArray<JournalLine>;
  readonly recognitionRef?: { readonly derivationId: string } | undefined;
}): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  if (entry.lines.some((line) => Money.units(line.amount) <= 0n)) issues.push(issue('journal.amount-positive', 'error', 'entry', 'line amounts are positive; side gives direction'));
  if (!entry.date.startsWith(`${entry.period}-`)) issues.push(issue('journal.period-date', 'error', 'entry', `date ${entry.date} is outside period ${entry.period}`));
  const net = new Map<string, bigint>();
  for (const line of entry.lines) {
    const signed = line.side === 'debit' ? Money.units(line.amount) : -Money.units(line.amount);
    net.set(line.amount.currency, (net.get(line.amount.currency) ?? 0n) + signed);
  }
  for (const [currency, value] of net) {
    if (value !== 0n) issues.push(issue('journal.unbalanced', 'error', currency, `debits exceed credits by ${value} minor units`));
  }
  if (entry.recognitionRef === undefined && entry.lines.some((line) => line.side === 'credit' && REVENUE_ROLES.has(line.role))) {
    issues.push(issue('journal.revenue-from-recognition', 'error', 'entry', 'revenue is credited only from a recognition entry'));
  }
  return issues;
};

/**
 * A journal entry for one entity.
 *
 * @since 0.1.0
 * @category schemas
 */
export const JournalEntry = Schema.Struct({
  id: JournalEntryId,
  entityId: EntityId,
  date: IsoDate,
  period: Period,
  memo: Schema.NonEmptyString,
  lines: Schema.NonEmptyArray(JournalLine).check(Schema.isMinLength(2)),
  source: JournalSource,
  /** The revenue-recognition derivation supporting any revenue credit in this entry. */
  recognitionRef: Schema.optional(Schema.Struct({ derivationId: DerivationId, digest: Schema.optional(Sha256) })),
  reversalOf: Schema.optional(JournalEntryId),
}).check(Schema.makeFilter((entry) => firstError(validateEntry(entry))));
/** @since 0.1.0 @category models */
export type JournalEntry = typeof JournalEntry.Type;

/**
 * An entry failed its invariants.
 *
 * @since 0.1.0
 * @category errors
 */
export class InvalidEntry extends Data.TaggedError('InvalidEntry')<{ readonly issues: ReadonlyArray<ValidationIssue> }> {}

/**
 * Entry fields with lines as a plain array (checked for at least two lines).
 *
 * @since 0.1.0
 * @category models
 */
export type EntryInput = Omit<JournalEntry, 'lines'> & { readonly lines: ReadonlyArray<JournalLine> };

/**
 * Build an entry, failing with every invariant it breaks (code `journal.min-lines` when fewer than two lines).
 *
 * @since 0.1.0
 * @category constructors
 */
export const makeEntry = (input: EntryInput): Effect.Effect<JournalEntry, InvalidEntry> => {
  const [head, second, ...rest] = input.lines;
  if (head === undefined || second === undefined) return Effect.fail(new InvalidEntry({ issues: [issue('journal.min-lines', 'error', input.id, 'an entry has at least two lines')] }));
  const entry: JournalEntry = { ...input, lines: [head, second, ...rest] };
  const issues = validateEntry(entry);
  return issues.length === 0 ? Effect.succeed(entry) : Effect.fail(new InvalidEntry({ issues }));
};

/**
 * Signed net per currency (debit positive). Zero for every currency in a valid entry.
 *
 * @since 0.1.0
 * @category math
 */
export const netByCurrency = (lines: ReadonlyArray<JournalLine>): ReadonlyMap<string, bigint> => {
  const net = new Map<string, bigint>();
  for (const line of lines) net.set(line.amount.currency, (net.get(line.amount.currency) ?? 0n) + (line.side === 'debit' ? 1n : -1n) * Money.units(line.amount));
  return net;
};

/**
 * A line that moves `amount` to the side its sign indicates (zero amounts produce no line).
 *
 * @since 0.1.0
 * @category constructors
 */
export const signedLine = (role: AccountRole, signedAmount: Money.Money, extra: Omit<JournalLine, 'role' | 'side' | 'amount'> = {}): ReadonlyArray<JournalLine> => {
  const value = Money.units(signedAmount);
  if (value === 0n) return [];
  return [{ ...extra, role, side: value > 0n ? 'debit' : 'credit', amount: Money.make(value > 0n ? value : -value, signedAmount.currency) }];
};

/**
 * Decode a role literal.
 *
 * @since 0.1.0
 * @category constructors
 */
export const role = (value: string): AccountRole => Schema.decodeSync(AccountRole)(value);
