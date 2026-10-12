import { Schema } from 'effect';
/**
 * Weeks in the forecast horizon.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const FORECAST_HORIZON_WEEKS = 13;
/**
 * Forecast minutes for one subject in one week (0 to 10,080).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ForecastWeek: Schema.Struct<{
    readonly weekStart: Schema.brand<Schema.String, "keiretsu/IsoDate">;
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
    readonly minutes: Schema.Number;
}>;
/** @since 0.1.0 @category models */
export type ForecastWeek = typeof ForecastWeek.Type;
/**
 * A non-binding thirteen-week capacity forecast.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapacityForecast: Schema.Struct<{
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly provider: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly preparedBy: Schema.TaggedUnion<{
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
    readonly weekStartDay: Schema.Literals<readonly ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>;
    readonly horizonStart: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    /** Always false: a forecast reserves and commits nothing. */
    readonly binding: Schema.Literal<false>;
    readonly weeks: Schema.$Array<Schema.Struct<{
        readonly weekStart: Schema.brand<Schema.String, "keiretsu/IsoDate">;
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
        readonly minutes: Schema.Number;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/CapacityForecastId">;
}>;
/** @since 0.1.0 @category models */
export type CapacityForecast = typeof CapacityForecast.Type;
//# sourceMappingURL=CapacityForecast.d.ts.map