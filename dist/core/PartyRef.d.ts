/** Canonical group-entity or counterparty reference. @since 0.1.0 @module */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const EntityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
/** @since 0.1.0 @category models */
export type EntityId = typeof EntityId.Type;
/** @since 0.1.0 @category schemas */
export declare const CounterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
/** @since 0.1.0 @category models */
export type CounterpartyId = typeof CounterpartyId.Type;
/** @since 0.1.0 @category schemas */
export declare const PartyRef: Schema.TaggedUnion<{
    readonly entity: Schema.TaggedStruct<"entity", {
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    }>;
    readonly counterparty: Schema.TaggedStruct<"counterparty", {
        readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type PartyRef = typeof PartyRef.Type;
/** @since 0.1.0 @category accessors */
export declare const partyKey: (party: PartyRef) => string;
/** @since 0.1.0 @category predicates */
export declare const sameParty: (left: PartyRef, right: PartyRef) => boolean;
/** @since 0.1.0 @category predicates */
export declare const actsForEntity: (party: PartyRef, entity: string) => boolean;
//# sourceMappingURL=PartyRef.d.ts.map