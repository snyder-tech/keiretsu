/**
 * Typed FX errors. Unknown is never zero: a missing rate fails or holds, it is
 * never replaced by a guess.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
declare const RateUnavailable_base: Schema.Class<RateUnavailable, Schema.TaggedStruct<"RateUnavailable", {
    readonly series: Schema.String;
    readonly requestedDate: Schema.String;
    /** Earliest date the fallback would have accepted. */
    readonly searchedFrom: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * No usable observation for the requested date within the clause's fallback.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class RateUnavailable extends RateUnavailable_base {
}
declare const RateHeld_base: Schema.Class<RateHeld, Schema.TaggedStruct<"RateHeld", {
    readonly series: Schema.String;
    readonly requestedDate: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The clause says hold: the rate is not published (yet) and nothing is substituted.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class RateHeld extends RateHeld_base {
}
declare const ClauseInputMissing_base: Schema.Class<ClauseInputMissing, Schema.TaggedStruct<"ClauseInputMissing", {
    readonly rule: Schema.String;
    readonly field: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The clause's date rule needs a date the request did not supply (e.g. settlement date).
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ClauseInputMissing extends ClauseInputMissing_base {
}
declare const SeriesMismatch_base: Schema.Class<SeriesMismatch, Schema.TaggedStruct<"SeriesMismatch", {
    readonly series: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A series the clause names is not declared, or does not connect the requested currencies.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class SeriesMismatch extends SeriesMismatch_base {
}
declare const FxSourceError_base: Schema.Class<FxSourceError, Schema.TaggedStruct<"FxSourceError", {
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The rate source could not be read or decoded.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class FxSourceError extends FxSourceError_base {
}
declare const ObservationConflict_base: Schema.Class<ObservationConflict, Schema.TaggedStruct<"ObservationConflict", {
    readonly series: Schema.String;
    readonly rateDate: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * An append would rewrite history: a revision that does not extend the chain.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ObservationConflict extends ObservationConflict_base {
}
declare const HyperinflationaryUnsupported_base: Schema.Class<HyperinflationaryUnsupported, Schema.TaggedStruct<"HyperinflationaryUnsupported", {
    readonly currency: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Hyperinflationary functional currencies (ASC 830-10-45-11, IAS 29) are out of scope; the package refuses to compute.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class HyperinflationaryUnsupported extends HyperinflationaryUnsupported_base {
}
declare const SnapshotMismatch_base: Schema.Class<SnapshotMismatch, Schema.TaggedStruct<"SnapshotMismatch", {
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Snapshots that do not belong together (e.g. a true-up whose final snapshot does not supersede the provisional one).
 *
 * @since 0.1.0
 * @category errors
 */
export declare class SnapshotMismatch extends SnapshotMismatch_base {
}
declare const SettlementExceedsBalance_base: Schema.Class<SettlementExceedsBalance, Schema.TaggedStruct<"SettlementExceedsBalance", {
    readonly balanceId: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A settlement portion with the wrong sign, or larger than the open balance.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class SettlementExceedsBalance extends SettlementExceedsBalance_base {
}
export {};
//# sourceMappingURL=FxError.d.ts.map