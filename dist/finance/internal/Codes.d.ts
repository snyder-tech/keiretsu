/**
 * Internal helpers shared by finance modules (not exported from the package).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import type { Money } from '../../core/Money.ts';
import type { ValidationIssue } from '../../core/Issue.ts';
/**
 * `x-` extension codes that adopters may add to any open code list.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const XExtension: Schema.String;
/**
 * An open code list: the standard literals plus `x-` extensions (wire tier stays open).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const extensible: <const L extends ReadonlyArray<string>>(literals: L) => Schema.Union<readonly [Schema.Literals<L>, Schema.String]>;
/**
 * Turn the first error issue from a validator into a schema filter message.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const firstError: (issues: ReadonlyArray<ValidationIssue>) => string | undefined;
/**
 * Decimal-place rendering of money in its minor units (e.g. `-1234.50`).
 *
 * @since 0.1.0
 * @category formatting
 */
export declare const formatMinor: (money: Money, digits: number) => string;
//# sourceMappingURL=Codes.d.ts.map