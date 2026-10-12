/**
 * Where observations come from.
 *
 * Accounting resolves against committed, append-only data. Layers here take
 * the data as values or strings (no I/O): an adopter reads its files and
 * passes the text in. Live publisher adapters belong in an ingest job that
 * appends to that data, not in the resolver's path.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer } from 'effect';
import { FxSourceError, type ObservationConflict } from './FxError.ts';
import { FxObservation } from './FxObservation.ts';
import type { FxSeriesId } from './FxSeries.ts';
/**
 * Source service shape: every revision of every observation of a series.
 *
 * @since 0.1.0
 * @category models
 */
export interface FxRateSourceShape {
    readonly observations: (series: FxSeriesId) => Effect.Effect<ReadonlyArray<FxObservation>, FxSourceError>;
}
/**
 * Parse CSV observations. Header must contain exactly
 * `series,rateDate,rate,status,recordedAt,revision,supersedesDigest` (any order).
 * Blank `rate` = unpublished. Rows are `asserted` with no evidence references.
 *
 * @since 0.1.0
 * @category parsing
 */
export declare const parseCsv: (text: string) => Effect.Effect<ReadonlyArray<FxObservation>, FxSourceError>;
/**
 * Parse a strict JSON array of observations.
 *
 * @since 0.1.0
 * @category parsing
 */
export declare const parseJson: (text: string) => Effect.Effect<ReadonlyArray<FxObservation>, FxSourceError>;
declare const FxRateSource_base: Context.ServiceClass<FxRateSource, "@snyder-tech/keiretsu/fx/FxRateSource", FxRateSourceShape>;
/**
 * The rate source.
 *
 * @since 0.1.0
 * @category services
 */
export declare class FxRateSource extends FxRateSource_base {
    /** A fixed table of observations (tests, contract-fixed rates). Fails if the revision chain is broken. */
    static fixed(observations: ReadonlyArray<FxObservation>): Layer.Layer<FxRateSource, ObservationConflict>;
    /** Observations from strict JSON text (an array of `FxObservation`). */
    static fromJson(text: string): Layer.Layer<FxRateSource, FxSourceError | ObservationConflict>;
    /** Observations from CSV text; see {@link parseCsv}. */
    static fromCsv(text: string): Layer.Layer<FxRateSource, FxSourceError | ObservationConflict>;
}
export {};
//# sourceMappingURL=FxRateSource.d.ts.map