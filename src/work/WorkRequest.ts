/** Intake is a request; it does not itself assign or authorize work. */
import { Schema } from 'effect';
import { brand } from '../core/Id.ts';
import { Actor } from '../core/Actor.ts';
import { PartyRef } from '../core/PartyRef.ts';
import { Instant } from '../core/Temporal.ts';
import { RevisionFields, revisionChain, EvidenceRef } from '../core/Envelope.ts';
import { WorkObjectRef } from './WorkObject.ts';
import { SourceWorkMapping } from './SourceWorkMapping.ts';

export const WorkRequestId = brand('keiretsu/WorkRequestId');
export type WorkRequestId = typeof WorkRequestId.Type;
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
export type WorkRequest = typeof WorkRequest.Type;
