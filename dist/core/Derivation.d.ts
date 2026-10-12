/**
 * Derivation receipts: how an output was computed, so any number can be replayed
 * (`explain`) by an auditor, transfer-pricing examiner or tax adviser.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Output, the exact inputs and rules (by digest), the function and its version.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Derivation: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/DerivationId">;
    readonly output: Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    readonly outputDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly inputs: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly rules: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    /** Fully qualified function, e.g. `@snyder-tech/keiretsu/commerce/Charge#compute`. */
    readonly function: Schema.NonEmptyString;
    readonly functionVersion: Schema.NonEmptyString;
    readonly specVersion: Schema.String;
    readonly computedBy: Schema.TaggedUnion<{
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
    readonly computedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type Derivation = typeof Derivation.Type;
//# sourceMappingURL=Derivation.d.ts.map