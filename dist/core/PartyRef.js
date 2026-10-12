/** Canonical group-entity or counterparty reference. @since 0.1.0 @module */
import { Schema } from 'effect';
import { brand } from "./Id.js";
/** @since 0.1.0 @category schemas */
export const EntityId = brand('keiretsu/EntityId');
/** @since 0.1.0 @category schemas */
export const CounterpartyId = brand('keiretsu/CounterpartyId');
/** @since 0.1.0 @category schemas */
export const PartyRef = Schema.TaggedUnion({ entity: { entityId: EntityId }, counterparty: { counterpartyId: CounterpartyId } });
/** @since 0.1.0 @category accessors */
export const partyKey = (party) => (party._tag === 'entity' ? `entity:${party.entityId.toLowerCase()}` : `counterparty:${party.counterpartyId.toLowerCase()}`);
/** @since 0.1.0 @category predicates */
export const sameParty = (left, right) => partyKey(left) === partyKey(right);
/** @since 0.1.0 @category predicates */
export const actsForEntity = (party, entity) => party._tag === 'entity' && party.entityId === entity;
//# sourceMappingURL=PartyRef.js.map