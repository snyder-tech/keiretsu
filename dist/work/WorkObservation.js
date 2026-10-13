/** Activity/time observations are source facts, not automatically labour. */
import { Effect, Schema } from 'effect';
import { brand } from "../core/Id.js";
import { HumanActorSchema } from "../core/Actor.js";
import { Sha256, digestValueSync } from "../core/CanonicalJson.js";
import { Decimal } from "../core/Decimal.js";
import { ExactRatio, fromDecimal, multiply } from "../core/ExactRatio.js";
import { RoundingMode, divide as roundInteger } from "../core/Rounding.js";
import { EvidenceRef, RevisionFields, revisionChain } from "../core/Envelope.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { SourceRecordRef } from "../mapping/SourceRecordRef.js";
import { EconomicEvent, DayMinutes } from "./EconomicEvent.js";
import { PersonRef } from "./PersonRef.js";
import { WorkObjectRef } from "./WorkObject.js";
import { SourceWorkMapping } from "./SourceWorkMapping.js";
export const WorkObservationId = brand('keiretsu/WorkObservationId');
export const SourceQuantity = Schema.Struct({
    value: Decimal.check(Schema.makeFilter((value) => (value.startsWith('-') ? 'quantity is non-negative' : undefined))),
    unit: Schema.NonEmptyString,
});
export const SourceMinuteConversion = Schema.Struct({
    unit: Schema.NonEmptyString,
    minutesPerUnit: ExactRatio.check(Schema.makeFilter((ratio) => (BigInt(ratio.numerator) > 0n ? undefined : 'conversion rate is positive'))),
    rounding: Schema.TaggedUnion({ exact: {}, rounded: { mode: RoundingMode } }),
    policyRef: Schema.NonEmptyString,
    policyVersion: Schema.NonEmptyString,
    policyDigest: Sha256,
    evidence: Schema.NonEmptyArray(EvidenceRef),
});
export class SourceConversionConflict extends Schema.TaggedError()('SourceConversionConflict', { reason: Schema.Literals(['unit', 'fractional-minutes']) }) {
}
/** Exact source arithmetic; fractional minutes require the pinned policy's explicit rounding. */
export const sourceQuantityToMinutes = Effect.fn('keiretsu.sourceQuantityToMinutes')(function* (quantity, policy) {
    if (quantity.unit !== policy.unit)
        return yield* new SourceConversionConflict({ reason: 'unit' });
    const value = yield* fromDecimal(quantity.value);
    const minutes = yield* multiply(value, policy.minutesPerUnit);
    if (policy.rounding._tag === 'rounded')
        return roundInteger(BigInt(minutes.numerator), BigInt(minutes.denominator), policy.rounding.mode);
    if (minutes.denominator !== '1')
        return yield* new SourceConversionConflict({ reason: 'fractional-minutes' });
    return BigInt(minutes.numerator);
});
export const ObservedPerformer = Schema.TaggedUnion({
    resolved: { sourceSubject: SourceRecordRef, person: PersonRef, mapping: SourceWorkMapping },
    unresolved: { sourceSubject: SourceRecordRef },
});
export const WorkObservation = Schema.Struct({
    id: WorkObservationId,
    ...RevisionFields,
    digest: Sha256,
    recordedAt: Instant,
    source: SourceRecordRef,
    sourceDigest: Sha256,
    workDate: IsoDate,
    performer: ObservedPerformer,
    quantity: SourceQuantity,
    work: Schema.Array(WorkObjectRef),
    activity: Schema.optional(Schema.NonEmptyString),
    narrative: Schema.optional(Schema.String),
    sourceState: Schema.optional(Schema.NonEmptyString),
    mappingIssues: Schema.Array(Schema.NonEmptyString),
    evidence: Schema.NonEmptyArray(EvidenceRef),
    /** Only an independently admitted/attested event can be cited here. */
    qualifiedEvent: Schema.optional(EconomicEvent),
    eventAdmission: Schema.optional(Schema.Struct({
        sourceFactsDigest: Sha256,
        eventDigest: Sha256,
        admittedBy: HumanActorSchema,
        admittedAt: Instant,
        policyRef: Schema.NonEmptyString,
        policyVersion: Schema.NonEmptyString,
        policyDigest: Sha256,
        mappingDigest: Sha256,
        conversion: Schema.Struct({ source: SourceQuantity, minutes: DayMinutes, policy: SourceMinuteConversion }),
        evidence: Schema.NonEmptyArray(EvidenceRef),
    })),
}).check(revisionChain);
/** Admission pins source/mapping facts independently of the event and admission itself. */
export const observationSourceFactsDigest = (row) => {
    const { digest: _digest, qualifiedEvent: _event, eventAdmission: _admission, ...sourceFacts } = row;
    return digestValueSync(sourceFacts);
};
export const WorkSourceCoverage = Schema.Struct({
    installationId: Schema.NonEmptyString,
    from: IsoDate,
    toExclusive: IsoDate,
    state: Schema.Literals(['complete', 'missing', 'held', 'unconfigured']),
    unresolvedRows: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
    evidence: Schema.Array(EvidenceRef),
}).check(Schema.makeFilter((row) => (row.from < row.toExclusive ? undefined : 'coverage interval is non-empty')), Schema.makeFilter((row) => (row.state !== 'complete' || row.evidence.length > 0 ? undefined : 'complete coverage requires evidence')));
//# sourceMappingURL=WorkObservation.js.map