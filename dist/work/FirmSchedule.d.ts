import { Schema } from 'effect';
/**
 * Days in the firm horizon, starting at a revision's `asOf`.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const FIRM_HORIZON_DAYS = 14;
/**
 * An assignment identifier, unique within a schedule's history.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AssignmentId: Schema.NonEmptyString;
/**
 * One subject's minutes on one date, against a work order or a capacity hold.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ScheduleAssignment: Schema.Struct<{
    readonly assignmentId: Schema.NonEmptyString;
    readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly subject: Schema.TaggedUnion<{
        readonly role: Schema.TaggedStruct<"role", {
            readonly roleKey: Schema.String;
        }>;
        readonly person: Schema.TaggedStruct<"person", {
            readonly person: Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>;
            readonly roleKey: Schema.optional<Schema.String>;
        }>;
    }>;
    readonly minutes: Schema.Number;
    readonly workOrderId: Schema.optional<Schema.brand<Schema.String, "keiretsu/WorkOrderId">>;
    readonly holdId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CapacityHoldId">>;
}>;
/** @since 0.1.0 @category models */
export type ScheduleAssignment = typeof ScheduleAssignment.Type;
/**
 * A declared difference from the previous revision.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ScheduleChange: Schema.TaggedUnion<{
    readonly removed: Schema.TaggedStruct<"removed", {
        readonly assignmentId: Schema.NonEmptyString;
        readonly reason: Schema.String;
    }>;
    readonly added: Schema.TaggedStruct<"added", {
        readonly assignmentId: Schema.NonEmptyString;
    }>;
    readonly reassigned: Schema.TaggedStruct<"reassigned", {
        readonly assignmentId: Schema.NonEmptyString;
        readonly replaces: Schema.NonEmptyString;
        readonly reason: Schema.String;
    }>;
}>;
/** @since 0.1.0 @category models */
export type ScheduleChange = typeof ScheduleChange.Type;
/**
 * The first day after a revision's horizon.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const horizonEnd: (schedule: {
    readonly asOf: string;
}) => string;
/**
 * One daily revision of a firm schedule.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FirmSchedule: Schema.Struct<{
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly provider: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    /** The civil day this revision was published for; the horizon is `[asOf, asOf + 14 days)`. */
    readonly asOf: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly revisedBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
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
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly assignments: Schema.$Array<Schema.Struct<{
        readonly assignmentId: Schema.NonEmptyString;
        readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly subject: Schema.TaggedUnion<{
            readonly role: Schema.TaggedStruct<"role", {
                readonly roleKey: Schema.String;
            }>;
            readonly person: Schema.TaggedStruct<"person", {
                readonly person: Schema.TaggedUnion<{
                    readonly identified: Schema.TaggedStruct<"identified", {
                        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                    }>;
                    readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                        readonly pseudonym: Schema.String;
                        readonly epoch: Schema.Number;
                    }>;
                }>;
                readonly roleKey: Schema.optional<Schema.String>;
            }>;
        }>;
        readonly minutes: Schema.Number;
        readonly workOrderId: Schema.optional<Schema.brand<Schema.String, "keiretsu/WorkOrderId">>;
        readonly holdId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CapacityHoldId">>;
    }>>;
    readonly changes: Schema.$Array<Schema.TaggedUnion<{
        readonly removed: Schema.TaggedStruct<"removed", {
            readonly assignmentId: Schema.NonEmptyString;
            readonly reason: Schema.String;
        }>;
        readonly added: Schema.TaggedStruct<"added", {
            readonly assignmentId: Schema.NonEmptyString;
        }>;
        readonly reassigned: Schema.TaggedStruct<"reassigned", {
            readonly assignmentId: Schema.NonEmptyString;
            readonly replaces: Schema.NonEmptyString;
            readonly reason: Schema.String;
        }>;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/FirmScheduleId">;
}>;
/** @since 0.1.0 @category models */
export type FirmSchedule = typeof FirmSchedule.Type;
/**
 * A stable comparison key for an assignment's content.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const assignmentKey: (assignment: ScheduleAssignment) => string;
//# sourceMappingURL=FirmSchedule.d.ts.map