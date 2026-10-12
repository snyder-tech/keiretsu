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
import { Context, Effect, Layer } from 'effect';
import type { CurrencyCode } from '../core/Currency.ts';
import { type Instant, type IsoDate, type Period } from '../core/Temporal.ts';
import { ClauseInputMissing, RateHeld, RateUnavailable, SeriesMismatch, type FxSourceError } from './FxError.ts';
import { FxRateSource, type FxRateSourceShape } from './FxRateSource.ts';
import { type FxSeries, type PublicationCalendar } from './FxSeries.ts';
import { type FxSnapshot } from './FxSnapshot.ts';
import { type RateClause } from './RateClause.ts';
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
/**
 * Build a resolver over a catalog and a source (pure; no service lookup).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const make: (catalog: SeriesCatalog, source: FxRateSourceShape) => FxResolverShape;
declare const FxResolver_base: Context.ServiceClass<FxResolver, "@snyder-tech/keiretsu/fx/FxResolver", FxResolverShape>;
/**
 * The resolver service.
 *
 * @since 0.1.0
 * @category services
 */
export declare class FxResolver extends FxResolver_base {
    /** Resolver over `catalog`, reading observations from {@link FxRateSource}. */
    static layer(catalog: SeriesCatalog): Layer.Layer<FxResolver, never, FxRateSource>;
}
export {};
//# sourceMappingURL=FxResolver.d.ts.map