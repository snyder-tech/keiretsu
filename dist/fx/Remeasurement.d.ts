/**
 * Remeasure foreign-currency items into an entity's functional currency at a
 * closing snapshot (ASC 830-20-35-1; IAS 21 ¶23).
 *
 * Only monetary items are remeasured; non-monetary items stay at historical
 * rates (ASC 830-10-45-18; IAS 21 ¶23(b)). Every item must declare its nature:
 * `undetermined` holds instead of guessing. Differences are unrealized
 * transaction gains or losses in profit or loss. Sign convention throughout
 * the package: debit positive, credit negative.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import type { CurrencyCode, CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { CurrencyMismatch, type Money } from '../core/Money.ts';
import { HyperinflationaryUnsupported } from './FxError.ts';
import type { FxSnapshot } from './FxSnapshot.ts';
/**
 * Monetary classification of an account or item.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const MonetaryNature: Schema.Literals<readonly ["monetary", "non-monetary", "undetermined"]>;
/** @since 0.1.0 @category models */
export type MonetaryNature = typeof MonetaryNature.Type;
/**
 * An item to remeasure: its transaction-currency amount and current functional carrying amount.
 *
 * @since 0.1.0
 * @category models
 */
export interface RemeasureItem {
    readonly id: string;
    readonly nature: MonetaryNature;
    readonly amount: Money;
    readonly carrying: Money;
}
/**
 * One remeasured line. `difference` is the debit to the item; the offsetting
 * entry (opposite sign) goes to unrealized FX gain/loss in profit or loss.
 *
 * @since 0.1.0
 * @category models
 */
export interface RemeasuredLine {
    readonly id: string;
    readonly nature: 'monetary' | 'non-monetary';
    readonly remeasured: Money;
    readonly difference: Money;
    readonly snapshotDigest?: string | undefined;
}
/**
 * Remeasurement output; items that could not be computed appear only as issues.
 *
 * @since 0.1.0
 * @category models
 */
export interface RemeasureResult {
    readonly lines: ReadonlyArray<RemeasuredLine>;
    readonly issues: ReadonlyArray<ValidationIssue>;
}
/**
 * Remeasure items to `functional` at the closing snapshots.
 *
 * Issue codes: `fx.remeasure.nature-undetermined` (hold), `fx.remeasure.snapshot-missing` (hold).
 *
 * @since 0.1.0
 * @category accounting
 */
export declare const remeasure: (options: {
    readonly items: ReadonlyArray<RemeasureItem>;
    readonly functional: CurrencyCode;
    readonly closing: ReadonlyArray<FxSnapshot>;
    readonly table: CurrencyTableShape;
    /** Hyperinflationary functional currencies are refused (ASC 830-10-45-11; IAS 29). */
    readonly hyperinflationary?: boolean | undefined;
}) => Effect.Effect<RemeasureResult, CurrencyMismatch | UnknownCurrency | HyperinflationaryUnsupported>;
//# sourceMappingURL=Remeasurement.d.ts.map