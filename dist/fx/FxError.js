/**
 * Typed FX errors. Unknown is never zero: a missing rate fails or holds, it is
 * never replaced by a guess.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * No usable observation for the requested date within the clause's fallback.
 *
 * @since 0.1.0
 * @category errors
 */
export class RateUnavailable extends Schema.TaggedError()('RateUnavailable', {
    series: Schema.String,
    requestedDate: Schema.String,
    /** Earliest date the fallback would have accepted. */
    searchedFrom: Schema.String,
    reason: Schema.String,
}) {
}
/**
 * The clause says hold: the rate is not published (yet) and nothing is substituted.
 *
 * @since 0.1.0
 * @category errors
 */
export class RateHeld extends Schema.TaggedError()('RateHeld', {
    series: Schema.String,
    requestedDate: Schema.String,
    reason: Schema.String,
}) {
}
/**
 * The clause's date rule needs a date the request did not supply (e.g. settlement date).
 *
 * @since 0.1.0
 * @category errors
 */
export class ClauseInputMissing extends Schema.TaggedError()('ClauseInputMissing', {
    rule: Schema.String,
    field: Schema.String,
}) {
}
/**
 * A series the clause names is not declared, or does not connect the requested currencies.
 *
 * @since 0.1.0
 * @category errors
 */
export class SeriesMismatch extends Schema.TaggedError()('SeriesMismatch', {
    series: Schema.String,
    reason: Schema.String,
}) {
}
/**
 * The rate source could not be read or decoded.
 *
 * @since 0.1.0
 * @category errors
 */
export class FxSourceError extends Schema.TaggedError()('FxSourceError', {
    reason: Schema.String,
}) {
}
/**
 * An append would rewrite history: a revision that does not extend the chain.
 *
 * @since 0.1.0
 * @category errors
 */
export class ObservationConflict extends Schema.TaggedError()('ObservationConflict', {
    series: Schema.String,
    rateDate: Schema.String,
    reason: Schema.String,
}) {
}
/**
 * Hyperinflationary functional currencies (ASC 830-10-45-11, IAS 29) are out of scope; the package refuses to compute.
 *
 * @since 0.1.0
 * @category errors
 */
export class HyperinflationaryUnsupported extends Schema.TaggedError()('HyperinflationaryUnsupported', {
    currency: Schema.String,
}) {
}
/**
 * Snapshots that do not belong together (e.g. a true-up whose final snapshot does not supersede the provisional one).
 *
 * @since 0.1.0
 * @category errors
 */
export class SnapshotMismatch extends Schema.TaggedError()('SnapshotMismatch', {
    reason: Schema.String,
}) {
}
/**
 * A settlement portion with the wrong sign, or larger than the open balance.
 *
 * @since 0.1.0
 * @category errors
 */
export class SettlementExceedsBalance extends Schema.TaggedError()('SettlementExceedsBalance', {
    balanceId: Schema.String,
}) {
}
//# sourceMappingURL=FxError.js.map