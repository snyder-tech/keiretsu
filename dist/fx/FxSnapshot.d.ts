/**
 * FX snapshots: the rate a line was converted at, with full provenance.
 *
 * A snapshot is stored with every converted line. Its `legs` are
 * authoritative: conversion multiplies the legs exactly and rounds once. The
 * top-level `rate` (`quote` per 1 `base`) is a display value rounded
 * half-even at the core decimal scale and is never used to compute.
 * `digest` is SHA-256 over the RFC 8785 canonical JSON of every other member;
 * closed periods keep snapshots and never re-resolve them.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { Sha256 } from '../core/CanonicalJson.ts';
/**
 * How a leg's rate was obtained.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LegSource: Schema.Literals<readonly ["observation", "period-average", "fixed"]>;
/** @since 0.1.0 @category models */
export type LegSource = typeof LegSource.Type;
/**
 * One leg: a published (or averaged, or fixed) rate and the direction it is applied in.
 * `multiply` converts `base`→`quote`; `divide` converts `quote`→`base`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateLeg: Schema.Struct<{
    readonly source: Schema.Literals<readonly ["observation", "period-average", "fixed"]>;
    readonly series: Schema.optional<Schema.brand<Schema.String, "keiretsu/FxSeriesId">>;
    readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly unit: Schema.Number;
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly orientation: Schema.Literals<readonly ["multiply", "divide"]>;
    readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly status: Schema.Literals<readonly ["final", "provisional"]>;
    /** Observation revisions used (one per observation, in date order). */
    readonly revisions: Schema.$Array<Schema.Number>;
    readonly observationDigests: Schema.$Array<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type RateLeg = typeof RateLeg.Type;
/**
 * Why a fallback was applied.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FallbackReason: Schema.Literals<readonly ["non-publication-day", "not-observed", "outside-calendar"]>;
/** @since 0.1.0 @category models */
export type FallbackReason = typeof FallbackReason.Type;
/**
 * Snapshot content before sealing.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const UnsealedSnapshot: Schema.Struct<{
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly clauseDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly purpose: Schema.NonEmptyString;
    readonly requestedDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    /** Observed rate date (latest leg date; period end for an average). */
    readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    /** Display only: `quote` per 1 `base`, rounded half-even at the core scale. */
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly pivot: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
    readonly legs: Schema.NonEmptyArray<Schema.Struct<{
        readonly source: Schema.Literals<readonly ["observation", "period-average", "fixed"]>;
        readonly series: Schema.optional<Schema.brand<Schema.String, "keiretsu/FxSeriesId">>;
        readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly unit: Schema.Number;
        readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly orientation: Schema.Literals<readonly ["multiply", "divide"]>;
        readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly status: Schema.Literals<readonly ["final", "provisional"]>;
        /** Observation revisions used (one per observation, in date order). */
        readonly revisions: Schema.$Array<Schema.Number>;
        readonly observationDigests: Schema.$Array<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly status: Schema.Literals<readonly ["final", "provisional"]>;
    readonly fallbackApplied: Schema.Boolean;
    readonly fallbackReason: Schema.optional<Schema.Literals<readonly ["non-publication-day", "not-observed", "outside-calendar"]>>;
    readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
    /** SHA-256 over the sorted digests of every observation used. */
    readonly observationSetDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
/** @since 0.1.0 @category models */
export type UnsealedSnapshot = typeof UnsealedSnapshot.Type;
/**
 * A sealed snapshot.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FxSnapshot: Schema.Struct<{
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly clauseDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly purpose: Schema.NonEmptyString;
    readonly requestedDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    /** Observed rate date (latest leg date; period end for an average). */
    readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    /** Display only: `quote` per 1 `base`, rounded half-even at the core scale. */
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly pivot: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
    readonly legs: Schema.NonEmptyArray<Schema.Struct<{
        readonly source: Schema.Literals<readonly ["observation", "period-average", "fixed"]>;
        readonly series: Schema.optional<Schema.brand<Schema.String, "keiretsu/FxSeriesId">>;
        readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly unit: Schema.Number;
        readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly orientation: Schema.Literals<readonly ["multiply", "divide"]>;
        readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly status: Schema.Literals<readonly ["final", "provisional"]>;
        /** Observation revisions used (one per observation, in date order). */
        readonly revisions: Schema.$Array<Schema.Number>;
        readonly observationDigests: Schema.$Array<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly status: Schema.Literals<readonly ["final", "provisional"]>;
    readonly fallbackApplied: Schema.Boolean;
    readonly fallbackReason: Schema.optional<Schema.Literals<readonly ["non-publication-day", "not-observed", "outside-calendar"]>>;
    readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
    /** SHA-256 over the sorted digests of every observation used. */
    readonly observationSetDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
/** @since 0.1.0 @category models */
export type FxSnapshot = typeof FxSnapshot.Type;
/**
 * Digest of an observation set: SHA-256 over the sorted list of observation digests.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const observationSetDigest: (digests: ReadonlyArray<Sha256>) => Effect.Effect<Sha256>;
/**
 * Seal snapshot content: compute and attach its digest.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const seal: (content: UnsealedSnapshot) => Effect.Effect<FxSnapshot>;
/**
 * Whether a snapshot's digest matches its content.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const verify: (snapshot: FxSnapshot) => Effect.Effect<boolean>;
//# sourceMappingURL=FxSnapshot.d.ts.map