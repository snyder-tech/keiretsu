import { Schema } from 'effect';
/**
 * Minutes in one week: an integer from 1 to 10,080.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WeekMinutes: Schema.Number;
/**
 * A named person (identified or pseudonymous) or only a role.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacitySubject: Schema.TaggedUnion<{
    readonly role: Schema.TaggedStruct<"role", {
        readonly roleKey: Schema.String;
    }>;
    readonly person: Schema.TaggedStruct<"person", {
        readonly person: Schema.TaggedUnion<{
            readonly identified: Schema.TaggedStruct<"identified", {
                readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            }>;
            readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                readonly pseudonym: Schema.String;
                readonly epoch: Schema.Number;
            }>;
        }>;
        readonly roleKey: Schema.optional<Schema.String>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type CapacitySubject = typeof CapacitySubject.Type;
/**
 * An offer of weekly minutes.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacityOffer: Schema.Struct<{
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly offeringEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly employer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly offeredBy: Schema.TaggedUnion<{
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
    readonly subject: Schema.TaggedUnion<{
        readonly role: Schema.TaggedStruct<"role", {
            readonly roleKey: Schema.String;
        }>;
        readonly person: Schema.TaggedStruct<"person", {
            readonly person: Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>;
            readonly roleKey: Schema.optional<Schema.String>;
        }>;
    }>;
    readonly skills: Schema.$Array<Schema.String>;
    readonly weekStartDay: Schema.Literals<readonly ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>;
    readonly weekStart: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly offeredMinutes: Schema.Number;
    readonly expiresAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/CapacityOfferId">;
}>;
/** @since 0.1.0 @category models */
export type CapacityOffer = typeof CapacityOffer.Type;
//# sourceMappingURL=CapacityOffer.d.ts.map