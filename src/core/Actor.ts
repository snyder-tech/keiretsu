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

import { PartyRef } from './PartyRef.ts';
export { EntityId } from './PartyRef.ts';
import { brand, Uuid7 } from './Id.ts';

/** @since 0.1.0 @category schemas */
export const PersonId = brand('keiretsu/PersonId');
/** @since 0.1.0 @category models */
export type PersonId = typeof PersonId.Type;

/**
 * Human, agent or system actor.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Actor = Schema.TaggedUnion({
  human: { personId: PersonId, actingFor: PartyRef },
  agent: { agentId: Schema.NonEmptyString, operatorPersonId: PersonId, model: Schema.optional(Schema.NonEmptyString), sessionId: Schema.optional(Uuid7) },
  system: { systemId: Schema.NonEmptyString },
});
/** @since 0.1.0 @category models */
export type Actor = typeof Actor.Type;

/** @since 0.1.0 @category models */
export type HumanActor = Extract<Actor, { readonly _tag: 'human' }>;

/**
 * Schema accepting only human actors (for decision fields).
 *
 * @since 0.1.0
 * @category schemas
 */
export const HumanActorSchema = Actor.cases.human;

/**
 * A human-only step was attempted by an agent or system.
 *
 * @since 0.1.0
 * @category errors
 */
export class HumanRequired extends Schema.TaggedError<HumanRequired>()('HumanRequired', {
  action: Schema.String,
  actorTag: Schema.String,
}) {}

/**
 * Narrow an actor to a human or fail with {@link HumanRequired}.
 *
 * @since 0.1.0
 * @category guards
 */
export const requireHuman = (actor: Actor, action: string): Effect.Effect<HumanActor, HumanRequired> =>
  actor._tag === 'human' ? Effect.succeed(actor) : Effect.fail(new HumanRequired({ action, actorTag: actor._tag }));
