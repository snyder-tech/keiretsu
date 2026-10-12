/**
 * Incentive regimes as cited, versioned data.
 *
 * A regime says where it applies (situs), what kind of benefit it is, which
 * labour category axis it reads, who may claim it, which wage kinds form its
 * cost base and which date its effective interval is tested against. Rates are
 * exact decimals. Package-shipped regimes are always `needs-verification`; only
 * an adopter's human reviewer can mark a regime `verified-by-human`.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Situs } from '../core/Country.ts';
import { Decimal } from '../core/Decimal.ts';
import { DecisionId } from '../core/Hold.ts';
import { RegimeId } from '../core/Ids.ts';
import { Interval, IsoDate } from '../core/Temporal.ts';

import { HumanActorSchema } from './HumanActorSchema.ts';
import { KnownWageKind } from './WageFact.ts';

/** @since 0.1.0 @category schemas */
export const RegimeKind = Schema.Literals(['credit', 'deduction', 'amortisation', 'reduced-rate', 'exemption']);
/** @since 0.1.0 @category models */
export type RegimeKind = typeof RegimeKind.Type;

/**
 * Which date the effective interval is tested against.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TestDate = Schema.Literals(['work-date', 'claimant-taxable-year-start', 'unit-start', 'cost-paid']);
/** @since 0.1.0 @category models */
export type TestDate = typeof TestDate.Type;

/**
 * Which slice axis the regime reads: the credit axis (`qre`), the
 * deduction/amortisation axis (`sre`), or neither (`export-proceeds`, a
 * regime whose base is receipts rather than labour).
 *
 * @since 0.1.0
 * @category schemas
 */
export const CategoryAxis = Schema.Literals(['qre', 'sre', 'export-proceeds']);
/** @since 0.1.0 @category models */
export type CategoryAxis = typeof CategoryAxis.Type;

/** @since 0.1.0 @category schemas */
export const BenefitCategory = Schema.Literals(['wages', 'supplies', 'contract-research', 'computer-use', 'software-development', 'research-experimental', 'export-proceeds']);
/** @since 0.1.0 @category models */
export type BenefitCategory = typeof BenefitCategory.Type;

/**
 * Basis on which an entity claims. `registered-exporter` serves receipt-based
 * export regimes.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ClaimantBasis = Schema.Literals(['wage-payer', 'cost-bearer', 'risk-bearer', 'rights-holder', 'registered-exporter']);
/** @since 0.1.0 @category models */
export type ClaimantBasis = typeof ClaimantBasis.Type;

/**
 * A legal source: instrument, pinpoint locator and optional URL.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Citation = Schema.Struct({
  source: Schema.Literals(['statute', 'regulation', 'rev-proc', 'notice', 'public-law', 'form-instructions', 'official-guidance']),
  locator: Schema.NonEmptyString,
  url: Schema.optional(Schema.String.check(Schema.isPattern(/^https:\/\/\S+$/))),
});
/** @since 0.1.0 @category models */
export type Citation = typeof Citation.Type;

/**
 * A named decimal parameter (rate, percentage, month count).
 *
 * @since 0.1.0
 * @category schemas
 */
export const RegimeParameter = Schema.Struct({
  key: Schema.String.check(Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  value: Decimal,
  unit: Schema.Literals(['ratio', 'months', 'years', 'currency-minor']),
  citation: Schema.optional(Schema.NonEmptyString),
});
/** @since 0.1.0 @category models */
export type RegimeParameter = typeof RegimeParameter.Type;

/**
 * Verification status. Package data is always `needs-verification`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RegimeStatus = Schema.TaggedUnion({
  'needs-verification': {},
  'verified-by-human': { by: HumanActorSchema, on: IsoDate, decisionId: DecisionId },
});
/** @since 0.1.0 @category models */
export type RegimeStatus = typeof RegimeStatus.Type;

/**
 * Wage kinds the regime's cost base may include. Everything else is excluded with a reason.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseRule = Schema.Struct({
  includedWageKinds: Schema.NonEmptyArray(KnownWageKind),
  source: Schema.NonEmptyString,
}).check(Schema.makeFilter((rule) => (rule.includedWageKinds.includes('loaded-rate') ? 'a loaded rate is never a regime cost base' : undefined)));
/** @since 0.1.0 @category models */
export type CostBaseRule = typeof CostBaseRule.Type;

/**
 * An incentive regime.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IncentiveRegime = Schema.Struct({
  id: RegimeId,
  /** Stable human-readable code, e.g. `us.irc41`. */
  code: Schema.String.check(Schema.isPattern(/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/)),
  title: Schema.NonEmptyString,
  /** Country, plus subdivision for a state or provincial regime. */
  jurisdiction: Situs,
  /** `within`: work must be performed in the jurisdiction; `outside`: only work performed elsewhere. */
  workSitus: Schema.Literals(['within', 'outside', 'not-applicable']),
  kind: RegimeKind,
  axis: CategoryAxis,
  categories: Schema.NonEmptyArray(BenefitCategory),
  claimantBases: Schema.NonEmptyArray(ClaimantBasis),
  /** `controlled-group`: outputs are tested at group level and need an established group. */
  aggregation: Schema.Literals(['entity', 'controlled-group']),
  effective: Interval,
  testDate: TestDate,
  parameters: Schema.Array(RegimeParameter),
  costBase: Schema.optional(CostBaseRule),
  /** Prior taxable years whose base amounts a computation would need (unknown is never zero). */
  basePeriodYears: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10 })),
  /** Registration kind the claimant must hold on the test date. */
  requiresRegistration: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))),
  citations: Schema.NonEmptyArray(Citation),
  notes: Schema.Array(Schema.NonEmptyString),
  /** Day the citations were last checked against the sources. */
  reviewedOn: IsoDate,
  status: RegimeStatus,
}).check(
  Schema.makeFilter((regime) => (regime.axis === 'export-proceeds' || regime.workSitus !== 'not-applicable' ? undefined : 'labour-based regimes declare a work-situs rule')),
);
/** @since 0.1.0 @category models */
export type IncentiveRegime = typeof IncentiveRegime.Type;

/**
 * Whether the regime is sub-national (requires a subdivision on the work situs).
 *
 * @since 0.1.0
 * @category predicates
 */
export const isSubnational = (regime: IncentiveRegime): boolean => regime.jurisdiction.subdivision !== undefined;

/**
 * Look up a parameter by key.
 *
 * @since 0.1.0
 * @category accessors
 */
export const parameter = (regime: IncentiveRegime, key: string): RegimeParameter | undefined => regime.parameters.find((entry) => entry.key === key);
