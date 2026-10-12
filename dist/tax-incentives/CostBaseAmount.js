/**
 * A cost-base amount that is either known money, unknown (with the reason),
 * or not applicable to the regime/basis. Unknown is never rendered as zero.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Money } from "../core/Money.js";
/**
 * Known, unknown or not-applicable amount.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseAmount = Schema.TaggedUnion({
    amount: { money: Money },
    unknown: { reason: Schema.NonEmptyString },
    'not-applicable': { reason: Schema.NonEmptyString },
});
//# sourceMappingURL=CostBaseAmount.js.map