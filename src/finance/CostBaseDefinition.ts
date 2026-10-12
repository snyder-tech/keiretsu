/**
 * The single, digested cost-base definition shared by costing and cost-plus pricing.
 *
 * A definition lists every cost component and how it is treated: marked up,
 * passed through at cost (OECD TPG 2.99–2.100, 7.34) or excluded. Costing
 * measures a period against a definition and cites its digest; every
 * cost-plus charge and true-up must cite the same digest. A component the
 * definition does not mention is held, never silently excluded.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';

import { invalidJson, digestValue, Sha256, type CanonicalJsonError } from '../core/CanonicalJson.ts';
import type { CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import { revisionChain, RevisionFields, validInterval } from '../core/Envelope.ts';
import { RuleId } from '../core/Ids.ts';
import { ValidationIssue, issue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { IsoDate, Period } from '../core/Temporal.ts';

import { extensible } from './internal/Codes.ts';

/**
 * Cost components. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostComponentKind = extensible(['pay', 'burden', 'benefits', 'overhead', 'stock-compensation', 'idle-time', 'contractor', 'cloud-ai', 'tooling', 'third-party-disbursement']);
/** @since 0.1.0 @category models */
export type CostComponentKind = typeof CostComponentKind.Type;

/**
 * How a component enters the base.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ComponentTreatment = Schema.Literals(['markup', 'pass-through', 'exclude']);
/** @since 0.1.0 @category models */
export type ComponentTreatment = typeof ComponentTreatment.Type;

/**
 * A versioned cost-base definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseDefinition = Schema.Struct({
  id: RuleId,
  ...RevisionFields,
  name: Schema.NonEmptyString,
  components: Schema.NonEmptyArray(Schema.Struct({ kind: CostComponentKind, treatment: ComponentTreatment })),
  /** Which FX basis converts foreign-currency costs into the base currency (cites an FX policy). */
  fxBasis: Schema.optional(Schema.NonEmptyString),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
}).check(
  revisionChain,
  validInterval,
  Schema.makeFilter((definition) =>
    new Set(definition.components.map((component) => component.kind)).size === definition.components.length ? undefined : 'cost-base.duplicate-component: each component is listed once',
  ),
);
/** @since 0.1.0 @category models */
export type CostBaseDefinition = typeof CostBaseDefinition.Type;

/**
 * SHA-256 over the definition's canonical JSON.
 *
 * @since 0.1.0
 * @category digests
 */
export const definitionDigest = (definition: CostBaseDefinition): Effect.Effect<Sha256, CanonicalJsonError> =>
  Schema.encodeEffect(CostBaseDefinition)(definition).pipe(
    Effect.mapError((error) => invalidJson('$', String(error))),
    Effect.flatMap(digestValue),
  );

/**
 * A component amount to be measured against a definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ComponentAmount = Schema.Struct({ kind: CostComponentKind, amount: Money.Money });
/** @since 0.1.0 @category models */
export type ComponentAmount = typeof ComponentAmount.Type;

/**
 * A period's cost base measured against one definition.
 *
 * `status: held` means at least one component could not be placed; amounts
 * then cover only the placed components and must not be billed.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseMeasurement = Schema.Struct({
  definitionId: RuleId,
  definitionDigest: Sha256,
  period: Period,
  basis: Schema.Literals(['actual', 'standard']),
  markupBase: Money.Money,
  passThrough: Money.Money,
  excluded: Money.Money,
  status: Schema.Literals(['complete', 'held']),
  issues: Schema.Array(ValidationIssue),
});
/** @since 0.1.0 @category models */
export type CostBaseMeasurement = typeof CostBaseMeasurement.Type;

/**
 * Measure component amounts against a definition.
 *
 * Codes: `cost-base.unknown-component` (hold), `cost-base.currency` (error).
 *
 * @since 0.1.0
 * @category measurement
 */
export const measure = (options: {
  readonly definition: CostBaseDefinition;
  readonly period: Period;
  readonly basis: 'actual' | 'standard';
  readonly currency: Money.Money['currency'];
  readonly amounts: ReadonlyArray<ComponentAmount>;
}): Effect.Effect<CostBaseMeasurement, CanonicalJsonError> =>
  Effect.map(definitionDigest(options.definition), (digest) => {
    const issues: Array<ValidationIssue> = [];
    const totals: Record<ComponentTreatment, bigint> = { markup: 0n, 'pass-through': 0n, exclude: 0n };
    for (const line of options.amounts) {
      const treatment = options.definition.components.find((component) => component.kind === line.kind)?.treatment;
      if (line.amount.currency !== options.currency) {
        issues.push(issue('cost-base.currency', 'error', line.kind, `amount in ${line.amount.currency}, base in ${options.currency}`));
      } else if (treatment === undefined) {
        issues.push(issue('cost-base.unknown-component', 'hold', line.kind, 'component is not in the cost-base definition; held, not excluded'));
      } else {
        totals[treatment] += Money.units(line.amount);
      }
    }
    return {
      definitionId: options.definition.id,
      definitionDigest: digest,
      period: options.period,
      basis: options.basis,
      markupBase: Money.make(totals.markup, options.currency),
      passThrough: Money.make(totals['pass-through'], options.currency),
      excluded: Money.make(totals.exclude, options.currency),
      status: issues.length === 0 ? 'complete' : 'held',
      issues,
    };
  });

/**
 * Cost-plus amount: `markupBase × (1 + markup) + passThrough`, rounded once.
 * A candidate for pricing; the markup's arm's-length support is a separate test.
 *
 * @since 0.1.0
 * @category math
 */
export const costPlusAmount = (options: {
  readonly measurement: CostBaseMeasurement;
  readonly markup: Decimal.Decimal;
  readonly table: CurrencyTableShape;
  readonly rounding: RoundingMode;
}): Effect.Effect<Money.Money, UnknownCurrency> =>
  Effect.gen(function* () {
    const base = yield* Money.toScaledAmount(options.measurement.markupBase, options.table);
    const pass = yield* Money.toScaledAmount(options.measurement.passThrough, options.table);
    const factor = Decimal.add(Decimal.fromInteger(1), Decimal.toScaled(options.markup));
    return yield* Money.fromScaledAmount({
      amount: Decimal.add(Decimal.multiply(base, factor), pass),
      currency: options.measurement.markupBase.currency,
      table: options.table,
      rounding: options.rounding,
    });
  });
