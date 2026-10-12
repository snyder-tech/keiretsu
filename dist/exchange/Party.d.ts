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
import { type PartyRef } from '../core/PartyRef.ts';
export { PartyRef, partyKey } from '../core/PartyRef.ts';
/**
 * Entity ids in the issuer's control group, supplied by the adopter's policy
 * (the entity package derives it from control relations). Ids compare case-insensitively.
 *
 * @since 0.1.0
 * @category models
 */
export type ControlGroup = ReadonlySet<string>;
/**
 * Whether a bundle from `issuer` to `audience` leaves the control group. A
 * counterparty is always outside; an issuer missing from the group is treated
 * as outside (fail closed).
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const crossesGroup: (pair: {
    readonly issuer: string;
    readonly audience: PartyRef;
}, group: ControlGroup) => boolean;
//# sourceMappingURL=Party.d.ts.map