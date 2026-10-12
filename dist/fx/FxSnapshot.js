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
import { digestValue, Sha256 } from "../core/CanonicalJson.js";
import { CurrencyCode } from "../core/Currency.js";
import { Decimal, toScaled } from "../core/Decimal.js";
import { RevisionFields, revisionChain } from "../core/Envelope.js";
import { RoundingMode } from "../core/Rounding.js";
import { IsoDate } from "../core/Temporal.js";
import { RateStatus } from "./FxObservation.js";
import { FxSeriesId } from "./FxSeries.js";
/**
 * How a leg's rate was obtained.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LegSource = Schema.Literals(['observation', 'period-average', 'fixed']);
/**
 * One leg: a published (or averaged, or fixed) rate and the direction it is applied in.
 * `multiply` converts `base`→`quote`; `divide` converts `quote`→`base`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateLeg = Schema.Struct({
    source: LegSource,
    series: Schema.optional(FxSeriesId),
    base: CurrencyCode,
    quote: CurrencyCode,
    unit: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    rate: Decimal,
    orientation: Schema.Literals(['multiply', 'divide']),
    rateDate: IsoDate,
    status: RateStatus,
    /** Observation revisions used (one per observation, in date order). */
    revisions: Schema.Array(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1))),
    observationDigests: Schema.Array(Sha256),
}).check(Schema.makeFilter((leg) => (toScaled(leg.rate) > 0n ? undefined : 'fx.snapshot-rate-not-positive: leg rate must be positive')));
/**
 * Why a fallback was applied.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FallbackReason = Schema.Literals(['non-publication-day', 'not-observed', 'outside-calendar']);
const legFrom = (leg) => (leg.orientation === 'multiply' ? leg.base : leg.quote);
const legTo = (leg) => (leg.orientation === 'multiply' ? leg.quote : leg.base);
const chainConnects = (snapshot) => {
    const [first, second] = snapshot.legs;
    if (first === undefined)
        return 'a snapshot needs at least one leg';
    if (snapshot.pivot === undefined) {
        return snapshot.legs.length === 1 && legFrom(first) === snapshot.base && legTo(first) === snapshot.quote ? undefined : 'a direct snapshot has one leg from base to quote';
    }
    if (second === undefined || snapshot.legs.length !== 2)
        return 'a triangulated snapshot has exactly two legs';
    return legFrom(first) === snapshot.base && legTo(first) === snapshot.pivot && legFrom(second) === snapshot.pivot && legTo(second) === snapshot.quote
        ? undefined
        : 'triangulated legs must run base → pivot → quote';
};
const SnapshotFields = {
    clauseDigest: Sha256,
    purpose: Schema.NonEmptyString,
    requestedDate: IsoDate,
    /** Observed rate date (latest leg date; period end for an average). */
    rateDate: IsoDate,
    base: CurrencyCode,
    quote: CurrencyCode,
    /** Display only: `quote` per 1 `base`, rounded half-even at the core scale. */
    rate: Decimal,
    pivot: Schema.optional(CurrencyCode),
    legs: Schema.NonEmptyArray(RateLeg),
    status: RateStatus,
    fallbackApplied: Schema.Boolean,
    fallbackReason: Schema.optional(FallbackReason),
    rounding: RoundingMode,
    /** SHA-256 over the sorted digests of every observation used. */
    observationSetDigest: Sha256,
    ...RevisionFields,
};
/**
 * Snapshot content before sealing.
 *
 * @since 0.1.0
 * @category schemas
 */
export const UnsealedSnapshot = Schema.Struct(SnapshotFields);
/**
 * A sealed snapshot.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FxSnapshot = Schema.Struct({ ...SnapshotFields, digest: Sha256 }).check(revisionChain, Schema.makeFilter(chainConnects), Schema.makeFilter((snapshot) => (snapshot.fallbackApplied === (snapshot.fallbackReason !== undefined) ? undefined : 'fallbackReason is present exactly when a fallback applied')), Schema.makeFilter((snapshot) => (snapshot.base === snapshot.quote ? 'fx.snapshot-same-currency: base and quote must differ' : undefined)));
/**
 * Digest of an observation set: SHA-256 over the sorted list of observation digests.
 *
 * @since 0.1.0
 * @category digests
 */
export const observationSetDigest = (digests) => Effect.orDie(digestValue([...digests].sort()));
/**
 * Seal snapshot content: compute and attach its digest.
 *
 * @since 0.1.0
 * @category constructors
 */
export const seal = (content) => Effect.map(Effect.orDie(digestValue(Schema.encodeSync(UnsealedSnapshot)(content))), (digest) => Schema.decodeSync(FxSnapshot)({ ...content, digest }));
/**
 * Whether a snapshot's digest matches its content.
 *
 * @since 0.1.0
 * @category digests
 */
export const verify = (snapshot) => {
    const { digest, ...content } = snapshot;
    return Effect.map(Effect.orDie(digestValue(Schema.encodeSync(UnsealedSnapshot)(content))), (computed) => computed === digest);
};
//# sourceMappingURL=FxSnapshot.js.map