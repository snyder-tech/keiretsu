/**
 * Effective-dated timelines.
 *
 * A timeline is a non-empty list of half-open segments `[validFrom, validTo)`
 * that are ordered, contiguous and non-overlapping; only the last segment may
 * be open-ended. Config may give a bare value instead, which normalizes to one
 * segment spanning the owning record's lifecycle.
 *
 * @since 0.1.0
 * @module
 */
import { EvidenceRef } from '../core/Envelope.ts';
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';
/**
 * One segment of a timeline.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const Segment: <S extends Schema.Top>(value: S) => Schema.Struct<{
    readonly value: S;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>>;
}>;
/**
 * Config input for a timeline: a bare value or a non-empty list of segments.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const TimelineInput: <S extends Schema.Top>(value: S) => Schema.Union<readonly [S, Schema.NonEmptyArray<Schema.Struct<{
    readonly value: S;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>>;
}>>]>;
/**
 * A normalized segment.
 *
 * @since 0.1.0
 * @category models
 */
export interface Span<A> {
    readonly value: A;
    readonly validFrom: IsoDate;
    readonly validTo?: IsoDate | undefined;
    readonly evidence: ReadonlyArray<EvidenceRef>;
}
/**
 * A normalized timeline.
 *
 * @since 0.1.0
 * @category models
 */
export type Timeline<A> = readonly [Span<A>, ...Array<Span<A>>];
/**
 * The half-open span a bare value covers.
 *
 * @since 0.1.0
 * @category models
 */
export interface Extent {
    readonly validFrom: IsoDate;
    readonly validTo?: IsoDate | undefined;
}
interface SegmentInput<A> {
    readonly value: A;
    readonly validFrom: IsoDate;
    readonly validTo?: IsoDate | undefined;
    readonly evidence?: ReadonlyArray<EvidenceRef> | undefined;
}
/**
 * Normalize a bare value or segment list into a timeline. A bare value spans `extent`.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const normalize: <A>(input: A | readonly [SegmentInput<A>, ...Array<SegmentInput<A>>], extent: Extent) => Timeline<A>;
/**
 * Ordering, contiguity and open-end problems in a timeline, as messages.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const problems: <A>(timeline: ReadonlyArray<Span<A>>) => ReadonlyArray<string>;
/**
 * The full extent of a timeline (first start to last end).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const extentOf: <A>(timeline: Timeline<A>) => Extent;
/**
 * Whether `inner` lies inside `outer` (half-open, open ends compare as infinite).
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const within: (inner: Extent, outer: Extent) => boolean;
/**
 * The value in force on `date`, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const valueOn: <A>(timeline: ReadonlyArray<Span<A>>, date: string) => A | undefined;
export {};
//# sourceMappingURL=Timeline.d.ts.map