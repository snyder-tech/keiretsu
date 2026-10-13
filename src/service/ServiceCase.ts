/** A service case is a profile of canonical work, with source-specific policy. */
import { Schema } from 'effect';
import { WorkItem } from '../work/WorkItem.ts';
import { EvidenceRef, RevisionFields, revisionChain } from '../core/Envelope.ts';
import { Instant, compareInstants } from '../core/Temporal.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { AcceptanceId, EventId, WorkOrderId } from '../core/Ids.ts';
import { Approval } from '../work/WorkOrder.ts';
import { SourceWorkState } from '../work/SourceWorkMapping.ts';

export const ServiceStatusRule = Schema.Struct({
  scope: Schema.NonEmptyString,
  sourceCode: Schema.NonEmptyString,
  operationalMeaning: Schema.NonEmptyString,
  evidence: Schema.NonEmptyArray(EvidenceRef),
});
export const ServiceProfile = Schema.Struct({
  id: Schema.NonEmptyString,
  version: Schema.NonEmptyString,
  digest: Sha256,
  sourcePolicyRef: Schema.NonEmptyString,
  statusRules: Schema.Array(ServiceStatusRule),
});
export type ServiceProfile = typeof ServiceProfile.Type;

/** Calendar and pause semantics are owned by the named source policy. */
export const ServiceObligation = Schema.Struct({
  id: Schema.NonEmptyString,
  kind: Schema.NonEmptyString,
  sourcePolicyRef: Schema.NonEmptyString,
  sourcePolicyVersion: Schema.NonEmptyString,
  calendarRef: Schema.NonEmptyString,
  calendarVersion: Schema.NonEmptyString,
  clockUnit: Schema.NonEmptyString,
  targetQuantity: Schema.NonEmptyString,
  startsAt: Instant,
  dueAt: Schema.optional(Instant),
  pauses: Schema.Array(
    Schema.Struct({ from: Instant, to: Schema.optional(Instant), reasonCode: Schema.NonEmptyString, evidence: Schema.NonEmptyArray(EvidenceRef) }).check(
      Schema.makeFilter((pause) => (pause.to === undefined || compareInstants(pause.from, pause.to) < 0 ? undefined : 'pause end follows start')),
    ),
  ),
  evidence: Schema.NonEmptyArray(EvidenceRef),
});
export type ServiceObligation = typeof ServiceObligation.Type;
export const ServiceCase = Schema.Struct({
  work: WorkItem,
  profile: ServiceProfile,
  sourceStates: Schema.Array(SourceWorkState),
  obligations: Schema.Array(ServiceObligation),
  economicEventIds: Schema.Array(EventId),
  approvals: Schema.Array(Schema.Struct({ workOrderId: WorkOrderId, workOrderRevision: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)), workOrderDigest: Sha256, approval: Approval })),
  acceptanceIds: Schema.Array(AcceptanceId),
});
export type ServiceCase = typeof ServiceCase.Type;

/** Mapping a source state conveys operational meaning only, never approval/acceptance. */
export const serviceStateMeaning = (profile: ServiceProfile, state: SourceWorkState): string | undefined =>
  state.profileId === profile.id && state.profileVersion === profile.version
    ? profile.statusRules.find((rule) => rule.scope === state.scope && rule.sourceCode === state.code)?.operationalMeaning
    : undefined;

export const ServiceProfileRevision = Schema.Struct({ ...RevisionFields, recordedAt: Instant, profile: ServiceProfile, evidence: Schema.NonEmptyArray(EvidenceRef) }).check(revisionChain);
export type ServiceProfileRevision = typeof ServiceProfileRevision.Type;
