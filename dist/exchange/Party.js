/**
 * Bundle parties: the issuing legal entity, the audience (an entity or a
 * declared counterparty) and the issuer's control group.
 *
 * Both entity and counterparty ids are UUIDv7 strings, so the audience is a
 * discriminated reference on the wire rather than an ambiguous bare id.
 *
 * @since 0.1.0
 * @module
 */
import {} from "../core/PartyRef.js";
export { PartyRef, partyKey } from "../core/PartyRef.js";
/**
 * Whether a bundle from `issuer` to `audience` leaves the control group. A
 * counterparty is always outside; an issuer missing from the group is treated
 * as outside (fail closed).
 *
 * @since 0.1.0
 * @category predicates
 */
export const crossesGroup = (pair, group) => {
    const members = new Set([...group].map((id) => id.toLowerCase()));
    return !(members.has(pair.issuer.toLowerCase()) && pair.audience._tag === 'entity' && members.has(pair.audience.entityId.toLowerCase()));
};
//# sourceMappingURL=Party.js.map