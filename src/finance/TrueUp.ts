/**
 * Cost-plus true-up candidates.
 *
 * {@link trueUp} compares the cost-plus amount due on the period's actual
 * cost base with what was billed, and proposes a debit or credit note. Every
 * billed charge must cite the same cost-base digest as the measurement. An
 * adjustment that lowers taxable income in a jurisdiction whose data pack
 * bars downward adjustments (e.g. India, Income-tax Act 1961 s.92(3)) is
 * flagged and held, never booked. A jurisdiction with no rule data is held
 * too: unknown is not permission.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';

import { Sha256 } from '../core/CanonicalJson.ts';
import { CountryCode } from '../core/Country.ts';
import type { CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import type * as Decimal from '../core/Decimal.ts';
import { ChargeId, type EntityId } from '../core/Ids.ts';
import { issue, ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { contains, IsoDate, Period } from '../core/Temporal.ts';

import { type CostBaseMeasurement, costPlusAmount } from './CostBaseDefinition.ts';

/**
 * Data-pack row: whether a jurisdiction bars adjustments that reduce its taxable income.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DownwardAdjustmentRule = Schema.Struct({
  jurisdiction: CountryCode,
  downwardBarred: Schema.Boolean,
  citation: Schema.NonEmptyString,
  status: Schema.Literals(['needs-verification', 'verified']),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
});
/** @since 0.1.0 @category models */
export type DownwardAdjustmentRule = typeof DownwardAdjustmentRule.Type;

/**
 * Illustrative public pack rows. Status is `needs-verification`; adopters verify in private config.
 *
 * @since 0.1.0
 * @category data
 */
export const exampleDownwardAdjustmentPack = (): ReadonlyArray<DownwardAdjustmentRule> =>
  Schema.decodeUnknownSync(Schema.Array(DownwardAdjustmentRule))([
    { jurisdiction: 'IN', downwardBarred: true, citation: 'Income-tax Act 1961 s.92(3) (renumbered under the Income-tax Act 2025)', status: 'needs-verification', validFrom: '2001-04-01' },
  ]);

/**
 * A charge billed in the period under a cost-plus schedule.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BilledCharge = Schema.Struct({ chargeId: ChargeId, amount: Money.Money, costBaseDigest: Sha256 });
/** @since 0.1.0 @category models */
export type BilledCharge = typeof BilledCharge.Type;

/**
 * A party to the schedule and the jurisdiction whose income it reports.
 *
 * @since 0.1.0
 * @category models
 */
export interface TpParty {
  readonly entityId: EntityId;
  readonly jurisdiction: CountryCode;
}

/**
 * Candidate true-up. `line` is a proposal for a human to approve and book.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TrueUpCandidate = Schema.Struct({
  period: Period,
  costBaseDigest: Sha256,
  target: Money.Money,
  billed: Money.Money,
  line: Schema.TaggedUnion({
    'debit-note': { amount: Money.Money, chargeIds: Schema.Array(ChargeId) },
    'credit-note': { amount: Money.Money, chargeIds: Schema.Array(ChargeId) },
    none: {},
  }),
  issues: Schema.Array(ValidationIssue),
});
/** @since 0.1.0 @category models */
export type TrueUpCandidate = typeof TrueUpCandidate.Type;

const downwardFlag = (rules: ReadonlyArray<DownwardAdjustmentRule>, party: TpParty, date: IsoDate): ValidationIssue | undefined => {
  const rule = rules.find((entry) => entry.jurisdiction === party.jurisdiction && contains(entry, date));
  if (rule === undefined) return issue('true-up.rule-missing', 'hold', party.entityId, `no downward-adjustment rule data for ${party.jurisdiction}; held`);
  return rule.downwardBarred ? issue('true-up.downward-barred', 'hold', party.entityId, `adjustment lowers taxable income in ${party.jurisdiction} (${rule.citation}); flag, do not book`) : undefined;
};

const trueUpEvidenceIssues = (measurement: CostBaseMeasurement, options: { readonly billedCharges: ReadonlyArray<BilledCharge> }, currency: Money.Money['currency']): Array<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  if (measurement.basis !== 'actual') issues.push(issue('true-up.measurement-held', 'hold', measurement.definitionId, 'true-ups use the actual cost base'));
  if (measurement.status === 'held') issues.push(issue('true-up.measurement-held', 'hold', measurement.definitionId, 'cost-base measurement is held'));
  for (const charge of options.billedCharges) {
    if (charge.costBaseDigest !== measurement.definitionDigest) issues.push(issue('true-up.cost-base-mismatch', 'error', charge.chargeId, 'charge cites a different cost-base definition'));
    if (charge.amount.currency !== currency) issues.push(issue('true-up.currency', 'error', charge.chargeId, `charge in ${charge.amount.currency}, base in ${currency}`));
  }
  return issues;
};

/**
 * Propose a true-up for a period.
 *
 * Codes: `true-up.measurement-held` (hold), `true-up.cost-base-mismatch` (error), `true-up.currency` (error),
 * `true-up.downward-barred` (hold), `true-up.rule-missing` (hold).
 *
 * @since 0.1.0
 * @category true-up
 */
export const trueUp = (options: {
  readonly period: Period;
  readonly actualCostBase: CostBaseMeasurement;
  readonly markup: Decimal.Decimal;
  readonly billedCharges: ReadonlyArray<BilledCharge>;
  readonly parties: { readonly provider: TpParty; readonly recipient: TpParty; readonly rules: ReadonlyArray<DownwardAdjustmentRule> };
  readonly table: CurrencyTableShape;
  readonly rounding: RoundingMode;
}): Effect.Effect<TrueUpCandidate, UnknownCurrency> =>
  Effect.map(costPlusAmount({ measurement: options.actualCostBase, markup: options.markup, table: options.table, rounding: options.rounding }), (target) => {
    const measurement = options.actualCostBase;
    const currency = target.currency;
    const issues = trueUpEvidenceIssues(measurement, options, currency);
    const billedUnits = options.billedCharges.filter((charge) => charge.amount.currency === currency).reduce((sum, charge) => sum + Money.units(charge.amount), 0n);
    const billed = Money.make(billedUnits, currency);
    const difference = Money.units(target) - billedUnits;
    const chargeIds = options.billedCharges.map((charge) => charge.chargeId);
    const blocked = issues.length > 0;
    const date = Schema.decodeSync(IsoDate)(`${options.period}-01`);
    const lowered = difference > 0n ? options.parties.recipient : options.parties.provider;
    const flag = difference === 0n || blocked ? undefined : downwardFlag(options.parties.rules, lowered, date);
    if (flag !== undefined) issues.push(flag);
    const line: TrueUpCandidate['line'] =
      difference === 0n || blocked
        ? { _tag: 'none' }
        : difference > 0n
          ? { _tag: 'debit-note', amount: Money.make(difference, currency), chargeIds }
          : { _tag: 'credit-note', amount: Money.make(-difference, currency), chargeIds };
    return { period: options.period, costBaseDigest: measurement.definitionDigest, target, billed, line, issues };
  });
