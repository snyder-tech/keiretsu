/**
 * Open codes and small numeric types shared by commerce records.
 *
 * Wire codes are open (lowercase tokens, `x-` extensions); adopter policy
 * narrows them after decode and raises holds rather than decode failures.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Lowercase dotted or dashed token, optionally an `x-` extension.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const CODE_PATTERN: RegExp;
/**
 * An open code, at most 64 characters.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const OpenCode: Schema.String;
/** @since 0.1.0 @category models */
export type OpenCode = typeof OpenCode.Type;
/**
 * A normative vocabulary that also accepts `x-` extensions.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const openVocabulary: <const L extends ReadonlyArray<string>>(values: L) => Schema.Union<readonly [Schema.Literals<L>, Schema.String]>;
/**
 * A share in basis points, 0–10000.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ShareBps: Schema.Number;
/** @since 0.1.0 @category models */
export type ShareBps = typeof ShareBps.Type;
/**
 * A markup in basis points, non-negative (may exceed 10000).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const MarkupBps: Schema.Number;
/** @since 0.1.0 @category models */
export type MarkupBps = typeof MarkupBps.Type;
/**
 * Whole minutes, non-negative.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Minutes: Schema.Number;
/** @since 0.1.0 @category models */
export type Minutes = typeof Minutes.Type;
/**
 * UN/CEFACT Recommendation 20 unit code shape (`HUR`, `DAY`, `C62`, `MON`, `E48`).
 * Membership comes from a versioned code list, not this pattern.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const UnitCode: Schema.String;
/** @since 0.1.0 @category models */
export type UnitCode = typeof UnitCode.Type;
/**
 * Whether a canonical decimal string is negative.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isNegativeDecimal: (value: string) => boolean;
//# sourceMappingURL=Code.d.ts.map