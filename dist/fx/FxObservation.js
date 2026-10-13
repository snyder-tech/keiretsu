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
import { digestValue } from "../core/CanonicalJson.js";
import { Decimal, toScaled } from "../core/Decimal.js";
import { AssertionFields, RevisionFields, revisionChain, verifiedHasEvidence } from "../core/Envelope.js";
import { issue } from "../core/Issue.js";
import { compareInstants, Instant, IsoDate } from "../core/Temporal.js";
import { ObservationConflict } from "./FxError.js";
import { FxSeriesId } from "./FxSeries.js";
/**
 * Observation status: `provisional` values may be restated by the publisher.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateStatus = Schema.Literals(['final', 'provisional']);
/**
 * One published rate for one series and date, as published (`quote` per `unit` `base`).
 *
 * @since 0.1.0
 * @category schemas
 */
export const FxObservation = Schema.Struct({
    series: FxSeriesId,
    rateDate: IsoDate,
    rate: Decimal,
    status: RateStatus,
    recordedAt: Instant,
    ...RevisionFields,
    ...AssertionFields,
}).check(revisionChain, verifiedHasEvidence, Schema.makeFilter((observation) => (toScaled(observation.rate) > 0n ? undefined : 'rate must be positive')));
/**
 * SHA-256 over the observation's canonical JSON.
 *
 * @since 0.1.0
 * @category digests
 */
export const observationDigest = (observation) => Effect.orDie(digestValue(Schema.encodeSync(FxObservation)(observation)));
const sameKey = (left, right) => left.series === right.series && left.rateDate === right.rateDate;
const conflict = (observation, reason) => new ObservationConflict({ series: observation.series, rateDate: observation.rateDate, reason });
const sameRevision = (left, right) => Effect.gen(function* () {
    const [a, b] = [yield* observationDigest(left), yield* observationDigest(right)];
    return a === b ? undefined : yield* Effect.fail(conflict(right, `revision ${right.revision} already recorded with different content`));
});
/**
 * Append an observation to a log. Re-appending an identical revision is a
 * no-op; any other change must be the next revision and name the digest of the
 * current latest one.
 *
 * @since 0.1.0
 * @category combinators
 */
export const append = (log, observation) => Effect.gen(function* () {
    const chain = log.filter((entry) => sameKey(entry, observation));
    const existing = chain.find((entry) => entry.revision === observation.revision);
    if (existing !== undefined)
        return (yield* sameRevision(existing, observation)) ?? log;
    const latest = chain.reduce((best, entry) => (best === undefined || entry.revision > best.revision ? entry : best), undefined);
    const expected = (latest?.revision ?? 0) + 1;
    if (observation.revision !== expected)
        return yield* Effect.fail(conflict(observation, `expected revision ${expected}, got ${observation.revision}`));
    if (latest !== undefined && observation.supersedesDigest !== (yield* observationDigest(latest))) {
        return yield* Effect.fail(conflict(observation, 'supersedesDigest does not match the latest revision'));
    }
    return [...log, observation];
});
/**
 * Build a log from unordered observations, enforcing the chain.
 *
 * @since 0.1.0
 * @category constructors
 */
export const fromObservations = (observations) => Effect.reduce([...observations].sort((left, right) => left.revision - right.revision), () => [], (log, observation) => append(log, observation));
/**
 * The latest revision for `series` on `rateDate` recorded at or before `knownAt` (all revisions when omitted).
 *
 * @since 0.1.0
 * @category accessors
 */
export const latest = (log, options) => log
    .filter((entry) => entry.series === options.series && entry.rateDate === options.rateDate)
    .filter((entry) => options.knownAt === undefined || compareInstants(entry.recordedAt, options.knownAt) <= 0)
    .reduce((best, entry) => (best === undefined || entry.revision > best.revision ? entry : best), undefined);
/**
 * Policy checks of an observation against its series definition.
 *
 * Codes: `fx.observation.series-mismatch` (error), `fx.observation.decimals-exceed-series` (hold),
 * `fx.observation.series-unverified` (warning).
 *
 * @since 0.1.0
 * @category validation
 */
export const check = (series, observation) => {
    const subject = `${observation.series}@${observation.rateDate}#${observation.revision}`;
    const decimals = observation.rate.split('.')[1]?.length ?? 0;
    return [
        ...(series.id === observation.series ? [] : [issue('fx.observation.series-mismatch', 'error', subject, `observation belongs to ${observation.series}, not ${series.id}`)]),
        ...(decimals <= series.publishedDecimals
            ? []
            : [issue('fx.observation.decimals-exceed-series', 'hold', subject, `rate has ${decimals} decimals; the series publishes ${series.publishedDecimals}`)]),
        ...(series.verification === 'verified' ? [] : [issue('fx.observation.series-unverified', 'warning', subject, `series ${series.id} definition needs verification`)]),
    ];
};
//# sourceMappingURL=FxObservation.js.map