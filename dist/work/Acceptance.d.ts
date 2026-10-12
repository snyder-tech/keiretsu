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
import { type HumanActor, type HumanRequired } from '../core/Actor.ts';
import { Effect, Schema } from 'effect';
/**
 * The acceptance outcome. `deemed` records acceptance by operation of a
 * contract clause (e.g. silence past a review window); the package records it,
 * it does not compute it.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AcceptanceOutcome: Schema.TaggedUnion<{
    readonly rejected: Schema.TaggedStruct<"rejected", {
        readonly reasons: Schema.NonEmptyArray<Schema.NonEmptyString>;
    }>;
    readonly accepted: Schema.TaggedStruct<"accepted", {}>;
    readonly "accepted-with-deviations": Schema.TaggedStruct<"accepted-with-deviations", {
        readonly deviations: Schema.NonEmptyArray<Schema.NonEmptyString>;
    }>;
    readonly deemed: Schema.TaggedStruct<"deemed", {
        readonly clauseRef: Schema.NonEmptyString;
        readonly deemedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type AcceptanceOutcome = typeof AcceptanceOutcome.Type;
/**
 * An acceptance record.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Acceptance: Schema.Struct<{
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly workOrderId: Schema.optional<Schema.brand<Schema.String, "keiretsu/WorkOrderId">>;
    readonly deliverable: Schema.Struct<{
        readonly system: Schema.String;
        readonly owner: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
        readonly recordId: Schema.NonEmptyString;
        readonly label: Schema.optional<Schema.NonEmptyString>;
    }>;
    readonly acceptingParty: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly criteriaDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly outcome: Schema.TaggedUnion<{
        readonly rejected: Schema.TaggedStruct<"rejected", {
            readonly reasons: Schema.NonEmptyArray<Schema.NonEmptyString>;
        }>;
        readonly accepted: Schema.TaggedStruct<"accepted", {}>;
        readonly "accepted-with-deviations": Schema.TaggedStruct<"accepted-with-deviations", {
            readonly deviations: Schema.NonEmptyArray<Schema.NonEmptyString>;
        }>;
        readonly deemed: Schema.TaggedStruct<"deemed", {
            readonly clauseRef: Schema.NonEmptyString;
            readonly deemedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        }>;
    }>;
    readonly eventIds: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/EventId">>;
    readonly valueUnits: Schema.$Array<Schema.Struct<{
        readonly valueUnit: Schema.String;
        readonly units: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>>;
    readonly decidedBy: Schema.TaggedUnion<{
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
    readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/AcceptanceId">;
}>;
/** @since 0.1.0 @category models */
export type Acceptance = typeof Acceptance.Type;
/**
 * Acceptance fields other than the decider.
 *
 * @since 0.1.0
 * @category models
 */
export type AcceptanceDraft = Omit<typeof Acceptance.Encoded, 'decidedBy'>;
/**
 * A human decides an acceptance. Agents and systems cannot.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const accept: (options: {
    readonly draft: AcceptanceDraft;
    readonly by: HumanActor;
}) => Effect.Effect<Acceptance, HumanRequired | Schema.SchemaError>;
//# sourceMappingURL=Acceptance.d.ts.map