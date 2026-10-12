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
/** @since 0.1.0 @category schemas */
export declare const HoldId: Schema.brand<Schema.String, "keiretsu/HoldId">;
/** @since 0.1.0 @category schemas */
export declare const DecisionId: Schema.brand<Schema.String, "keiretsu/DecisionId">;
/**
 * What a hold or decision is about: a record kind, its id and the digest of the revision concerned.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SubjectRef: Schema.Struct<{
    readonly kind: Schema.NonEmptyString;
    readonly id: Schema.NonEmptyString;
    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type SubjectRef = typeof SubjectRef.Type;
/** @since 0.1.0 @category schemas */
export declare const Hold: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/HoldId">;
    readonly subject: Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    readonly reasonCode: Schema.NonEmptyString;
    readonly message: Schema.NonEmptyString;
    readonly raisedBy: Schema.TaggedUnion<{
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
    readonly raisedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly status: Schema.Literals<readonly ["open", "released"]>;
    readonly releasedByDecisionId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DecisionId">>;
}>;
/** @since 0.1.0 @category models */
export type Hold = typeof Hold.Type;
/** @since 0.1.0 @category schemas */
export declare const DecisionOption: Schema.Struct<{
    readonly id: Schema.NonEmptyString;
    readonly label: Schema.NonEmptyString;
    readonly impact: Schema.NonEmptyString;
}>;
/**
 * A human decision among stated options, with rationale and evidence.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Decision: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/DecisionId">;
    readonly subject: Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    readonly question: Schema.NonEmptyString;
    readonly options: Schema.NonEmptyArray<Schema.Struct<{
        readonly id: Schema.NonEmptyString;
        readonly label: Schema.NonEmptyString;
        readonly impact: Schema.NonEmptyString;
    }>>;
    readonly chosenOptionId: Schema.NonEmptyString;
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
    readonly rationale: Schema.NonEmptyString;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly releasesHoldIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/HoldId">>;
}>;
/** @since 0.1.0 @category models */
export type Decision = typeof Decision.Type;
//# sourceMappingURL=Hold.d.ts.map