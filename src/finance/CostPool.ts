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

import { CurrencyCode } from '../core/Currency.ts';
import { EvidenceRef } from '../core/Envelope.ts';
import { brand } from '../core/Id.ts';
import { EntityId } from '../core/Ids.ts';
import { Money } from '../core/Money.ts';
import { Period } from '../core/Temporal.ts';

import { extensible } from './internal/Codes.ts';

/** @since 0.1.0 @category schemas */
export const CostPoolId = brand('keiretsu/CostPoolId');
/** @since 0.1.0 @category models */
export type CostPoolId = typeof CostPoolId.Type;

/**
 * What the pool holds. Open list: adopters may add `x-` kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostPoolKind = extensible(['payroll', 'burden', 'benefits', 'contractor', 'cloud-ai', 'tooling', 'facilities', 'overhead']);
/** @since 0.1.0 @category models */
export type CostPoolKind = typeof CostPoolKind.Type;

/**
 * How the pool's cost moves with activity.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBehaviour = Schema.Literals(['variable', 'fixed', 'mixed']);
/** @since 0.1.0 @category models */
export type CostBehaviour = typeof CostBehaviour.Type;

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
/** @since 0.1.0 @category models */
export type CostPool = typeof CostPool.Type;

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
/** @since 0.1.0 @category models */
export type PoolBalance = typeof PoolBalance.Type;
