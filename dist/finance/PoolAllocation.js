/**
 * Exact pool allocation to cost objects.
 *
 * {@link allocatePool} splits a pool balance across the targets of the single
 * approved rule in effect, by driver quantity, using core largest-remainder
 * allocation so the lines sum to the balance in minor units. When no rule
 * applies, the rule is ambiguous or driver data is missing, the whole balance
 * stays on an explicit `unallocated` line with a hold. There is no balancing
 * plug and no fallback rule.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { allocateMoney } from "../core/Allocation.js";
import * as Decimal from "../core/Decimal.js";
import { EvidenceRef } from "../core/Envelope.js";
import { CostObjectId, RuleId } from "../core/Ids.js";
import { issue, ValidationIssue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { IsoDate, Period } from "../core/Temporal.js";
import { rulesInEffect } from "./AllocationRule.js";
import { CostPoolId } from "./CostPool.js";
/**
 * A measured driver quantity for one cost object in a period.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DriverMeasurement = Schema.Struct({
    driverTag: Schema.NonEmptyString,
    costObjectId: CostObjectId,
    period: Period,
    quantity: Decimal.Decimal.check(Schema.makeFilter((value) => (value.startsWith('-') ? 'driver quantities are non-negative' : undefined))),
    evidence: Schema.Array(EvidenceRef),
});
/**
 * One allocation output line.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AllocationLine = Schema.TaggedUnion({
    allocated: { costObjectId: CostObjectId, amount: Money.Money, ruleId: RuleId, ruleRevision: Schema.Number },
    unallocated: { amount: Money.Money, reasonCode: Schema.NonEmptyString },
});
/**
 * Allocation of one pool balance for one period.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PoolAllocation = Schema.Struct({
    poolId: CostPoolId,
    period: Period,
    total: Money.Money,
    lines: Schema.NonEmptyArray(AllocationLine),
    issues: Schema.Array(ValidationIssue),
});
const unallocated = (balance, code, message) => ({
    poolId: balance.poolId,
    period: balance.period,
    total: balance.amount,
    lines: [{ _tag: 'unallocated', amount: balance.amount, reasonCode: code }],
    issues: [issue(code, 'hold', balance.poolId, message)],
});
const mapNonEmpty = (items, f) => {
    const [head, ...tail] = items;
    return [f(head), ...tail.map(f)];
};
const weightsFor = (rule, measurements, period) => {
    const weights = [];
    for (const target of rule.targets) {
        const found = measurements.filter((entry) => entry.costObjectId === target && entry.period === period && entry.driverTag === rule.driver._tag);
        if (found.length !== 1)
            return `${found.length === 0 ? 'no' : 'several'} ${rule.driver._tag} measurements for ${target}`;
        // SAFETY: found has exactly one element (checked above).
        weights.push({ key: target, weight: Decimal.toScaled(found[0].quantity) });
    }
    return weights;
};
/**
 * Allocate a pool balance exactly. The first day of the balance's period selects the rule version.
 *
 * Hold codes on the `unallocated` line: `allocation.currency`, `allocation.no-rule`,
 * `allocation.ambiguous-rule`, `allocation.entity-mismatch`, `allocation.measurement-missing`,
 * `allocation.zero-driver`.
 *
 * @since 0.1.0
 * @category allocation
 */
export const allocatePool = (options) => {
    const { pool, balance } = options;
    if (balance.amount.currency !== pool.currency)
        return Effect.succeed(unallocated(balance, 'allocation.currency', `balance in ${balance.amount.currency}, pool in ${pool.currency}`));
    const date = Schema.decodeSync(IsoDate)(`${balance.period}-01`);
    const candidates = rulesInEffect(options.rules, pool.id, date);
    if (candidates.length === 0)
        return Effect.succeed(unallocated(balance, 'allocation.no-rule', `no approved rule for the pool on ${date}`));
    if (candidates.length > 1)
        return Effect.succeed(unallocated(balance, 'allocation.ambiguous-rule', `${candidates.length} rule versions in effect on ${date}`));
    // SAFETY: candidates has exactly one element (checked above).
    const rule = candidates[0];
    if (rule.entityId !== pool.entityId)
        return Effect.succeed(unallocated(balance, 'allocation.entity-mismatch', 'rule belongs to another entity'));
    const weights = weightsFor(rule, options.measurements, balance.period);
    if (typeof weights === 'string')
        return Effect.succeed(unallocated(balance, 'allocation.measurement-missing', weights));
    return allocateMoney(balance.amount, weights).pipe(Effect.map((parts) => ({
        poolId: balance.poolId,
        period: balance.period,
        total: balance.amount,
        lines: mapNonEmpty(rule.targets, (target) => ({
            _tag: 'allocated',
            costObjectId: target,
            amount: parts.get(target) ?? Money.zero(balance.amount.currency),
            ruleId: rule.id,
            ruleRevision: rule.revision,
        })),
        issues: [],
    })), Effect.catchTag('InvalidWeights', (error) => Effect.succeed(unallocated(balance, 'allocation.zero-driver', error.reason))));
};
/**
 * Sum of an allocation's lines (equals `total` by construction).
 *
 * @since 0.1.0
 * @category math
 */
export const allocatedTotal = (allocation) => allocation.lines.reduce((sum, line) => sum + Money.units(line.amount), 0n);
//# sourceMappingURL=PoolAllocation.js.map