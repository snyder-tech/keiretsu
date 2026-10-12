import { actsForEntity } from "../core/PartyRef.js";
/**
 * Firm schedules: the short planning horizon. The provider publishes, at most
 * once per civil day, which subject (pseudonymous person or role) works how
 * many minutes on which date for the fourteen days starting that day, against
 * a work order or a capacity hold. Each day's publication is the next revision of the same
 * schedule id and names the digest it supersedes, so the history is
 * append-only: one signed fact per day, from which every view is derived.
 *
 * Reassignment is never an edit. An assignment id is immutable; a revision
 * that moves work to another subject or day removes the old assignment and
 * adds a new one, and declares it in `changes` (`reassigned` names the
 * assignment it replaces). Days before a revision's `asOf` leave the horizon
 * unchanged: they are history, never rewritten.
 * `validateWork` checks consecutive revisions against these rules.
 *
 * Only a human acting for the provider (the employer) publishes a revision:
 * a firm schedule commits staff.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from "../core/Actor.js";
import { RevisionFields, revisionChain } from "../core/Envelope.js";
import { EntityId, WorkOrderId } from "../core/Ids.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { Schema } from 'effect';
import { CapacitySubject } from "./CapacityOffer.js";
import { OpenCode } from "./Code.js";
import { PartyRef } from "./PartyRef.js";
import { addDays } from "./TimeZone.js";
import { CapacityHoldId, FirmScheduleId } from "./WorkIds.js";
/**
 * Days in the firm horizon, starting at a revision's `asOf`.
 *
 * @since 0.1.0
 * @category constants
 */
export const FIRM_HORIZON_DAYS = 14;
/**
 * An assignment identifier, unique within a schedule's history.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AssignmentId = Schema.NonEmptyString.check(Schema.isMaxLength(64));
/**
 * One subject's minutes on one date, against a work order or a capacity hold.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ScheduleAssignment = Schema.Struct({
    assignmentId: AssignmentId,
    date: IsoDate,
    subject: CapacitySubject,
    minutes: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 1440 })),
    workOrderId: Schema.optional(WorkOrderId),
    holdId: Schema.optional(CapacityHoldId),
}).check(Schema.makeFilter((assignment) => (assignment.workOrderId !== undefined || assignment.holdId !== undefined ? undefined : 'an assignment names a work order or a capacity hold')));
/**
 * A declared difference from the previous revision.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ScheduleChange = Schema.TaggedUnion({
    added: { assignmentId: AssignmentId },
    removed: { assignmentId: AssignmentId, reason: OpenCode },
    reassigned: { assignmentId: AssignmentId, replaces: AssignmentId, reason: OpenCode },
});
/**
 * The first day after a revision's horizon.
 *
 * @since 0.1.0
 * @category accessors
 */
export const horizonEnd = (schedule) => addDays(schedule.asOf, FIRM_HORIZON_DAYS);
const outsideHorizon = (schedule) => {
    const end = horizonEnd(schedule);
    const stray = schedule.assignments.find((assignment) => assignment.date < schedule.asOf || assignment.date >= end);
    return stray === undefined ? undefined : `assignment ${stray.assignmentId} falls outside the ${FIRM_HORIZON_DAYS}-day horizon`;
};
const revisedByEmployer = (schedule) => schedule.revisedBy._tag === 'human' && actsForEntity(schedule.revisedBy.actingFor, schedule.provider) ? undefined : 'a firm schedule is published by a human acting for the provider';
/**
 * One daily revision of a firm schedule.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FirmSchedule = Schema.Struct({
    id: FirmScheduleId,
    ...RevisionFields,
    recordedAt: Instant,
    provider: EntityId,
    audience: PartyRef,
    /** The civil day this revision was published for; the horizon is `[asOf, asOf + 14 days)`. */
    asOf: IsoDate,
    revisedBy: Actor,
    assignments: Schema.Array(ScheduleAssignment),
    changes: Schema.Array(ScheduleChange),
}).check(revisionChain, Schema.makeFilter((schedule) => (schedule.audience._tag === 'entity' && schedule.audience.entityId === schedule.provider ? 'a schedule is addressed to another party' : undefined)), Schema.makeFilter((schedule) => (schedule.revision > 1 || schedule.changes.length === 0 ? undefined : 'revision 1 declares no changes')), Schema.makeFilter((schedule) => (new Set(schedule.assignments.map((entry) => entry.assignmentId)).size === schedule.assignments.length ? undefined : 'assignment ids are unique')), Schema.makeFilter(outsideHorizon), Schema.makeFilter(revisedByEmployer));
/**
 * A stable comparison key for an assignment's content.
 *
 * @since 0.1.0
 * @category accessors
 */
export const assignmentKey = (assignment) => JSON.stringify([assignment.assignmentId, assignment.date, assignment.subject, assignment.minutes, assignment.workOrderId ?? null, assignment.holdId ?? null]);
//# sourceMappingURL=FirmSchedule.js.map