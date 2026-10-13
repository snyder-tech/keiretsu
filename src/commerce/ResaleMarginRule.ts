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

import { iso4217, type CurrencyTableShape } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import { revisionChain, RevisionFields, validInterval } from '../core/Envelope.ts';
import { DecisionId } from '../core/Hold.ts';
import { OfferingId, RuleId } from '../core/Ids.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';

import { MarkupBps, ShareBps } from './Code.ts';
import { rule, toCheck } from './Invariant.ts';

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
/** @since 0.1.0 @category models */
export type MarginMethod = typeof MarginMethod.Type;

interface RuleShape {
  readonly status: string;
  readonly revenueRole: string;
  readonly roleDecisionId?: string | undefined;
}

/**
 * Activation invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const resaleRules = {
  roleDetermined: rule<RuleShape>('resale.role-undetermined', (margin) =>
    margin.status === 'active' && margin.revenueRole === 'undetermined' ? 'principal or agent status is decided before activation' : undefined,
  ),
  roleDecided: rule<RuleShape>('resale.role-decision-missing', (margin) =>
    margin.status === 'active' && margin.roleDecisionId === undefined ? 'an active rule cites the human decision on principal or agent status' : undefined,
  ),
} as const;

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
/** @since 0.1.0 @category models */
export type ResaleMarginRule = typeof ResaleMarginRule.Type;

/**
 * A resale price or a hold.
 *
 * @since 0.1.0
 * @category models
 */
export type ResaleResolution = { readonly _tag: 'priced'; readonly price: Money.Money } | { readonly _tag: 'hold'; readonly reasonCode: string; readonly message: string };

const hold = (reasonCode: string, message: string): ResaleResolution => ({ _tag: 'hold', reasonCode, message });
const requiredResaleInputs = (margin: ResaleMarginRule, cost: Money.Money | undefined, list: Money.Money | undefined): ResaleResolution | undefined => {
  if (margin.method._tag !== 'discount-off-list' && cost === undefined) return hold('resale.cost-missing', 'upstream cost evidence is required');
  if (margin.method._tag !== 'markup-over-cost' && list === undefined) return hold('resale.list-missing', 'the upstream list price is required');
  return undefined;
};
const resaleAmountHold = (cost: Money.Money | undefined, list: Money.Money | undefined): ResaleResolution | undefined => {
  if (cost !== undefined && list !== undefined && cost.currency !== list.currency) return hold('resale.currency-mismatch', 'cost and list share a currency');
  if (cost !== undefined && list !== undefined && Money.units(list) < Money.units(cost)) return hold('resale.negative-margin', 'list is below cost; a person decides');
  return undefined;
};

const ONE = Decimal.fromInteger(1);
const bps = (value: number): Decimal.Scaled => Decimal.fromUnits(BigInt(value), 4);

/**
 * Price one unit under an active rule. Holds: `resale.not-active`,
 * `resale.cost-missing`, `resale.list-missing`, `resale.currency-mismatch`,
 * `resale.negative-margin`, `resale.unknown-currency`.
 *
 * @since 0.1.0
 * @category computation
 */
export const resalePrice = (
  margin: ResaleMarginRule,
  inputs: { readonly cost?: Money.Money; readonly list?: Money.Money; readonly rounding: RoundingMode; readonly table?: CurrencyTableShape },
): ResaleResolution => {
  if (margin.status !== 'active' || margin.revenueRole === 'undetermined') return hold('resale.not-active', 'the rule is not active with a decided revenue role');
  const table = inputs.table ?? iso4217;
  const { cost, list } = inputs;
  const requiredHold = requiredResaleInputs(margin, cost, list);
  if (requiredHold !== undefined) return requiredHold;
  const currency = (cost ?? list)?.currency;
  if (currency === undefined) return hold('resale.currency-mismatch', 'cost and list share a currency');
  const amountHold = resaleAmountHold(cost, list);
  if (amountHold !== undefined) return amountHold;
  const scaled = (money: Money.Money | undefined) => (money === undefined ? Effect.succeed(Decimal.fromInteger(0)) : Money.toScaledAmount(money, table));
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
  return Effect.runSync(
    Effect.match(program, {
      onFailure: (error) => hold('resale.unknown-currency', `${error.code} is not in ${error.edition}`),
      onSuccess: (price): ResaleResolution => ({ _tag: 'priced', price }),
    }),
  );
};
