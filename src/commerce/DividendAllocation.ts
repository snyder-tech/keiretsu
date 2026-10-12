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

import { ShareBps } from './Code.ts';
import { rule, toCheck } from './Invariant.ts';
import { PartyRef } from './Party.ts';

/**
 * Shares sum to 10000.
 *
 * @since 0.1.0
 * @category invariants
 */
export const dividendRules = {
  whole: rule<{ readonly providerShareBps: number; readonly recipientShareBps: number }>('dividend.shares-not-whole', (split) =>
    split.providerShareBps + split.recipientShareBps === 10_000 ? undefined : 'provider and recipient shares sum to 10000 bps',
  ),
} as const;

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
/** @since 0.1.0 @category models */
export type DividendAllocation = typeof DividendAllocation.Type;
