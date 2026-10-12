/**
 * Loaded hourly rates and the content-addressed snapshot a costing run uses.
 *
 * A loaded rate splits into pay, burden, benefits and (optionally) overhead.
 * The pay component carries a `wageKind` tag so a tax package can select
 * statutory wages (for example wages under IRC §3401 for the US research
 * credit) instead of loaded cost. Rates are effective-dated; versions for the
 * same subject never overlap, and a lookup with no rate in effect fails rather
 * than falling back.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';

import { invalidJson, digestValue, type CanonicalJsonError, type Sha256 } from '../core/CanonicalJson.ts';
import { CurrencyCode, type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import { EntityId, PersonId, SnapshotId } from '../core/Ids.ts';
import { type ValidationIssue, issue } from '../core/Issue.ts';
import { fromScaledAmount, type Money } from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { contains, Instant, IsoDate, overlaps } from '../core/Temporal.ts';

import { extensible, firstError } from './internal/Codes.ts';

/**
 * Kind of wage the pay component represents.
 *
 * - `irc3401`: US wages for income-tax withholding (the §41 wage QRE basis)
 * - `contractor`: payments to non-employees
 * - `foreign-local-payroll`: wages under a non-US payroll
 *
 * @since 0.1.0
 * @category schemas
 */
export const WageKind = extensible(['irc3401', 'contractor', 'foreign-local-payroll']);
/** @since 0.1.0 @category models */
export type WageKind = typeof WageKind.Type;

const NonNegativeDecimal = Decimal.Decimal.check(Schema.makeFilter((value: string) => (value.startsWith('-') ? 'rate components are non-negative' : undefined)));

/**
 * Per-hour amounts by component, in the rate's currency (major units).
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateComponents = Schema.Struct({
  pay: Schema.Struct({ perHour: NonNegativeDecimal, wageKind: WageKind }),
  burden: NonNegativeDecimal,
  benefits: NonNegativeDecimal,
  overhead: Schema.optional(NonNegativeDecimal),
});
/** @since 0.1.0 @category models */
export type RateComponents = typeof RateComponents.Type;

/**
 * Whom a rate applies to: a person or a role.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateSubject = Schema.TaggedUnion({
  person: { personId: PersonId },
  role: { roleCode: Schema.NonEmptyString },
});
/** @since 0.1.0 @category models */
export type RateSubject = typeof RateSubject.Type;

/**
 * An effective-dated loaded rate.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LoadedRate = Schema.Struct({
  subject: RateSubject,
  entityId: EntityId,
  currency: CurrencyCode,
  components: RateComponents,
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
});
/** @since 0.1.0 @category models */
export type LoadedRate = typeof LoadedRate.Type;

/**
 * Stable key of a rate subject.
 *
 * @since 0.1.0
 * @category accessors
 */
export const subjectKey = (subject: RateSubject): string => (subject._tag === 'person' ? `person:${subject.personId}` : `role:${subject.roleCode}`);

/**
 * Invariants of a rate set: one entity and currency, valid intervals, no overlapping versions per subject.
 *
 * Codes: `rate.interval`, `rate.single-entity`, `rate.single-currency`, `rate.overlap`.
 *
 * @since 0.1.0
 * @category checks
 */
export const validateRates = (rates: ReadonlyArray<LoadedRate>): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  for (const rate of rates) {
    if (rate.validTo !== undefined && rate.validTo <= rate.validFrom) issues.push(issue('rate.interval', 'error', subjectKey(rate.subject), 'validTo must follow validFrom'));
  }
  if (new Set(rates.map((rate) => rate.entityId)).size > 1) issues.push(issue('rate.single-entity', 'error', 'snapshot', 'a rate snapshot covers one entity'));
  if (new Set(rates.map((rate) => rate.currency)).size > 1) issues.push(issue('rate.single-currency', 'error', 'snapshot', 'a rate snapshot is stated in one currency'));
  rates.forEach((rate, index) => {
    const clash = rates.slice(index + 1).find((other) => subjectKey(other.subject) === subjectKey(rate.subject) && overlaps(rate, other));
    if (clash !== undefined) issues.push(issue('rate.overlap', 'error', subjectKey(rate.subject), `versions from ${rate.validFrom} and ${clash.validFrom} overlap`));
  });
  return issues;
};

/**
 * A frozen set of loaded rates used by a costing run. Cost lines cite it by `{ id, digest }`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LoadedRateSnapshot = Schema.Struct({
  id: SnapshotId,
  entityId: EntityId,
  currency: CurrencyCode,
  rates: Schema.NonEmptyArray(LoadedRate),
  recordedAt: Instant,
}).check(
  Schema.makeFilter((snapshot) => firstError(validateRates(snapshot.rates))),
  Schema.makeFilter((snapshot) =>
    snapshot.rates.every((rate) => rate.entityId === snapshot.entityId && rate.currency === snapshot.currency) ? undefined : 'rate.single-entity: every rate matches the snapshot entity and currency',
  ),
);
/** @since 0.1.0 @category models */
export type LoadedRateSnapshot = typeof LoadedRateSnapshot.Type;

/**
 * SHA-256 over the RFC 8785 form of a snapshot.
 *
 * @since 0.1.0
 * @category digests
 */
export const snapshotDigest = (snapshot: LoadedRateSnapshot): Effect.Effect<Sha256, CanonicalJsonError> =>
  Schema.encodeEffect(LoadedRateSnapshot)(snapshot).pipe(
    Effect.mapError((error) => invalidJson('$', String(error))),
    Effect.flatMap(digestValue),
  );

/**
 * No rate version is in effect for the subject on the date.
 *
 * @since 0.1.0
 * @category errors
 */
export class NoRateInEffect extends Data.TaggedError('NoRateInEffect')<{ readonly subject: string; readonly date: string }> {}

/**
 * The single rate version in effect for a subject on a date.
 *
 * @since 0.1.0
 * @category lookups
 */
export const resolveRate = (options: { readonly snapshot: LoadedRateSnapshot; readonly subject: RateSubject; readonly date: IsoDate }): Effect.Effect<LoadedRate, NoRateInEffect> => {
  const key = subjectKey(options.subject);
  const found = options.snapshot.rates.find((rate) => subjectKey(rate.subject) === key && contains(rate, options.date));
  return found === undefined ? Effect.fail(new NoRateInEffect({ subject: key, date: options.date })) : Effect.succeed(found);
};

/**
 * Cost of minutes at a rate, by component. Each component is rounded once to minor units.
 *
 * @since 0.1.0
 * @category math
 */
export const componentCosts = (options: {
  readonly rate: LoadedRate;
  readonly minutes: number;
  readonly table: CurrencyTableShape;
  readonly rounding: RoundingMode;
}): Effect.Effect<{ readonly pay: Money; readonly burden: Money; readonly benefits: Money; readonly overhead: Money }, UnknownCurrency> => {
  const minutes = Decimal.fromInteger(options.minutes);
  const sixty = Decimal.fromInteger(60);
  const cost = (perHour: string) =>
    fromScaledAmount({
      amount: Decimal.divideBy(Decimal.multiply(Decimal.toScaled(perHour), minutes), sixty),
      currency: options.rate.currency,
      table: options.table,
      rounding: options.rounding,
    });
  const { components } = options.rate;
  return Effect.all({ pay: cost(components.pay.perHour), burden: cost(components.burden), benefits: cost(components.benefits), overhead: cost(components.overhead ?? '0') }, { concurrency: 1 });
};
