/**
 * Deliverable acceptance: a human on the receiving side accepts, rejects or
 * accepts with deviations, or records a deemed acceptance under a contract
 * clause. Every acceptance cites the acceptance-criteria digest and the
 * economic events that produced the deliverable. Outcome-billed units and
 * AI-produced work are billable only through an acceptance.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, requireHuman } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { EvidenceRef, RevisionFields, revisionChain } from "../core/Envelope.js";
import { EventId, WorkOrderId } from "../core/Ids.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { Effect, Schema } from 'effect';
import { ValueQuantity } from "./EconomicEvent.js";
import { PartyRef } from "./PartyRef.js";
import { WorkObjectRef } from "./WorkObject.js";
import { AcceptanceId } from "./WorkIds.js";
/**
 * The acceptance outcome. `deemed` records acceptance by operation of a
 * contract clause (e.g. silence past a review window); the package records it,
 * it does not compute it.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AcceptanceOutcome = Schema.TaggedUnion({
    accepted: {},
    rejected: { reasons: Schema.NonEmptyArray(Schema.NonEmptyString) },
    'accepted-with-deviations': { deviations: Schema.NonEmptyArray(Schema.NonEmptyString) },
    deemed: { clauseRef: Schema.NonEmptyString, deemedOn: IsoDate },
});
/**
 * An acceptance record.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Acceptance = Schema.Struct({
    id: AcceptanceId,
    ...RevisionFields,
    recordedAt: Instant,
    workOrderId: Schema.optional(WorkOrderId),
    deliverable: WorkObjectRef,
    acceptingParty: PartyRef,
    criteriaDigest: Sha256,
    outcome: AcceptanceOutcome,
    eventIds: Schema.NonEmptyArray(EventId),
    valueUnits: Schema.Array(ValueQuantity),
    decidedBy: Actor,
    decidedAt: Instant,
    evidence: Schema.Array(EvidenceRef),
}).check(revisionChain, Schema.makeFilter((acceptance) => (acceptance.decidedBy._tag === 'human' ? undefined : 'acceptance is decided or recorded by a human')), Schema.makeFilter((acceptance) => (acceptance.outcome._tag === 'rejected' && acceptance.valueUnits.length > 0 ? 'a rejection accepts no units' : undefined)), Schema.makeFilter((acceptance) => (new Set(acceptance.eventIds).size === acceptance.eventIds.length ? undefined : 'cited events are distinct')));
/**
 * A human decides an acceptance. Agents and systems cannot.
 *
 * @since 0.1.0
 * @category transitions
 */
export const accept = (options) => Effect.gen(function* () {
    const human = yield* requireHuman(options.by, 'decide-acceptance');
    return yield* Schema.decodeUnknownEffect(Acceptance)({ ...options.draft, decidedBy: human });
});
//# sourceMappingURL=Acceptance.js.map