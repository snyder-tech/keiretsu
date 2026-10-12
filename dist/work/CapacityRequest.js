/**
 * Capacity requests: the audience of an offer asks for minutes against it for
 * a work object. A request is its own record, written by the requester.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from "../core/Actor.js";
import { Instant } from "../core/Temporal.js";
import { Schema } from 'effect';
import { WeekMinutes } from "./CapacityOffer.js";
import { PartyRef } from "./PartyRef.js";
import { WorkObjectRef } from "./WorkObject.js";
import { CapacityOfferId, CapacityRequestId } from "./WorkIds.js";
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
//# sourceMappingURL=CapacityRequest.js.map