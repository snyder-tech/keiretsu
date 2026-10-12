/**
 * Holds and decisions as records.
 *
 * Missing evidence or an unresolved judgment produces a {@link Hold} with a
 * reason, never a guess. A {@link Decision} by a human releases holds and is
 * cited by every output that depended on it.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Actor } from "./Actor.js";
import { Sha256 } from "./CanonicalJson.js";
import { EvidenceRef } from "./Envelope.js";
import { brand } from "./Id.js";
import { Instant } from "./Temporal.js";
/** @since 0.1.0 @category schemas */
export const HoldId = brand('keiretsu/HoldId');
/** @since 0.1.0 @category schemas */
export const DecisionId = brand('keiretsu/DecisionId');
/**
 * What a hold or decision is about: a record kind, its id and the digest of the revision concerned.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SubjectRef = Schema.Struct({ kind: Schema.NonEmptyString, id: Schema.NonEmptyString, digest: Schema.optional(Sha256) });
/** @since 0.1.0 @category schemas */
export const Hold = Schema.Struct({
    id: HoldId,
    subject: SubjectRef,
    reasonCode: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
    raisedBy: Actor,
    raisedAt: Instant,
    status: Schema.Literals(['open', 'released']),
    releasedByDecisionId: Schema.optional(DecisionId),
}).check(Schema.makeFilter((hold) => (hold.status === 'released' && hold.releasedByDecisionId === undefined ? 'a released hold names the decision that released it' : undefined)));
/** @since 0.1.0 @category schemas */
export const DecisionOption = Schema.Struct({ id: Schema.NonEmptyString, label: Schema.NonEmptyString, impact: Schema.NonEmptyString });
/**
 * A human decision among stated options, with rationale and evidence.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Decision = Schema.Struct({
    id: DecisionId,
    subject: SubjectRef,
    question: Schema.NonEmptyString,
    options: Schema.NonEmptyArray(DecisionOption),
    chosenOptionId: Schema.NonEmptyString,
    decidedBy: Actor,
    decidedAt: Instant,
    rationale: Schema.NonEmptyString,
    evidence: Schema.Array(EvidenceRef),
    releasesHoldIds: Schema.Array(HoldId),
}).check(Schema.makeFilter((decision) => (decision.decidedBy._tag === 'human' ? undefined : 'decisions are made by humans')), Schema.makeFilter((decision) => (decision.options.some((option) => option.id === decision.chosenOptionId) ? undefined : 'chosenOptionId must be one of the options')));
//# sourceMappingURL=Hold.js.map