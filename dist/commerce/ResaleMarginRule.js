/**
 * Resale margin rules for third-party products (in basis points, never floats).
 *
 * Whether the seller is principal or agent is an accounting judgment made by a
 * person; `undetermined` blocks activation, and an active rule cites the
 * human decision. Agent status means net revenue presentation in the finance
 * package. Pricing returns a price or a hold (missing upstream cost evidence,
 * negative margin) — never a guess. Decision support; professional review required.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { iso4217 } from "../core/Currency.js";
import * as Decimal from "../core/Decimal.js";
import { revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { DecisionId } from "../core/Hold.js";
import { OfferingId, RuleId } from "../core/Ids.js";
import * as Money from "../core/Money.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { MarkupBps, ShareBps } from "./Code.js";
import { rule, toCheck } from "./Invariant.js";
/**
 * How the resale price derives from upstream cost or list.
 *
 * - `markup-over-cost`: cost × (1 + markup)
 * - `discount-off-list`: list × (1 − discount)
 * - `margin-share`: cost + (list − cost) × (1 − sellerKeeps)
 *
 * @since 0.1.0
 * @category schemas
 */
export const MarginMethod = Schema.TaggedUnion({
    'markup-over-cost': { markupBps: MarkupBps },
    'discount-off-list': { discountBps: ShareBps },
    'margin-share': { sellerKeepsBps: ShareBps },
});
/**
 * Activation invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const resaleRules = {
    roleDetermined: rule('resale.role-undetermined', (margin) => margin.status === 'active' && margin.revenueRole === 'undetermined' ? 'principal or agent status is decided before activation' : undefined),
    roleDecided: rule('resale.role-decision-missing', (margin) => margin.status === 'active' && margin.roleDecisionId === undefined ? 'an active rule cites the human decision on principal or agent status' : undefined),
};
/**
 * A resale margin rule.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ResaleMarginRule = Schema.Struct({
    id: RuleId,
    ...RevisionFields,
    offeringId: OfferingId,
    method: MarginMethod,
    revenueRole: Schema.Literals(['principal', 'agent', 'undetermined']),
    roleDecisionId: Schema.optional(DecisionId),
    status: Schema.Literals(['draft', 'active', 'retired']),
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    recordedAt: Instant,
}).check(revisionChain, validInterval, toCheck(resaleRules.roleDetermined), toCheck(resaleRules.roleDecided));
const hold = (reasonCode, message) => ({ _tag: 'hold', reasonCode, message });
const ONE = Decimal.fromInteger(1);
const bps = (value) => Decimal.fromUnits(BigInt(value), 4);
/**
 * Price one unit under an active rule. Holds: `resale.not-active`,
 * `resale.cost-missing`, `resale.list-missing`, `resale.currency-mismatch`,
 * `resale.negative-margin`, `resale.unknown-currency`.
 *
 * @since 0.1.0
 * @category computation
 */
export const resalePrice = (margin, inputs) => {
    if (margin.status !== 'active' || margin.revenueRole === 'undetermined')
        return hold('resale.not-active', 'the rule is not active with a decided revenue role');
    const table = inputs.table ?? iso4217;
    const { cost, list } = inputs;
    if (margin.method._tag !== 'discount-off-list' && cost === undefined)
        return hold('resale.cost-missing', 'upstream cost evidence is required');
    if (margin.method._tag !== 'markup-over-cost' && list === undefined)
        return hold('resale.list-missing', 'the upstream list price is required');
    const currency = (cost ?? list)?.currency;
    if (currency === undefined || (cost !== undefined && list !== undefined && cost.currency !== list.currency))
        return hold('resale.currency-mismatch', 'cost and list share a currency');
    if (cost !== undefined && list !== undefined && Money.units(list) < Money.units(cost))
        return hold('resale.negative-margin', 'list is below cost; a person decides');
    const scaled = (money) => (money === undefined ? Effect.succeed(Decimal.fromInteger(0)) : Money.toScaledAmount(money, table));
    const program = Effect.gen(function* () {
        const costValue = yield* scaled(cost);
        const listValue = yield* scaled(list);
        const amount = MarginMethod.match(margin.method, {
            'markup-over-cost': (method) => Decimal.multiply(costValue, Decimal.add(ONE, bps(method.markupBps))),
            'discount-off-list': (method) => Decimal.multiply(listValue, Decimal.subtract(ONE, bps(method.discountBps))),
            'margin-share': (method) => Decimal.add(costValue, Decimal.multiply(Decimal.subtract(listValue, costValue), Decimal.subtract(ONE, bps(method.sellerKeepsBps)))),
        });
        return yield* Money.fromScaledAmount({ amount, currency, table, rounding: inputs.rounding });
    });
    return Effect.runSync(Effect.match(program, {
        onFailure: (error) => hold('resale.unknown-currency', `${error.code} is not in ${error.edition}`),
        onSuccess: (price) => ({ _tag: 'priced', price }),
    }));
};
//# sourceMappingURL=ResaleMarginRule.js.map