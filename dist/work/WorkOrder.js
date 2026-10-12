/**
 * Work orders: authorisation records for planned work. Scope lines carry
 * budget minutes; approval follows an adopter-declared chain with separation
 * of duties, or a standing authority a human granted. No prices: pricing
 * belongs to the commerce package.
 *
 * @since 0.1.0
 * @module
 */
import { Actor, requireHuman } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { BitemporalFields, RevisionFields, revisionChain, validInterval } from "../core/Envelope.js";
import { EntityId, WorkOrderId } from "../core/Ids.js";
import { Instant } from "../core/Temporal.js";
import { Effect, Schema } from 'effect';
import { nextStage } from "./ApprovalChain.js";
import { OpenCode } from "./Code.js";
import { ValueQuantity } from "./EconomicEvent.js";
import { PartyRef } from "./PartyRef.js";
import { WorkObjectRef } from "./WorkObject.js";
import { StandingAuthorityId } from "./WorkIds.js";
/**
 * Non-negative integer minutes for budgets.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BudgetMinutes = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }));
/**
 * One line of scope.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ScopeLine = Schema.Struct({
    lineId: Schema.NonEmptyString.check(Schema.isMaxLength(64)),
    description: Schema.NonEmptyString,
    budgetMinutes: BudgetMinutes,
    activity: Schema.optional(OpenCode),
    expectedUnits: Schema.optional(ValueQuantity),
});
/**
 * One stage approval.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Approval = Schema.Struct({ stage: OpenCode, by: Actor, at: Instant });
/**
 * Pending, explicitly approved along a chain, or authorised under a standing authority.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkOrderAuthorization = Schema.TaggedUnion({
    pending: {},
    explicit: { chain: OpenCode, approvals: Schema.NonEmptyArray(Approval) },
    standing: { authorityId: StandingAuthorityId, authorityDigest: Sha256, appliedBy: Actor, at: Instant },
});
const linesBalance = (order) => order.scope.reduce((total, line) => total + line.budgetMinutes, 0) === order.budgetMinutes;
/**
 * A work order: who asks whom to do what, within what budget, judged by which criteria.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkOrder = Schema.Struct({
    id: WorkOrderId,
    ...RevisionFields,
    ...BitemporalFields,
    workObject: WorkObjectRef,
    statementOfWork: Schema.optional(WorkObjectRef),
    requester: Actor,
    draftedBy: Schema.optional(Actor),
    requestingParty: PartyRef,
    performer: EntityId,
    scope: Schema.NonEmptyArray(ScopeLine),
    budgetMinutes: BudgetMinutes,
    acceptanceCriteriaDigest: Sha256,
    authorization: WorkOrderAuthorization,
}).check(revisionChain, validInterval, Schema.makeFilter((order) => (new Set(order.scope.map((line) => line.lineId)).size === order.scope.length ? undefined : 'scope line ids are unique')), Schema.makeFilter((order) => (linesBalance(order) ? undefined : 'budgetMinutes equals the sum of scope line budgets')));
/**
 * A person approved a work order they requested or drafted, or a second stage of it.
 *
 * @since 0.1.0
 * @category errors
 */
export class SeparationOfDuties extends Schema.TaggedError()('SeparationOfDuties', { workOrderId: Schema.String, personId: Schema.String, reason: Schema.String }) {
}
/**
 * Every stage of the chain is already approved, or the order is under standing authority.
 *
 * @since 0.1.0
 * @category errors
 */
export class NothingToApprove extends Schema.TaggedError()('NothingToApprove', { workOrderId: Schema.String }) {
}
/**
 * People who may not approve an order: its requester and the person accountable for its drafting.
 *
 * @since 0.1.0
 * @category accessors
 */
export const conflictedPeople = (order) => {
    const people = [];
    if (order.requester._tag === 'human')
        people.push(order.requester.personId);
    if (order.draftedBy?._tag === 'human')
        people.push(order.draftedBy.personId);
    if (order.draftedBy?._tag === 'agent')
        people.push(order.draftedBy.operatorPersonId);
    return people;
};
const priorApprovals = (order) => (order.authorization._tag === 'explicit' ? order.authorization.approvals : []);
const approvers = (approvals) => approvals.flatMap((approval) => (approval.by._tag === 'human' ? [approval.by.personId] : []));
const appendNonEmpty = (items, last) => {
    const [head, ...tail] = items;
    return head === undefined ? [last] : [head, ...tail, last];
};
/**
 * A human approves the next stage of the chain.
 *
 * @since 0.1.0
 * @category transitions
 */
export const approve = (options) => Effect.gen(function* () {
    const human = yield* requireHuman(options.by, 'approve-work-order');
    const { order, chain } = options;
    const prior = priorApprovals(order);
    const stage = order.authorization._tag === 'standing' ? undefined : nextStage(chain, prior.length);
    if (stage === undefined)
        return yield* Effect.fail(new NothingToApprove({ workOrderId: order.id }));
    if (conflictedPeople(order).includes(human.personId)) {
        return yield* Effect.fail(new SeparationOfDuties({ workOrderId: order.id, personId: human.personId, reason: 'requester or drafter' }));
    }
    if (approvers(prior).includes(human.personId)) {
        return yield* Effect.fail(new SeparationOfDuties({ workOrderId: order.id, personId: human.personId, reason: 'already approved another stage' }));
    }
    const approvals = appendNonEmpty(prior, { stage, by: human, at: options.at });
    return { ...order, authorization: { _tag: 'explicit', chain: chain.key, approvals } };
});
/**
 * Whether the order is fully approved along `chain`, in order, by distinct humans.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isFullyApproved = (order, chain) => {
    if (order.authorization._tag !== 'explicit' || order.authorization.chain !== chain.key)
        return false;
    const { approvals } = order.authorization;
    const humans = approvers(approvals);
    return approvals.length === chain.stages.length && humans.length === approvals.length && new Set(humans).size === humans.length && approvals.every((approval, index) => approval.stage === chain.stages[index]);
};
//# sourceMappingURL=WorkOrder.js.map