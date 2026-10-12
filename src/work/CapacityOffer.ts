/**
 * Capacity offers: soft availability an entity offers an audience for one
 * week. Never an allocation: the audience may request; only the employer
 * commits its own staff. The week start day is configurable (CLDR territories
 * differ); offers name a person (pseudonymous by default) or only a role.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from '../core/Actor.ts';
import { RevisionFields, revisionChain } from '../core/Envelope.ts';
import { EntityId } from '../core/Ids.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

import { OpenCode } from './Code.ts';
import { PartyRef } from './PartyRef.ts';
import { PersonRef } from './PersonRef.ts';
import { Weekday, weekdayOf } from './TimeZone.ts';
import { CapacityOfferId } from './WorkIds.ts';

/**
 * Minutes in one week: an integer from 1 to 10,080.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WeekMinutes = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 10_080 }));

/**
 * A named person (identified or pseudonymous) or only a role.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacitySubject = Schema.TaggedUnion({
  person: { person: PersonRef, roleKey: Schema.optional(OpenCode) },
  role: { roleKey: OpenCode },
});
/** @since 0.1.0 @category models */
export type CapacitySubject = typeof CapacitySubject.Type;

/**
 * An offer of weekly minutes.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityOffer = Schema.Struct({
  id: CapacityOfferId,
  ...RevisionFields,
  recordedAt: Instant,
  offeringEntity: EntityId,
  employer: EntityId,
  audience: PartyRef,
  offeredBy: Actor,
  subject: CapacitySubject,
  skills: Schema.Array(OpenCode),
  weekStartDay: Weekday,
  weekStart: IsoDate,
  offeredMinutes: WeekMinutes,
  expiresAt: Instant,
}).check(
  revisionChain,
  Schema.makeFilter((offer) => (weekdayOf(offer.weekStart) === offer.weekStartDay ? undefined : 'weekStart falls on the declared weekStartDay')),
  Schema.makeFilter((offer) => (offer.audience._tag === 'entity' && offer.audience.entityId === offer.offeringEntity ? 'capacity is offered to another party' : undefined)),
  Schema.makeFilter((offer) => (offer.expiresAt > offer.recordedAt ? undefined : 'an offer expires after it is recorded')),
);
/** @since 0.1.0 @category models */
export type CapacityOffer = typeof CapacityOffer.Type;
