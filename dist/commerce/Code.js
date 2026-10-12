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
export const CODE_PATTERN = /^(?:x-)?[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
/**
 * An open code, at most 64 characters.
 *
 * @since 0.1.0
 * @category schemas
 */
export const OpenCode = Schema.String.check(Schema.isPattern(CODE_PATTERN), Schema.isMaxLength(64));
/**
 * A normative vocabulary that also accepts `x-` extensions.
 *
 * @since 0.1.0
 * @category constructors
 */
export const openVocabulary = (values) => Schema.Union([Schema.Literals(values), Schema.String.check(Schema.isPattern(/^x-[a-z0-9]+(?:[.-][a-z0-9]+)*$/), Schema.isMaxLength(64))]);
/**
 * A share in basis points, 0–10000.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ShareBps = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10_000 }));
/**
 * A markup in basis points, non-negative (may exceed 10000).
 *
 * @since 0.1.0
 * @category schemas
 */
export const MarkupBps = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 1_000_000 }));
/**
 * Whole minutes, non-negative.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Minutes = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));
/**
 * UN/CEFACT Recommendation 20 unit code shape (`HUR`, `DAY`, `C62`, `MON`, `E48`).
 * Membership comes from a versioned code list, not this pattern.
 *
 * @since 0.1.0
 * @category schemas
 */
export const UnitCode = Schema.String.check(Schema.isPattern(/^[A-Z0-9]{2,3}$/));
/**
 * Whether a canonical decimal string is negative.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isNegativeDecimal = (value) => value.startsWith('-');
//# sourceMappingURL=Code.js.map