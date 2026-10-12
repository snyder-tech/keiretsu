import { actsForEntity } from "../core/PartyRef.js";
/**
 * Standing authority: a human grants advance approval for work orders inside a
 * scope, below an auto-approve threshold and within a per-period cap, until it
 * expires (`validTo`). The grantor is recorded as the authority for every
 * order authorised under it. Authorisation only; no prices.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from "../core/Actor.js";
import { digestValue } from "../core/CanonicalJson.js";
import { BitemporalFields, RevisionFields, revisionChain, validInterval } from "../core/Envelope.js";
import { EntityId } from "../core/Ids.js";
import { contains } from "../core/Temporal.js";
import { Effect, Schema } from 'effect';
import { PartyRef, partyKey } from "./PartyRef.js";
import { BudgetMinutes } from "./WorkOrder.js";
import { WorkObjectKind, WorkObjectRef, workObjectKey } from "./WorkObject.js";
import { StandingAuthorityId } from "./WorkIds.js";
/**
 * What a standing authority covers. Omitted fields are unconstrained.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AuthorityScope = Schema.Struct({
    requestingParty: Schema.optional(PartyRef),
    performer: Schema.optional(EntityId),
    workObjectKind: Schema.optional(WorkObjectKind),
    workObject: Schema.optional(WorkObjectRef),
});
/**
 * A standing authority.
 *
 * @since 0.1.0
 * @category schemas
 */
export const StandingAuthority = Schema.Struct({
    id: StandingAuthorityId,
    ...RevisionFields,
    ...BitemporalFields,
    grantor: Actor,
    grantingEntity: EntityId,
    scope: AuthorityScope,
    period: Schema.Literals(['week', 'month']),
    capMinutes: BudgetMinutes.check(Schema.isGreaterThanOrEqualTo(1)),
    autoApproveBelowMinutes: BudgetMinutes,
}).check(revisionChain, validInterval, Schema.makeFilter((authority) => (authority.autoApproveBelowMinutes <= authority.capMinutes ? undefined : 'the auto-approve threshold lies within the cap')), Schema.makeFilter((authority) => (authority.grantor._tag === 'human' ? undefined : 'standing authority is granted by a human')), Schema.makeFilter((authority) => authority.grantor._tag !== 'human' || actsForEntity(authority.grantor.actingFor, authority.grantingEntity) ? undefined : 'the grantor acts for the granting entity'));
/**
 * Why a standing authority does not cover an order.
 *
 * @since 0.1.0
 * @category errors
 */
export class StandingAuthorityDenied extends Schema.TaggedError()('StandingAuthorityDenied', {
    reason: Schema.Literals(['inactive', 'out-of-scope', 'over-threshold', 'over-cap', 'already-authorized']),
    workOrderId: Schema.String,
}) {
}
/**
 * Whether an order falls inside an authority's scope.
 *
 * @since 0.1.0
 * @category predicates
 */
export const covers = (scope, order) => (scope.requestingParty === undefined || partyKey(scope.requestingParty) === partyKey(order.requestingParty)) &&
    (scope.performer === undefined || scope.performer === order.performer) &&
    (scope.workObjectKind === undefined || scope.workObjectKind === order.workObject.kind) &&
    (scope.workObject === undefined || workObjectKey(scope.workObject) === workObjectKey(order.workObject));
const denial = (options) => {
    const { authority, order } = options;
    if (order.authorization._tag !== 'pending')
        return 'already-authorized';
    if (!contains(authority, options.on))
        return 'inactive';
    if (!covers(authority.scope, order))
        return 'out-of-scope';
    if (order.budgetMinutes >= authority.autoApproveBelowMinutes)
        return 'over-threshold';
    if (options.consumedMinutes + order.budgetMinutes > authority.capMinutes)
        return 'over-cap';
    return undefined;
};
/**
 * Authorise a pending order under a standing authority. `consumedMinutes` is the
 * budget already authorised under it in the current period (the caller's store
 * sums it). `appliedBy` may be a system job: the human authority is the grantor.
 *
 * @since 0.1.0
 * @category transitions
 */
export const authorizeUnderStanding = (options) => Effect.gen(function* () {
    const { order, authority } = options;
    const reason = denial({ authority, order, on: options.usage.on, consumedMinutes: options.usage.consumedMinutes });
    if (reason !== undefined)
        return yield* Effect.fail(new StandingAuthorityDenied({ reason, workOrderId: order.id }));
    const authorityDigest = yield* Schema.encodeEffect(StandingAuthority)(authority).pipe(Effect.orDie, Effect.flatMap(digestValue));
    return { ...order, authorization: { _tag: 'standing', authorityId: authority.id, authorityDigest, appliedBy: options.applied.by, at: options.applied.at } };
});
//# sourceMappingURL=StandingAuthority.js.map