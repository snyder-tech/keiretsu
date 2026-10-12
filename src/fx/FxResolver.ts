/**
 * Apply a {@link RateClause} to observations and produce sealed {@link FxSnapshot}s.
 *
 * Resolution is deterministic for a given observation log and `knownAt`.
 * Triangulation multiplies the two legs exactly (no rounded cross or inverse
 * rate, after Council Regulation (EC) 1103/97 art. 4). A missing rate either
 * falls back as the clause says, fails with `RateUnavailable`, or holds with
 * `RateHeld`; it is never filled with a guess.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Match } from 'effect';

import type { Sha256 } from '../core/CanonicalJson.ts';
import type { CurrencyCode } from '../core/Currency.ts';
import { add, divideBy, fromInteger, fromScaled, toScaled, type Decimal } from '../core/Decimal.ts';
import { periodOf, type Instant, type IsoDate, type Period } from '../core/Temporal.ts';

import { ClauseInputMissing, RateHeld, RateUnavailable, SeriesMismatch, type FxSourceError } from './FxError.ts';
import { latest, observationDigest, type FxObservation } from './FxObservation.ts';
import { FxRateSource, type FxRateSourceShape } from './FxRateSource.ts';
import { isPublicationDay, type FxSeries, type FxSeriesId, type PublicationCalendar } from './FxSeries.ts';
import { observationSetDigest, seal, type FallbackReason, type FxSnapshot, type RateLeg } from './FxSnapshot.ts';
import { addDays, firstDayOf, lastDayOf, onOrAfter } from './internal/Dates.ts';
import { chainRatio, displayRate } from './internal/SnapshotMath.ts';
import { clauseDigest, type DateRule, type Fallback, type RateClause } from './RateClause.ts';

/**
 * Series and calendars the resolver may use.
 *
 * @since 0.1.0
 * @category models
 */
export interface SeriesCatalog {
  readonly series: ReadonlyArray<FxSeries>;
  readonly calendars: ReadonlyArray<PublicationCalendar>;
}

/**
 * Dates the clause's date rule may need.
 *
 * @since 0.1.0
 * @category models
 */
export interface ClauseDates {
  readonly transactionDate?: IsoDate | undefined;
  readonly invoiceDate?: IsoDate | undefined;
  readonly settlementDate?: IsoDate | undefined;
  /** Accounting period for `PeriodEnd` / `PeriodAverage`; defaults to the transaction date's period. */
  readonly period?: Period | undefined;
}

/**
 * A resolution request: convert `base` → `quote` under `clause`.
 *
 * @since 0.1.0
 * @category models
 */
export interface ResolveRequest {
  readonly clause: RateClause;
  readonly base: CurrencyCode;
  readonly quote: CurrencyCode;
  readonly dates: ClauseDates;
  /** Use only revisions recorded at or before this instant (e.g. the close cut-off). */
  readonly knownAt?: Instant | undefined;
}

/**
 * Errors a resolution can fail with.
 *
 * @since 0.1.0
 * @category errors
 */
export type ResolveError = RateUnavailable | RateHeld | ClauseInputMissing | SeriesMismatch | FxSourceError;

/**
 * Resolver service shape.
 *
 * @since 0.1.0
 * @category models
 */
export interface FxResolverShape {
  readonly resolve: (request: ResolveRequest) => Effect.Effect<FxSnapshot, ResolveError>;
  /**
   * Replace a provisional snapshot once the rate for its requested date is
   * published: re-resolves with fallback `Hold` and returns revision n+1
   * superseding the provisional digest. Fails with `RateHeld` while unpublished.
   */
  readonly trueUp: (request: ResolveRequest, provisional: FxSnapshot) => Effect.Effect<FxSnapshot, ResolveError>;
}

type Target = { readonly _tag: 'Day'; readonly date: IsoDate } | { readonly _tag: 'Average'; readonly period: Period };

interface LegPlan {
  readonly series: FxSeries;
  readonly orientation: 'multiply' | 'divide';
}

interface LegOutcome {
  readonly leg: RateLeg;
  readonly digests: ReadonlyArray<Sha256>;
  readonly fallbackReason?: FallbackReason | undefined;
}

interface ResolveContext {
  readonly catalog: SeriesCatalog;
  readonly source: FxRateSourceShape;
  readonly request: ResolveRequest;
}

const requiredDate = (rule: string, field: string, date: IsoDate | undefined): Effect.Effect<IsoDate, ClauseInputMissing> =>
  date === undefined ? Effect.fail(new ClauseInputMissing({ rule, field })) : Effect.succeed(date);

const periodFor = (rule: string, dates: ClauseDates): Effect.Effect<Period, ClauseInputMissing> =>
  dates.period === undefined ? Effect.map(requiredDate(rule, 'transactionDate', dates.transactionDate), periodOf) : Effect.succeed(dates.period);

const day = (date: IsoDate): Target => ({ _tag: 'Day', date });

const targetOf = (rule: DateRule, dates: ClauseDates): Effect.Effect<Target, ClauseInputMissing> =>
  Match.value(rule).pipe(
    Match.tagsExhaustive({
      TransactionDate: () => Effect.map(requiredDate('TransactionDate', 'transactionDate', dates.transactionDate), day),
      InvoiceDate: () => Effect.map(requiredDate('InvoiceDate', 'invoiceDate', dates.invoiceDate), day),
      SettlementDate: () => Effect.map(requiredDate('SettlementDate', 'settlementDate', dates.settlementDate), day),
      WeekEnding: ({ weekEndsOn }) => Effect.map(requiredDate('WeekEnding', 'transactionDate', dates.transactionDate), (date) => day(onOrAfter(date, weekEndsOn))),
      PeriodEnd: () => Effect.map(periodFor('PeriodEnd', dates), (period) => day(lastDayOf(period))),
      PeriodAverage: () => Effect.map(periodFor('PeriodAverage', dates), (period): Target => ({ _tag: 'Average', period })),
      FixedDate: ({ date }) => Effect.succeed(day(date)),
    }),
  );

const requestedDateOf = (target: Target): IsoDate => (target._tag === 'Day' ? target.date : lastDayOf(target.period));

const findSeries = (catalog: SeriesCatalog, id: FxSeriesId): Effect.Effect<FxSeries, SeriesMismatch> => {
  const series = catalog.series.find((entry) => entry.id === id);
  return series === undefined ? Effect.fail(new SeriesMismatch({ series: id, reason: 'series is not declared in the catalog' })) : Effect.succeed(series);
};

const orient = (series: FxSeries, from: CurrencyCode, to: CurrencyCode): Effect.Effect<LegPlan, SeriesMismatch> => {
  if (series.base === from && series.quote === to) return Effect.succeed({ series, orientation: 'multiply' });
  if (series.base === to && series.quote === from) return Effect.succeed({ series, orientation: 'divide' });
  return Effect.fail(new SeriesMismatch({ series: series.id, reason: `series quotes ${series.base}/${series.quote}, not ${from}/${to}` }));
};

const fallbackReason = (catalog: SeriesCatalog, series: FxSeries, date: IsoDate): FallbackReason => {
  const calendar = catalog.calendars.find((entry) => entry.id === series.calendar);
  const publishes = calendar === undefined ? undefined : isPublicationDay(calendar, date);
  if (publishes === undefined) return 'outside-calendar';
  return publishes ? 'not-observed' : 'non-publication-day';
};

const makeLeg = (plan: LegPlan, observations: ReadonlyArray<FxObservation>, details: { readonly rate: Decimal; readonly source: RateLeg['source']; readonly rateDate: IsoDate }): RateLeg => ({
  source: details.source,
  series: plan.series.id,
  base: plan.series.base,
  quote: plan.series.quote,
  unit: plan.series.unit,
  rate: details.rate,
  orientation: plan.orientation,
  rateDate: details.rateDate,
  status: observations.every((entry) => entry.status === 'final') ? 'final' : 'provisional',
  revisions: observations.map((entry) => entry.revision),
  observationDigests: [],
});

const observed = (plan: LegPlan, found: FxObservation): RateLeg => makeLeg(plan, [found], { rate: found.rate, source: 'observation', rateDate: found.rateDate });

const withDigests = (leg: RateLeg, observations: ReadonlyArray<FxObservation>, fallback?: FallbackReason): Effect.Effect<LegOutcome> =>
  Effect.map(Effect.forEach(observations, (entry) => observationDigest(entry), { concurrency: 1 }), (digests) => ({ leg: { ...leg, observationDigests: digests }, digests, fallbackReason: fallback }));

const lookback = (log: ReadonlyArray<FxObservation>, options: { readonly plan: LegPlan; readonly date: IsoDate; readonly days: number; readonly knownAt?: Instant | undefined }): FxObservation | undefined => {
  for (let offset = 1; offset <= options.days; offset += 1) {
    const found = latest(log, { series: options.plan.series.id, rateDate: addDays(options.date, -offset), knownAt: options.knownAt });
    if (found !== undefined) return found;
  }
  return undefined;
};

const applyFallback = (
  context: ResolveContext,
  plan: LegPlan,
  log: ReadonlyArray<FxObservation>,
  date: IsoDate,
): Effect.Effect<LegOutcome, RateUnavailable | RateHeld> => {
  const fallback: Fallback = context.request.clause.fallback;
  const reason = fallbackReason(context.catalog, plan.series, date);
  if (fallback._tag === 'Hold') return Effect.fail(new RateHeld({ series: plan.series.id, requestedDate: date, reason }));
  const found = lookback(log, { plan, date, days: fallback.maxLookbackDays, knownAt: context.request.knownAt });
  if (found === undefined) {
    return Effect.fail(new RateUnavailable({ series: plan.series.id, requestedDate: date, searchedFrom: addDays(date, -fallback.maxLookbackDays), reason }));
  }
  const provisional = fallback._tag === 'ProvisionalThenTrueUp';
  const leg = observed(plan, found);
  return withDigests(provisional ? { ...leg, status: 'provisional' } : leg, [found], reason);
};

const averageLeg = (context: ResolveContext, plan: LegPlan, log: ReadonlyArray<FxObservation>, period: Period): Effect.Effect<LegOutcome, RateUnavailable> => {
  const [from, to] = [firstDayOf(period), lastDayOf(period)];
  const dates = [...new Set(log.filter((entry) => entry.rateDate >= from && entry.rateDate <= to).map((entry) => entry.rateDate))].sort();
  const used = dates.flatMap((rateDate) => latest(log, { series: plan.series.id, rateDate, knownAt: context.request.knownAt }) ?? []);
  if (used.length === 0) return Effect.fail(new RateUnavailable({ series: plan.series.id, requestedDate: to, searchedFrom: from, reason: 'no observations in period' }));
  const total = used.reduce((sum, entry) => add(sum, toScaled(entry.rate)), fromInteger(0));
  const rate = fromScaled(divideBy(total, fromInteger(used.length)));
  return withDigests(makeLeg(plan, used, { rate, source: 'period-average', rateDate: to }), used);
};

const resolveLeg = (context: ResolveContext, plan: LegPlan, target: Target): Effect.Effect<LegOutcome, RateUnavailable | RateHeld | FxSourceError> =>
  Effect.flatMap(context.source.observations(plan.series.id), (log) => {
    if (target._tag === 'Average') return averageLeg(context, plan, log, target.period);
    const found = latest(log, { series: plan.series.id, rateDate: target.date, knownAt: context.request.knownAt });
    if (found === undefined) return applyFallback(context, plan, log, target.date);
    return withDigests(observed(plan, found), [found]);
  });

const fixedLeg = (route: Extract<RateClause['route'], { readonly _tag: 'Fixed' }>, request: ResolveRequest, date: IsoDate): Effect.Effect<LegOutcome, SeriesMismatch> => {
  const forward = route.base === request.base && route.quote === request.quote;
  const backward = route.base === request.quote && route.quote === request.base;
  if (!forward && !backward) return Effect.fail(new SeriesMismatch({ series: 'fixed', reason: `fixed rate quotes ${route.base}/${route.quote}` }));
  const leg: RateLeg = { source: 'fixed', base: route.base, quote: route.quote, unit: 1, rate: route.rate, orientation: forward ? 'multiply' : 'divide', rateDate: date, status: 'final', revisions: [], observationDigests: [] };
  return Effect.succeed({ leg, digests: [] });
};

const planLegs = (context: ResolveContext, target: Target): Effect.Effect<{ readonly legs: ReadonlyArray<LegOutcome>; readonly pivot?: CurrencyCode | undefined }, ResolveError> => {
  const { route } = context.request.clause;
  const { base, quote } = context.request;
  return Match.value(route).pipe(
    Match.tagsExhaustive({
      Fixed: (fixed) => Effect.map(fixedLeg(fixed, context.request, requestedDateOf(target)), (leg) => ({ legs: [leg] })),
      Direct: ({ series }) =>
        findSeries(context.catalog, series).pipe(
          Effect.flatMap((found) => orient(found, base, quote)),
          Effect.flatMap((plan) => resolveLeg(context, plan, target)),
          Effect.map((leg) => ({ legs: [leg] })),
        ),
      Triangulated: ({ pivot, fromLeg, toLeg }) =>
        Effect.gen(function* () {
          const first = yield* orient(yield* findSeries(context.catalog, fromLeg), base, pivot);
          const second = yield* orient(yield* findSeries(context.catalog, toLeg), pivot, quote);
          return { legs: [yield* resolveLeg(context, first, target), yield* resolveLeg(context, second, target)], pivot };
        }),
    }),
  );
};

const resolveWith = (context: ResolveContext, revision: { readonly revision: number; readonly supersedesDigest?: Sha256 | undefined }): Effect.Effect<FxSnapshot, ResolveError> =>
  Effect.gen(function* () {
    const { request } = context;
    if (request.base === request.quote) return yield* Effect.fail(new SeriesMismatch({ series: '-', reason: 'base and quote are the same currency' }));
    const target = yield* targetOf(request.clause.dateRule, request.dates);
    const { legs, pivot } = yield* planLegs(context, target);
    const [first, ...rest] = legs.map((outcome) => outcome.leg);
    if (first === undefined) return yield* Effect.fail(new SeriesMismatch({ series: '-', reason: 'no legs' }));
    const reason = legs.find((outcome) => outcome.fallbackReason !== undefined)?.fallbackReason;
    return yield* seal({
      clauseDigest: yield* clauseDigest(request.clause),
      purpose: request.clause.purpose,
      requestedDate: requestedDateOf(target),
      rateDate: legs.map((outcome) => outcome.leg.rateDate).reduce((max, date) => (date > max ? date : max)),
      base: request.base,
      quote: request.quote,
      rate: displayRate(chainRatio([first, ...rest])),
      pivot,
      legs: [first, ...rest],
      status: [first, ...rest].every((leg) => leg.status === 'final') ? 'final' : 'provisional',
      fallbackApplied: reason !== undefined,
      fallbackReason: reason,
      rounding: request.clause.rounding,
      observationSetDigest: yield* observationSetDigest(legs.flatMap((outcome) => outcome.digests)),
      revision: revision.revision,
      supersedesDigest: revision.supersedesDigest,
    });
  });

/**
 * Build a resolver over a catalog and a source (pure; no service lookup).
 *
 * @since 0.1.0
 * @category constructors
 */
export const make = (catalog: SeriesCatalog, source: FxRateSourceShape): FxResolverShape => ({
  resolve: (request) => resolveWith({ catalog, source, request }, { revision: 1 }),
  trueUp: (request, provisional) =>
    Effect.gen(function* () {
      if ((yield* clauseDigest(request.clause)) !== provisional.clauseDigest) {
        return yield* Effect.fail(new SeriesMismatch({ series: '-', reason: 'true-up must use the clause of the provisional snapshot' }));
      }
      const strict: ResolveRequest = { ...request, clause: { ...request.clause, fallback: { _tag: 'Hold' } } };
      const final = yield* resolveWith({ catalog, source, request: strict }, { revision: provisional.revision + 1, supersedesDigest: provisional.digest });
      if (final.status !== 'final') return yield* Effect.fail(new RateHeld({ series: '-', requestedDate: final.requestedDate, reason: 'published rate is still provisional' }));
      return final;
    }),
});

/**
 * The resolver service.
 *
 * @since 0.1.0
 * @category services
 */
export class FxResolver extends Context.Service<FxResolver, FxResolverShape>()('@snyder-tech/keiretsu/fx/FxResolver') {
  /** Resolver over `catalog`, reading observations from {@link FxRateSource}. */
  static layer(catalog: SeriesCatalog): Layer.Layer<FxResolver, never, FxRateSource> {
    return Layer.effect(FxResolver, Effect.map(FxRateSource, (source) => make(catalog, source)));
  }
}
