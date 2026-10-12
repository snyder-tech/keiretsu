import { actsForEntity, partyKey } from '../core/PartyRef.ts';
/**
 * Capacity commitments: only a human acting for the employer commits its
 * staff, and never beyond the request or the offer
 * (committed ≤ requested ≤ offered).
 *
 * @since 0.1.0
 * @module
 */
import { Actor, type HumanActor, type HumanRequired, requireHuman } from '../core/Actor.ts';
import { EntityId } from '../core/Ids.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';

import { type CapacityOffer, WeekMinutes } from './CapacityOffer.ts';
import type { CapacityRequest } from './CapacityRequest.ts';
import { CapacityCommitmentId, CapacityOfferId, CapacityRequestId } from './WorkIds.ts';

/**
 * An employer's commitment of minutes against a request.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityCommitment = Schema.Struct({
  id: CapacityCommitmentId,
  recordedAt: Instant,
  offerId: CapacityOfferId,
  requestId: CapacityRequestId,
  committingEntity: EntityId,
  committedBy: Actor,
  minutes: WeekMinutes,
}).check(
  Schema.makeFilter((commitment) => (commitment.committedBy._tag === 'human' ? undefined : 'capacity is committed by a human')),
  Schema.makeFilter((commitment) =>
    commitment.committedBy._tag !== 'human' || actsForEntity(commitment.committedBy.actingFor, commitment.committingEntity) ? undefined : 'the committer acts for the committing entity',
  ),
);
/** @since 0.1.0 @category models */
export type CapacityCommitment = typeof CapacityCommitment.Type;

/**
 * The committer does not act for the person's employer.
 *
 * @since 0.1.0
 * @category errors
 */
export class NotEmployer extends Schema.TaggedError<NotEmployer>()('NotEmployer', { employer: Schema.String, actingFor: Schema.String }) {}

/**
 * The commitment would exceed the request or the offer, the request does not
 * belong to the offer, or the offer has expired.
 *
 * @since 0.1.0
 * @category errors
 */
export class CapacityRejected extends Schema.TaggedError<CapacityRejected>()('CapacityRejected', {
  reason: Schema.Literals(['exceeds-request', 'exceeds-offer', 'request-not-for-offer', 'offer-expired']),
}) {}

const rejection = (options: { readonly offer: CapacityOffer; readonly request: CapacityRequest; readonly minutes: number; readonly at: Instant }) => {
  const { offer, request } = options;
  if (request.offerId !== offer.id) return 'request-not-for-offer' as const;
  if (options.at >= offer.expiresAt) return 'offer-expired' as const;
  if (request.minutes > offer.offeredMinutes) return 'exceeds-offer' as const;
  if (options.minutes > request.minutes) return 'exceeds-request' as const;
  return undefined;
};

/**
 * The employer commits minutes against a request.
 *
 * @since 0.1.0
 * @category transitions
 */
export const commit = (options: {
  readonly offer: CapacityOffer;
  readonly request: CapacityRequest;
  readonly by: HumanActor;
  readonly commitment: { readonly id: typeof CapacityCommitmentId.Type; readonly minutes: number; readonly at: Instant };
}): Effect.Effect<CapacityCommitment, HumanRequired | NotEmployer | CapacityRejected | Schema.SchemaError> =>
  Effect.gen(function* () {
    const human = yield* requireHuman(options.by, 'commit-capacity');
    const { offer, request, commitment } = options;
    if (!actsForEntity(human.actingFor, offer.employer)) return yield* Effect.fail(new NotEmployer({ employer: offer.employer, actingFor: partyKey(human.actingFor) }));
    const reason = rejection({ offer, request, minutes: commitment.minutes, at: commitment.at });
    if (reason !== undefined) return yield* Effect.fail(new CapacityRejected({ reason }));
    return yield* Schema.decodeUnknownEffect(CapacityCommitment)({
      id: commitment.id,
      recordedAt: commitment.at,
      offerId: offer.id,
      requestId: request.id,
      committingEntity: offer.employer,
      committedBy: human,
      minutes: commitment.minutes,
    });
  });
