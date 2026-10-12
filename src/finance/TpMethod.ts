/**
 * Transfer-pricing methods (OECD TPG 2022, Ch. II; low-value services Ch. VII 7.43–7.65).
 *
 * A method is a declared choice in an agreement schedule. Cost-based methods
 * cite the `CostBaseDefinition` digest they price against. The
 * low-value-services simplified approach fixes the markup at 5% and is
 * flagged when the service falls in an excluded category (OECD 7.47).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Sha256 } from '../core/CanonicalJson.ts';
import { Decimal } from '../core/Decimal.ts';
import { brand } from '../core/Id.ts';
import { EntityId, RuleId } from '../core/Ids.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';

/** @since 0.1.0 @category schemas */
export const BenchmarkId = brand('keiretsu/BenchmarkId');
/** @since 0.1.0 @category models */
export type BenchmarkId = typeof BenchmarkId.Type;

/**
 * Profit level indicators for TNMM.
 *
 * - `net-cost-plus`: operating profit / total cost
 * - `operating-margin`: operating profit / revenue
 * - `berry-ratio`: gross profit / operating expenses
 *
 * @since 0.1.0
 * @category schemas
 */
export const Pli = Schema.Literals(['net-cost-plus', 'operating-margin', 'berry-ratio']);
/** @since 0.1.0 @category models */
export type Pli = typeof Pli.Type;

/**
 * Reference to a cost-base definition by id and digest.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseRef = Schema.Struct({ id: RuleId, digest: Sha256 });
/** @since 0.1.0 @category models */
export type CostBaseRef = typeof CostBaseRef.Type;

/**
 * The fixed markup of the low-value-services simplified approach.
 *
 * @since 0.1.0
 * @category constants
 */
export const LVAS_MARKUP = '0.05';

/**
 * Transfer-pricing method.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TpMethod = Schema.TaggedUnion({
  cup: { comparableRef: Schema.NonEmptyString },
  'resale-price': { grossMargin: Decimal },
  'cost-plus': { markup: Decimal, costBase: CostBaseRef },
  tnmm: { pli: Pli, testedParty: EntityId, benchmarkId: BenchmarkId, costBase: Schema.optional(CostBaseRef) },
  'profit-split': { approach: Schema.Literals(['contribution', 'residual']), keys: Schema.NonEmptyArray(Schema.NonEmptyString) },
  'low-value-services': {
    markup: Decimal.check(Schema.makeFilter((value: string) => (value === LVAS_MARKUP ? undefined : 'tp.lvas-markup: the simplified approach uses a 5% markup'))),
    costBase: CostBaseRef,
    /** OECD 7.47 exclusions, each answered by a human screen. */
    exclusionScreen: Schema.Struct({ coreBusiness: Schema.Boolean, research: Schema.Boolean, financial: Schema.Boolean, extractive: Schema.Boolean }),
  },
});
/** @since 0.1.0 @category models */
export type TpMethod = typeof TpMethod.Type;

/**
 * Method-level flags. Codes: `tp.lvas-excluded` (hold), `tp.benchmark-required` (hold).
 *
 * @since 0.1.0
 * @category checks
 */
export const methodFlags = (method: TpMethod, options: { readonly associated: boolean; readonly hasCurrentBenchmark: boolean }): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  if (method._tag === 'low-value-services') {
    const screen = method.exclusionScreen;
    if (screen.coreBusiness || screen.research || screen.financial || screen.extractive) {
      issues.push(issue('tp.lvas-excluded', 'hold', method._tag, 'service falls in an excluded category; the simplified approach is not available'));
    }
  }
  const needsBenchmark = method._tag === 'cost-plus' || method._tag === 'tnmm' || method._tag === 'profit-split';
  if (options.associated && needsBenchmark && !options.hasCurrentBenchmark) {
    issues.push(issue('tp.benchmark-required', 'hold', method._tag, 'associated-party method needs a current benchmark'));
  }
  return issues;
};
