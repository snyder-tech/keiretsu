/**
 * Who did something: a human, an agent or a system.
 *
 * Decisions that bind a company (attest, approve, accept, commit, classify)
 * take a {@link HumanActor} in their types; {@link requireHuman} guards actors
 * that arrive over the wire. Every human action records the legal entity the
 * person was acting for, which feeds permanent-establishment screening.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
export { EntityId } from './PartyRef.ts';
/** @since 0.1.0 @category schemas */
export declare const PersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
/** @since 0.1.0 @category models */
export type PersonId = typeof PersonId.Type;
/**
 * Human, agent or system actor.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Actor: Schema.TaggedUnion<{
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
/** @since 0.1.0 @category models */
export type Actor = typeof Actor.Type;
/** @since 0.1.0 @category models */
export type HumanActor = Extract<Actor, {
    readonly _tag: 'human';
}>;
/**
 * Schema accepting only human actors (for decision fields).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HumanActorSchema: Schema.TaggedStruct<"human", {
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
declare const HumanRequired_base: Schema.Class<HumanRequired, Schema.TaggedStruct<"HumanRequired", {
    readonly action: Schema.String;
    readonly actorTag: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A human-only step was attempted by an agent or system.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class HumanRequired extends HumanRequired_base {
}
/**
 * Narrow an actor to a human or fail with {@link HumanRequired}.
 *
 * @since 0.1.0
 * @category guards
 */
export declare const requireHuman: (actor: Actor, action: string) => Effect.Effect<HumanActor, HumanRequired>;
//# sourceMappingURL=Actor.d.ts.map