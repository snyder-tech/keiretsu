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
import { contains, IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

/**
 * One segment of a timeline.
 *
 * @since 0.1.0
 * @category constructors
 */
export const Segment = <S extends Schema.Top>(value: S) =>
  Schema.Struct({ value, validFrom: IsoDate, validTo: Schema.optional(IsoDate), evidence: Schema.optional(Schema.Array(EvidenceRef)) });

/**
 * Config input for a timeline: a bare value or a non-empty list of segments.
 *
 * @since 0.1.0
 * @category constructors
 */
export const TimelineInput = <S extends Schema.Top>(value: S) => Schema.Union([value, Schema.NonEmptyArray(Segment(value))]);

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

const isSegments = <A>(input: A | ReadonlyArray<SegmentInput<A>>): input is readonly [SegmentInput<A>, ...Array<SegmentInput<A>>] =>
  Array.isArray(input) && input.length > 0 && typeof input[0] === 'object' && input[0] !== null && 'validFrom' in input[0];

/**
 * Normalize a bare value or segment list into a timeline. A bare value spans `extent`.
 *
 * @since 0.1.0
 * @category constructors
 */
export const normalize = <A>(input: A | readonly [SegmentInput<A>, ...Array<SegmentInput<A>>], extent: Extent): Timeline<A> => {
  if (!isSegments(input)) {
    // SAFETY: the guard above rejects segment lists, so `input` is the bare value.
    return [{ value: input as A, validFrom: extent.validFrom, validTo: extent.validTo, evidence: [] }];
  }
  const [first, ...rest] = input.map((segment) => ({ value: segment.value, validFrom: segment.validFrom, validTo: segment.validTo, evidence: segment.evidence ?? [] }));
  // SAFETY: `input` is non-empty, so mapping it yields a first element.
  return [first as Span<A>, ...rest];
};

/**
 * Ordering, contiguity and open-end problems in a timeline, as messages.
 *
 * @since 0.1.0
 * @category checks
 */
export const problems = <A>(timeline: ReadonlyArray<Span<A>>): ReadonlyArray<string> =>
  timeline.flatMap((span, index) => {
    const next = timeline[index + 1];
    if (span.validTo !== undefined && span.validTo <= span.validFrom) return [`segment ${index} ends on or before it starts`];
    if (next === undefined) return [];
    if (span.validTo === undefined) return [`segment ${index} is open-ended but is not the last`];
    if (span.validTo !== next.validFrom) return [`segment ${index} ends ${span.validTo} but segment ${index + 1} starts ${next.validFrom}`];
    return [];
  });

/**
 * The full extent of a timeline (first start to last end).
 *
 * @since 0.1.0
 * @category accessors
 */
export const extentOf = <A>(timeline: Timeline<A>): Extent => ({ validFrom: timeline[0].validFrom, validTo: timeline[timeline.length - 1]?.validTo });

/**
 * Whether `inner` lies inside `outer` (half-open, open ends compare as infinite).
 *
 * @since 0.1.0
 * @category predicates
 */
export const within = (inner: Extent, outer: Extent): boolean =>
  inner.validFrom >= outer.validFrom && (outer.validTo === undefined || (inner.validTo !== undefined && inner.validTo <= outer.validTo));

/**
 * The value in force on `date`, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export const valueOn = <A>(timeline: ReadonlyArray<Span<A>>, date: string): A | undefined => timeline.find((span) => contains(span, date))?.value;
