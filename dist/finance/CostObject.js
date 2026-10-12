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
import { CostObjectId, CounterpartyId, EntityId, OfferingId, WorkOrderId } from "../core/Ids.js";
const common = {
    id: CostObjectId,
    entityId: EntityId,
    name: Schema.NonEmptyString,
    parent: Schema.optional(CostObjectId),
};
/**
 * Project, work order, customer, product, capability or internal investment.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostObject = Schema.TaggedUnion({
    project: { ...common },
    'work-order': { ...common, workOrderId: WorkOrderId },
    customer: { ...common, counterpartyId: CounterpartyId },
    product: { ...common, offeringId: OfferingId },
    capability: { ...common, offeringId: Schema.optional(OfferingId), capabilityVersion: Schema.optional(Schema.NonEmptyString) },
    'internal-investment': { ...common, capitalizationPolicyRef: Schema.NonEmptyString },
}).check(Schema.makeFilter((object) => (object.parent !== undefined && object.parent === object.id ? 'cost-object.self-parent: a cost object cannot be its own parent' : undefined)));
/**
 * Cost objects of one entity only (a cost object never spans entities).
 *
 * @since 0.1.0
 * @category filters
 */
export const ofEntity = (objects, entityId) => objects.filter((object) => object.entityId === entityId);
//# sourceMappingURL=CostObject.js.map