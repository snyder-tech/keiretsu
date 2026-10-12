/**
 * Candidate pools: for one regime and taxable year, per claimant, the
 * candidate minutes and wage-derived cost base by category, each with the
 * inputs it was derived from. Only attributions with no blocking issue enter a
 * pool. Status is always `candidate`; no credit, deduction or filing amount is
 * computed, and base-period years that are missing stay `unknown`.
 *
 * Wage bases are allocated to categories by recorded minutes (largest
 * remainder, so the parts always sum to the person's base); the remainder that
 * no eligible slice covers stays outside the pool.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';

import { EntityId, type PersonId } from '../core/Actor.ts';
import { allocateMoney } from '../core/Allocation.ts';
import { type CanonicalJsonError, digestValue } from '../core/CanonicalJson.ts';
import { SubjectRef } from '../core/Hold.ts';
import { RegimeId } from '../core/Ids.ts';
import type { ValidationIssue, ValidationReport } from '../core/Issue.ts';
import { report } from '../core/Issue.ts';
import { make, type Money, units } from '../core/Money.ts';

import { AttributionBasis, type ClaimantAttribution } from './ClaimantAttribution.ts';
import { CostBaseAmount } from './CostBaseAmount.ts';
import type { EntityTaxProfile } from './EntityTaxProfile.ts';
import type { IncentiveRegime } from './IncentiveRegime.ts';
import type { IncentiveSet, SetIndex } from './IncentiveSet.ts';
import { raise } from './IssueCode.ts';
import type { LabourFact } from './LabourFact.ts';
import { regimeCostBase } from './RegimeCostBase.ts';
import { isClear, screenDetailed, type ScreenOptions } from './Screen.ts';
import { categoryOn, type TaxActivitySlice } from './TaxActivitySlice.ts';
import { byLabel, includes, type TaxYear, TaxYearLabel } from './TaxYear.ts';
import { refOf } from './WageFact.ts';

/**
 * Function name recorded on every pool (derivation-style).
 *
 * @since 0.1.0
 * @category constants
 */
export const FUNCTION = '@snyder-tech/keiretsu/tax-incentives/CandidatePool#candidatePools';
/** @since 0.1.0 @category constants */
export const FUNCTION_VERSION = '0.1.0';

/**
 * One category line of a pool.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CandidateCategory = Schema.Struct({
  category: Schema.NonEmptyString,
  basis: AttributionBasis,
  minutes: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  wageBase: CostBaseAmount,
  inputs: Schema.Array(SubjectRef),
});
/** @since 0.1.0 @category models */
export type CandidateCategory = typeof CandidateCategory.Type;

/**
 * A claimant's candidate pool for one regime and taxable year.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CandidatePool = Schema.Struct({
  status: Schema.Literal('candidate'),
  regimeId: RegimeId,
  regimeCode: Schema.NonEmptyString,
  taxYear: TaxYearLabel,
  claimant: EntityId,
  categories: Schema.Array(CandidateCategory),
  basePeriods: Schema.Array(Schema.Struct({ taxYear: TaxYearLabel, status: Schema.Literals(['known', 'unknown', 'attested-none']) })),
  function: Schema.NonEmptyString,
  functionVersion: Schema.NonEmptyString,
  inputs: Schema.Array(SubjectRef),
  rules: Schema.Array(SubjectRef),
});
/** @since 0.1.0 @category models */
export type CandidatePool = typeof CandidatePool.Type;

/**
 * Pools plus the issues raised while building them.
 *
 * @since 0.1.0
 * @category models
 */
export interface CandidatePoolResult {
  readonly pools: ReadonlyArray<CandidatePool>;
  readonly report: ValidationReport;
}

interface Line {
  readonly attribution: ClaimantAttribution;
  readonly slice: TaxActivitySlice;
  readonly labour: LabourFact;
  readonly category: string;
}

interface PoolScope {
  readonly index: SetIndex;
  readonly regime: IncentiveRegime;
  readonly claimant: EntityTaxProfile;
  readonly taxYear: TaxYear;
}

const ref = (kind: string, id: string, value: unknown): Effect.Effect<SubjectRef, CanonicalJsonError> => Effect.map(digestValue(value), (digest) => ({ kind, id, digest }));

const lineInputs = (line: Line): Effect.Effect<ReadonlyArray<SubjectRef>, CanonicalJsonError> =>
  Effect.all([
    Effect.succeed<SubjectRef>({ kind: 'labour-event', id: line.labour.eventId, digest: line.labour.eventDigest }),
    ref('tax-activity-slice', line.slice.id, line.slice),
    ref('claimant-attribution', line.attribution.id, line.attribution),
  ], { concurrency: 1 });

/** Weight key for recorded minutes no eligible slice covers (never a category name). */
const UNCOVERED = '#uncovered';

const isWageDerived = (line: Line): boolean => line.attribution.claimant === line.labour.employer && line.attribution.basis !== 'risk-bearer' && line.attribution.basis !== 'rights-holder';

const personMinutes = (scope: PoolScope, personId: string): number =>
  scope.index.set.labour
    .filter((fact) => fact.personId === personId && fact.employer === scope.claimant.entityId && includes(scope.taxYear, fact.workDate))
    .reduce((sum, fact) => sum + fact.minutes, 0);

/** Per-person, per-category wage share; `undefined` marks an unknown person base. */
const personShares = (scope: PoolScope, personId: PersonId, lines: ReadonlyArray<Line>): Effect.Effect<ReadonlyMap<string, Money> | undefined> => {
  const base = regimeCostBase({ regime: scope.regime, claimant: scope.claimant, personId, taxYear: scope.taxYear, wages: scope.index.set.wages });
  if (base.amount._tag !== 'amount') return Effect.succeed(undefined);
  const minutes = new Map<string, bigint>();
  for (const line of lines) minutes.set(line.category, (minutes.get(line.category) ?? 0n) + BigInt(line.slice.minutes));
  const covered = [...minutes.values()].reduce((sum, value) => sum + value, 0n);
  const other = BigInt(personMinutes(scope, personId)) - covered;
  const weights = [...[...minutes].map(([key, weight]) => ({ key, weight })), { key: UNCOVERED, weight: other > 0n ? other : 0n }];
  return allocateMoney(base.amount.money, weights).pipe(Effect.orElseSucceed(() => undefined));
};

const wageBases = (scope: PoolScope, lines: ReadonlyArray<Line>): Effect.Effect<ReadonlyMap<string, CostBaseAmount>> =>
  Effect.gen(function* () {
    const persons = [...new Set(lines.map((line) => line.labour.personId))].sort();
    const totals = new Map<string, bigint>();
    const unknown = new Set<string>();
    for (const person of persons) {
      const own = lines.filter((line) => line.labour.personId === person);
      const shares = yield* personShares(scope, person, own);
      for (const line of own) {
        if (shares === undefined) unknown.add(line.category);
        else totals.set(line.category, (totals.get(line.category) ?? 0n) + units(shares.get(line.category) ?? make(0n, scope.claimant.functionalCurrency)));
      }
    }
    const categories = [...new Set(lines.map((line) => line.category))];
    return new Map(
      categories.map((category): readonly [string, CostBaseAmount] =>
        unknown.has(category)
          ? [category, { _tag: 'unknown', reason: 'a person in this category has no includable wage facts' }]
          : [category, { _tag: 'amount', money: make(totals.get(category) ?? 0n, scope.claimant.functionalCurrency) }],
      ),
    );
  });

const dedupe = <A>(items: ReadonlyArray<A>, key: (item: A) => string): ReadonlyArray<A> => [...new Map(items.map((item) => [key(item), item])).values()];

const buildCategories = (scope: PoolScope, lines: ReadonlyArray<Line>): Effect.Effect<ReadonlyArray<CandidateCategory>, CanonicalJsonError> =>
  Effect.gen(function* () {
    const wageLines = lines.filter(isWageDerived);
    const bases = yield* wageBases(scope, wageLines);
    const keys = dedupe(
      lines.map((line) => ({ category: line.category, basis: line.attribution.basis })),
      (entry) => `${entry.basis}|${entry.category}`,
    );
    const result: Array<CandidateCategory> = [];
    for (const key of keys) {
      const own = lines.filter((line) => line.category === key.category && line.attribution.basis === key.basis);
      const inputs = (yield* Effect.forEach(own, lineInputs, { concurrency: 1 })).flat();
      const wageBase: CostBaseAmount = own.every(isWageDerived)
        ? (bases.get(key.category) ?? { _tag: 'unknown', reason: 'no wage base' })
        : { _tag: 'not-applicable', reason: "a payer's cost is the charge it bears, measured by the finance package" };
      result.push({ category: key.category, basis: key.basis, minutes: own.reduce((sum, line) => sum + line.slice.minutes, 0), wageBase, inputs });
    }
    return result;
  });

const basePeriods = (scope: PoolScope): CandidatePool['basePeriods'] =>
  Array.from({ length: scope.regime.basePeriodYears }, (_, offset) => {
    const label = TaxYearLabel.make(String(Number(scope.taxYear.label) - offset - 1));
    const fact = scope.index.set.basePeriods.find((entry) => entry.claimant === scope.claimant.entityId && entry.regimeId === scope.regime.id && entry.taxYear === label);
    return { taxYear: label, status: fact?.status ?? 'unknown' };
  });

const poolIssues = (pool: CandidatePool): ReadonlyArray<ValidationIssue> => {
  const subject = `pool:${pool.regimeCode}/${pool.claimant}/${pool.taxYear}`;
  const unknownYears = pool.basePeriods.filter((entry) => entry.status === 'unknown').map((entry) => entry.taxYear);
  const issues: Array<ValidationIssue> = [];
  if (unknownYears.length > 0) issues.push(raise('base-period.unknown', subject, `base-period years ${unknownYears.join(', ')} are unknown (not zero)`));
  if (pool.categories.some((line) => line.wageBase._tag === 'unknown')) issues.push(raise('cost-base.unknown', subject, 'a wage base in the pool is unknown'));
  if (pool.categories.some((line) => line.wageBase._tag === 'not-applicable')) issues.push(raise('cost-base.not-wages', subject, 'payer-side categories carry minutes only; their cost is a charge'));
  return issues;
};

const buildPool = (scope: PoolScope, lines: ReadonlyArray<Line>): Effect.Effect<CandidatePool, CanonicalJsonError> =>
  Effect.gen(function* () {
    const categories = yield* buildCategories(scope, lines);
    const wageRefs = yield* Effect.forEach(
      scope.index.set.wages.filter((fact) => fact.payer === scope.claimant.entityId && includes(scope.taxYear, fact.period) && lines.some((line) => line.labour.personId === fact.personId)),
      (fact) => ref('wage-fact', refOf(fact), fact),
      { concurrency: 1 },
    );
    const rule = yield* ref('incentive-regime', scope.regime.id, scope.regime);
    return {
      status: 'candidate',
      regimeId: scope.regime.id,
      regimeCode: scope.regime.code,
      taxYear: scope.taxYear.label,
      claimant: scope.claimant.entityId,
      categories,
      basePeriods: basePeriods(scope),
      function: FUNCTION,
      functionVersion: FUNCTION_VERSION,
      inputs: [...dedupe(categories.flatMap((line) => line.inputs), (entry) => `${entry.kind}|${entry.id}`), ...wageRefs],
      rules: [rule],
    };
  });

const clearLines = (set: IncentiveSet, regime: IncentiveRegime, options: { readonly taxYear: string; readonly screen: ReturnType<typeof screenDetailed> }): ReadonlyArray<Line> => {
  const axis = regime.axis === 'export-proceeds' ? undefined : regime.axis;
  if (axis === undefined) return [];
  return set.attributions.flatMap((attribution) => {
    const slice = options.screen.index.slices.get(attribution.sliceId);
    const labour = slice === undefined ? undefined : options.screen.index.labour.get(slice.eventId);
    const category = slice === undefined ? undefined : categoryOn(slice, axis);
    const eligible = attribution.regimeId === regime.id && attribution.taxYear === options.taxYear && isClear(options.screen, attribution.id);
    return eligible && slice !== undefined && labour !== undefined && category !== undefined ? [{ attribution, slice, labour, category }] : [];
  });
};

/**
 * Build candidate pools for one regime and taxable-year label.
 *
 * @since 0.1.0
 * @category constructors
 */
export const candidatePools = (set: IncentiveSet, regimeId: string, taxYear: string, options: ScreenOptions = {}): Effect.Effect<CandidatePoolResult, CanonicalJsonError> =>
  Effect.gen(function* () {
    const screened = screenDetailed(set, options);
    const regime = screened.index.regimes.get(regimeId);
    if (regime === undefined) return { pools: [], report: report([raise('regime.unknown', `regime:${regimeId}`, `regime ${regimeId} is not declared`)]) };
    const lines = clearLines(set, regime, { taxYear, screen: screened });
    const claimants = [...new Set(lines.map((line) => line.attribution.claimant))].sort();
    const pools: Array<CandidatePool> = [];
    for (const claimantId of claimants) {
      const claimant = screened.index.entities.get(claimantId);
      if (claimant === undefined) continue;
      const scope: PoolScope = { index: screened.index, regime, claimant, taxYear: byLabel(claimant.fiscalYearEndMonth, taxYear) };
      pools.push(yield* buildPool(scope, lines.filter((line) => line.attribution.claimant === claimantId)));
    }
    const regimeIssues = screened.report.issues.filter((entry) => entry.subject === `regime:${regime.id}`);
    return { pools, report: report([...regimeIssues, ...pools.flatMap(poolIssues)]) };
  });
