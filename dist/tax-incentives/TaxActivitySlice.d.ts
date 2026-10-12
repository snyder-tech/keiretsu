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
/**
 * Credit-axis category (§ 41-style).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const QreCategory: Schema.Literals<readonly ["qualified-research", "direct-supervision", "direct-support", "non-qualified"]>;
/** @since 0.1.0 @category models */
export type QreCategory = typeof QreCategory.Type;
/**
 * Deduction/amortisation-axis category (§ 174-style).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SreCategory: Schema.Literals<readonly ["software-development", "research-experimental", "not-sre"]>;
/** @since 0.1.0 @category models */
export type SreCategory = typeof SreCategory.Type;
/** @since 0.1.0 @category schemas */
export declare const Substantiation: Schema.Literals<readonly ["contemporaneous", "reconstructed", "estimated"]>;
/** @since 0.1.0 @category models */
export type Substantiation = typeof Substantiation.Type;
/**
 * One slice of a labour event.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TaxActivitySlice: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
    readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
    readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly qreCategory: Schema.Literals<readonly ["qualified-research", "direct-supervision", "direct-support", "non-qualified"]>;
    readonly sreCategory: Schema.Literals<readonly ["software-development", "research-experimental", "not-sre"]>;
    readonly businessComponentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/BusinessComponentId">>;
    readonly minutes: Schema.Number;
    /** Calendar quarter of the work date, `YYYY-Qn`. */
    readonly quarter: Schema.String;
    readonly substantiation: Schema.Literals<readonly ["contemporaneous", "reconstructed", "estimated"]>;
    readonly attestedBy: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly attestedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type TaxActivitySlice = typeof TaxActivitySlice.Type;
/**
 * Whether the slice is a candidate on either axis (and so needs a business component).
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isResearchCandidate: (slice: TaxActivitySlice) => boolean;
/**
 * The slice's category on a regime axis, or `undefined` when it is not eligible on that axis.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const categoryOn: (slice: TaxActivitySlice, axis: "qre" | "sre") => string | undefined;
//# sourceMappingURL=TaxActivitySlice.d.ts.map