/**
 * Capacity requests: the audience of an offer asks for minutes against it for
 * a work object. A request is its own record, written by the requester.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from '../core/Actor.ts';
import { Instant } from '../core/Temporal.ts';
import { Schema } from 'effect';

import { WeekMinutes } from './CapacityOffer.ts';
import { PartyRef } from './PartyRef.ts';
import { WorkObjectRef } from './WorkObject.ts';
import { CapacityOfferId, CapacityRequestId } from './WorkIds.ts';

/**
 * A request for minutes against an offer.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapacityRequest = Schema.Struct({
  id: CapacityRequestId,
  recordedAt: Instant,
  offerId: CapacityOfferId,
  requestingParty: PartyRef,
  requestedBy: Actor,
  workObject: WorkObjectRef,
  minutes: WeekMinutes,
});
/** @since 0.1.0 @category models */
export type CapacityRequest = typeof CapacityRequest.Type;
