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
/**
 * Shares sum to 10000.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const dividendRules: {
    readonly whole: import("./Invariant.ts").Rule<{
        readonly providerShareBps: number;
        readonly recipientShareBps: number;
    }>;
};
/**
 * A leg's dividend split.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DividendAllocation: Schema.Struct<{
    readonly capabilityOwner: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly providerShareBps: Schema.Number;
    readonly recipientShareBps: Schema.Number;
}>;
/** @since 0.1.0 @category models */
export type DividendAllocation = typeof DividendAllocation.Type;
//# sourceMappingURL=DividendAllocation.d.ts.map