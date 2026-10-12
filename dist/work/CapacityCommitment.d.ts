/**
 * Capacity commitments: only a human acting for the employer commits its
 * staff, and never beyond the request or the offer
 * (committed ≤ requested ≤ offered).
 *
 * @since 0.1.0
 * @module
 */
import { type HumanActor, type HumanRequired } from '../core/Actor.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
import { type CapacityOffer } from './CapacityOffer.ts';
import type { CapacityRequest } from './CapacityRequest.ts';
import { CapacityCommitmentId } from './WorkIds.ts';
/**
 * An employer's commitment of minutes against a request.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacityCommitment: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/CapacityCommitmentId">;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly offerId: Schema.brand<Schema.String, "keiretsu/CapacityOfferId">;
    readonly requestId: Schema.brand<Schema.String, "keiretsu/CapacityRequestId">;
    readonly committingEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly committedBy: Schema.TaggedUnion<{
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
    readonly minutes: Schema.Number;
}>;
/** @since 0.1.0 @category models */
export type CapacityCommitment = typeof CapacityCommitment.Type;
declare const NotEmployer_base: Schema.Class<NotEmployer, Schema.TaggedStruct<"NotEmployer", {
    readonly employer: Schema.String;
    readonly actingFor: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The committer does not act for the person's employer.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NotEmployer extends NotEmployer_base {
}
declare const CapacityRejected_base: Schema.Class<CapacityRejected, Schema.TaggedStruct<"CapacityRejected", {
    readonly reason: Schema.Literals<readonly ["exceeds-request", "exceeds-offer", "request-not-for-offer", "offer-expired"]>;
}>, import("effect/Cause").YieldableError>;
/**
 * The commitment would exceed the request or the offer, the request does not
 * belong to the offer, or the offer has expired.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class CapacityRejected extends CapacityRejected_base {
}
/**
 * The employer commits minutes against a request.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const commit: (options: {
    readonly offer: CapacityOffer;
    readonly request: CapacityRequest;
    readonly by: HumanActor;
    readonly commitment: {
        readonly id: typeof CapacityCommitmentId.Type;
        readonly minutes: number;
        readonly at: Instant;
    };
}) => Effect.Effect<CapacityCommitment, HumanRequired | NotEmployer | CapacityRejected | Schema.SchemaError>;
export {};
//# sourceMappingURL=CapacityCommitment.d.ts.map