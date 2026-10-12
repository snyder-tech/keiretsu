/**
 * Who keeps the efficiency dividend (baseline − actual effort) on a value-based leg.
 *
 * `recipientShareBps` is returned to the recipient as a lower price; the
 * provider keeps the rest. Between associated parties this is an untested
 * profit split: the leg must carry transfer-pricing documentation or its
 * charges hold.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { ShareBps } from "./Code.js";
import { rule, toCheck } from "./Invariant.js";
import { PartyRef } from "./Party.js";
/**
 * Shares sum to 10000.
 *
 * @since 0.1.0
 * @category invariants
 */
export const dividendRules = {
    whole: rule('dividend.shares-not-whole', (split) => split.providerShareBps + split.recipientShareBps === 10_000 ? undefined : 'provider and recipient shares sum to 10000 bps'),
};
/**
 * A leg's dividend split.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DividendAllocation = Schema.Struct({
    capabilityOwner: PartyRef,
    providerShareBps: ShareBps,
    recipientShareBps: ShareBps,
}).check(toCheck(dividendRules.whole));
//# sourceMappingURL=DividendAllocation.js.map