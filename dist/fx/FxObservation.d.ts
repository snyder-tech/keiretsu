/**
 * Rate observations: append-only and revisioned.
 *
 * A restatement by the publisher is a new revision that names the digest of the
 * revision it supersedes; earlier revisions stay readable so a closed period's
 * snapshot remains verifiable. `recordedAt` is when the adopter learned the
 * value, which lets a resolver answer "what was known at the close".
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type Sha256 } from '../core/CanonicalJson.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { ObservationConflict } from './FxError.ts';
import { FxSeriesId, type FxSeries } from './FxSeries.ts';
/**
 * Observation status: `provisional` values may be restated by the publisher.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateStatus: Schema.Literals<readonly ["final", "provisional"]>;
/** @since 0.1.0 @category models */
export type RateStatus = typeof RateStatus.Type;
/**
 * One published rate for one series and date, as published (`quote` per `unit` `base`).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FxObservation: Schema.Struct<{
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly series: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
    readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly status: Schema.Literals<readonly ["final", "provisional"]>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type FxObservation = typeof FxObservation.Type;
/**
 * SHA-256 over the observation's canonical JSON.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const observationDigest: (observation: FxObservation) => Effect.Effect<Sha256>;
/**
 * Append an observation to a log. Re-appending an identical revision is a
 * no-op; any other change must be the next revision and name the digest of the
 * current latest one.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const append: (log: ReadonlyArray<FxObservation>, observation: FxObservation) => Effect.Effect<ReadonlyArray<FxObservation>, ObservationConflict>;
/**
 * Build a log from unordered observations, enforcing the chain.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const fromObservations: (observations: ReadonlyArray<FxObservation>) => Effect.Effect<ReadonlyArray<FxObservation>, ObservationConflict>;
/**
 * The latest revision for `series` on `rateDate` recorded at or before `knownAt` (all revisions when omitted).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const latest: (log: ReadonlyArray<FxObservation>, options: {
    readonly series: FxSeriesId;
    readonly rateDate: IsoDate;
    readonly knownAt?: Instant | undefined;
}) => FxObservation | undefined;
/**
 * Policy checks of an observation against its series definition.
 *
 * Codes: `fx.observation.series-mismatch` (error), `fx.observation.decimals-exceed-series` (hold),
 * `fx.observation.series-unverified` (warning).
 *
 * @since 0.1.0
 * @category validation
 */
export declare const check: (series: FxSeries, observation: FxObservation) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=FxObservation.d.ts.map