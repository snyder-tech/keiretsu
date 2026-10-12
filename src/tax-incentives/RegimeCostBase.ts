/**
 * Regime cost bases built from payroll wage facts.
 *
 * Each regime names the wage kinds its base may include; everything else is
 * listed as excluded with a reason. A loaded cost rate is never a base. Wages
 * paid by an entity other than the claimant are excluded (a transfer leg does
 * not make the payer the wage payer). No facts means `unknown`, not zero.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { EntityId, PersonId } from '../core/Actor.ts';
import { RegimeId } from '../core/Ids.ts';
import { make, units } from '../core/Money.ts';

import { CostBaseAmount } from './CostBaseAmount.ts';
import type { EntityTaxProfile } from './EntityTaxProfile.ts';
import type { IncentiveRegime } from './IncentiveRegime.ts';
import { includes, type TaxYear, TaxYearLabel } from './TaxYear.ts';
import { refOf, type WageFact } from './WageFact.ts';

/** @since 0.1.0 @category schemas */
export const ExclusionReason = Schema.Literals(['excluded-by-regime', 'loaded-cost-never-a-wage-base', 'payer-is-not-claimant', 'currency-not-functional']);
/** @since 0.1.0 @category models */
export type ExclusionReason = typeof ExclusionReason.Type;

/**
 * One person's cost base for one regime, claimant and taxable year.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RegimeCostBase = Schema.Struct({
  regimeId: RegimeId,
  claimant: EntityId,
  personId: PersonId,
  taxYear: TaxYearLabel,
  included: Schema.Array(Schema.NonEmptyString),
  excluded: Schema.Array(Schema.Struct({ ref: Schema.NonEmptyString, reason: ExclusionReason })),
  amount: CostBaseAmount,
  source: Schema.NonEmptyString,
});
/** @since 0.1.0 @category models */
export type RegimeCostBase = typeof RegimeCostBase.Type;

const exclusionFor = (regime: IncentiveRegime, claimant: EntityTaxProfile, fact: WageFact): ExclusionReason | undefined => {
  if (fact.wageKind === 'loaded-rate') return 'loaded-cost-never-a-wage-base';
  if (fact.payer !== claimant.entityId) return 'payer-is-not-claimant';
  const included: ReadonlyArray<string> = regime.costBase?.includedWageKinds ?? [];
  if (!included.includes(fact.wageKind)) return 'excluded-by-regime';
  return fact.amount.currency === claimant.functionalCurrency ? undefined : 'currency-not-functional';
};

/**
 * Build one person's regime cost base from wage facts.
 *
 * @since 0.1.0
 * @category constructors
 */
export const regimeCostBase = (options: {
  readonly regime: IncentiveRegime;
  readonly claimant: EntityTaxProfile;
  readonly personId: PersonId;
  readonly taxYear: TaxYear;
  readonly wages: ReadonlyArray<WageFact>;
}): RegimeCostBase => {
  const { regime, claimant, personId, taxYear } = options;
  const base = { regimeId: regime.id, claimant: claimant.entityId, personId, taxYear: taxYear.label, source: regime.costBase?.source ?? 'regime defines no wage cost base' };
  if (regime.costBase === undefined) return { ...base, included: [], excluded: [], amount: { _tag: 'not-applicable', reason: 'regime base is not wages' } };
  const relevant = options.wages.filter((fact) => fact.personId === personId && includes(taxYear, fact.period));
  const assessed = relevant.map((fact) => ({ fact, reason: exclusionFor(regime, claimant, fact) }));
  const included = assessed.flatMap((entry) => (entry.reason === undefined ? [entry.fact] : []));
  const excluded = assessed.flatMap((entry) => (entry.reason === undefined ? [] : [{ ref: refOf(entry.fact), reason: entry.reason }]));
  const amount: CostBaseAmount =
    included.length === 0
      ? { _tag: 'unknown', reason: 'no includable wage facts for the person, claimant and taxable year' }
      : { _tag: 'amount', money: make(included.reduce((total, fact) => total + units(fact.amount), 0n), claimant.functionalCurrency) };
  return { ...base, included: included.map(refOf), excluded, amount };
};
