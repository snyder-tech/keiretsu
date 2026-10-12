/** Human-only decision contract, owned by core. @since 0.1.0 @module */
import { HumanActorSchema as CoreHumanActor } from '../core/Actor.ts';
/** @since 0.1.0 @category schemas */
export const HumanActorSchema = CoreHumanActor;
/** @since 0.1.0 @category models */
export type HumanActorSchema = typeof HumanActorSchema.Type;
