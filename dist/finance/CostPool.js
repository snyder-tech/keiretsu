/**
 * Cost pools and their period balances.
 *
 * A pool gathers one kind of cost for one entity in that entity's currency.
 * Its period balance is a book fact with evidence; supporting layers (payroll
 * registers, cloud invoices) reconcile to it and are never added on top.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { CurrencyCode } from "../core/Currency.js";
import { EvidenceRef } from "../core/Envelope.js";
import { brand } from "../core/Id.js";
import { EntityId } from "../core/Ids.js";
import { Money } from "../core/Money.js";
import { Period } from "../core/Temporal.js";
import { extensible } from "./internal/Codes.js";
/** @since 0.1.0 @category schemas */
export const CostPoolId = brand('keiretsu/CostPoolId');
/**
 * What the pool holds. Open list: adopters may add `x-` kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostPoolKind = extensible(['payroll', 'burden', 'benefits', 'contractor', 'cloud-ai', 'tooling', 'facilities', 'overhead']);
/**
 * How the pool's cost moves with activity.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBehaviour = Schema.Literals(['variable', 'fixed', 'mixed']);
/**
 * A cost pool of one entity in one currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostPool = Schema.Struct({
    id: CostPoolId,
    entityId: EntityId,
    name: Schema.NonEmptyString,
    kind: CostPoolKind,
    behaviour: CostBehaviour,
    recovery: Schema.Literals(['direct', 'allocated', 'capitalizable-candidate']),
    currency: CurrencyCode,
});
/**
 * The booked amount of a pool for a period, with evidence.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PoolBalance = Schema.Struct({
    poolId: CostPoolId,
    period: Period,
    amount: Money,
    evidence: Schema.Array(EvidenceRef),
});
//# sourceMappingURL=CostPool.js.map