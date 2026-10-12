/**
 * Cost objects: the things cost is measured against.
 *
 * A cost object belongs to one legal entity and may sit under a parent
 * (customer → project → work order). Internal investments name the
 * capitalisation policy that a human-made capitalisation decision applies;
 * this package never classifies a cost as capitalisable on its own.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId } from '../core/Ids.ts';
/**
 * Project, work order, customer, product, capability or internal investment.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostObject: Schema.TaggedUnion<{
    readonly product: Schema.TaggedStruct<"product", {
        readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
        readonly id: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly parent: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    }>;
    readonly project: Schema.TaggedStruct<"project", {
        readonly id: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly parent: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    }>;
    readonly "work-order": Schema.TaggedStruct<"work-order", {
        readonly workOrderId: Schema.brand<Schema.String, "keiretsu/WorkOrderId">;
        readonly id: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly parent: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    }>;
    readonly capability: Schema.TaggedStruct<"capability", {
        readonly offeringId: Schema.optional<Schema.brand<Schema.String, "keiretsu/OfferingId">>;
        readonly capabilityVersion: Schema.optional<Schema.NonEmptyString>;
        readonly id: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly parent: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    }>;
    readonly "internal-investment": Schema.TaggedStruct<"internal-investment", {
        readonly capitalizationPolicyRef: Schema.NonEmptyString;
        readonly id: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly parent: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    }>;
    readonly customer: Schema.TaggedStruct<"customer", {
        readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        readonly id: Schema.brand<Schema.String, "keiretsu/CostObjectId">;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly parent: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type CostObject = typeof CostObject.Type;
/**
 * Cost objects of one entity only (a cost object never spans entities).
 *
 * @since 0.1.0
 * @category filters
 */
export declare const ofEntity: (objects: ReadonlyArray<CostObject>, entityId: EntityId) => ReadonlyArray<CostObject>;
//# sourceMappingURL=CostObject.d.ts.map