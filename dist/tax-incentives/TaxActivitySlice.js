/**
 * Tax activity slices: one labour event's minutes split for tax purposes.
 *
 * The credit axis (`qreCategory`) and the deduction/amortisation axis
 * (`sreCategory`) are separate: routine software development can be
 * non-qualified for the credit and still be a research expenditure for
 * amortisation. A slice cites its event by id **and** digest, so a revised
 * event invalidates the slices cut from the old revision.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Sha256 } from "../core/CanonicalJson.js";
import { EvidenceRef } from "../core/Envelope.js";
import { AttributionId, EventId } from "../core/Ids.js";
import { Instant } from "../core/Temporal.js";
import { BusinessComponentId } from "./BusinessComponent.js";
import { HumanActorSchema } from "./HumanActorSchema.js";
/**
 * Credit-axis category (§ 41-style).
 *
 * @since 0.1.0
 * @category schemas
 */
export const QreCategory = Schema.Literals(['qualified-research', 'direct-supervision', 'direct-support', 'non-qualified']);
/**
 * Deduction/amortisation-axis category (§ 174-style).
 *
 * @since 0.1.0
 * @category schemas
 */
export const SreCategory = Schema.Literals(['software-development', 'research-experimental', 'not-sre']);
/** @since 0.1.0 @category schemas */
export const Substantiation = Schema.Literals(['contemporaneous', 'reconstructed', 'estimated']);
/**
 * One slice of a labour event.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TaxActivitySlice = Schema.Struct({
    id: AttributionId,
    eventId: EventId,
    eventDigest: Sha256,
    qreCategory: QreCategory,
    sreCategory: SreCategory,
    businessComponentId: Schema.optional(BusinessComponentId),
    minutes: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    /** Calendar quarter of the work date, `YYYY-Qn`. */
    quarter: Schema.String.check(Schema.isPattern(/^\d{4}-Q[1-4]$/)),
    substantiation: Substantiation,
    attestedBy: HumanActorSchema,
    attestedAt: Instant,
    evidence: Schema.Array(EvidenceRef),
    recordedAt: Instant,
});
/**
 * Whether the slice is a candidate on either axis (and so needs a business component).
 *
 * @since 0.1.0
 * @category predicates
 */
export const isResearchCandidate = (slice) => slice.qreCategory !== 'non-qualified' || slice.sreCategory !== 'not-sre';
/**
 * The slice's category on a regime axis, or `undefined` when it is not eligible on that axis.
 *
 * @since 0.1.0
 * @category accessors
 */
export const categoryOn = (slice, axis) => {
    if (axis === 'qre')
        return slice.qreCategory === 'non-qualified' ? undefined : slice.qreCategory;
    return slice.sreCategory === 'not-sre' ? undefined : slice.sreCategory;
};
//# sourceMappingURL=TaxActivitySlice.js.map