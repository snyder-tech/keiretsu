/** Intake is a request; it does not itself assign or authorize work. */
import { Schema } from 'effect';
import { brand } from "../core/Id.js";
import { Actor } from "../core/Actor.js";
import { PartyRef } from "../core/PartyRef.js";
import { Instant } from "../core/Temporal.js";
import { RevisionFields, revisionChain, EvidenceRef } from "../core/Envelope.js";
import { WorkObjectRef } from "./WorkObject.js";
import { SourceWorkMapping } from "./SourceWorkMapping.js";
export const WorkRequestId = brand('keiretsu/WorkRequestId');
export const WorkRequest = Schema.Struct({
    id: WorkRequestId,
    ...RevisionFields,
    recordedAt: Instant,
    requestingParty: PartyRef,
    requestedFrom: PartyRef,
    submittedBy: Actor,
    title: Schema.NonEmptyString,
    requestedOutcome: Schema.NonEmptyString,
    relatedWork: Schema.Array(WorkObjectRef),
    sourceMappings: Schema.Array(SourceWorkMapping),
    evidence: Schema.Array(EvidenceRef),
}).check(revisionChain);
//# sourceMappingURL=WorkRequest.js.map