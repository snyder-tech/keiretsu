/** @since 0.1.0 @category schemas */
export declare const HumanActorSchema: import("effect/Schema").TaggedStruct<"human", {
    readonly personId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/PersonId">;
    readonly actingFor: import("effect/Schema").TaggedUnion<{
        readonly entity: import("effect/Schema").TaggedStruct<"entity", {
            readonly entityId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: import("effect/Schema").TaggedStruct<"counterparty", {
            readonly counterpartyId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/CounterpartyId">;
        }>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type HumanActorSchema = typeof HumanActorSchema.Type;
//# sourceMappingURL=HumanActorSchema.d.ts.map