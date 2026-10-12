/**
 * Open code vocabularies.
 *
 * Wire codes (systems, activities, value units, meters, approval stages) are
 * open: any lowercase dotted or dashed token decodes, and `x-` marks a private
 * extension that receivers preserve but do not interpret. Adopter policy narrows
 * the accepted set after decode and raises holds, never decode failures.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * A lowercase code: `build`, `test-case`, `us.fed`, or an extension `x-acme-review`.
 *
 * @since 0.1.0
 * @category patterns
 */
export const CODE_PATTERN = /^(?:x-)?[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
/**
 * A private extension code `x-<token>`.
 *
 * @since 0.1.0
 * @category patterns
 */
export const EXTENSION_PATTERN = /^x-[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
/**
 * Any open code, at most 64 characters.
 *
 * @since 0.1.0
 * @category schemas
 */
export const OpenCode = Schema.String.check(Schema.isPattern(CODE_PATTERN), Schema.isMaxLength(64));
/**
 * An extension code `x-…`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ExtensionCode = Schema.String.check(Schema.isPattern(EXTENSION_PATTERN), Schema.isMaxLength(64));
/**
 * A normative vocabulary that also accepts `x-` extensions.
 *
 * @example
 * ```ts
 * import { openVocabulary } from './Code.ts'
 * const Relation = openVocabulary(['delivers-to', 'subcontracts'])
 * ```
 * @since 0.1.0
 * @category constructors
 */
export const openVocabulary = (values) => Schema.Union([Schema.Literals(values), ExtensionCode]);
/**
 * Whether a code is a private extension.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isExtension = (code) => EXTENSION_PATTERN.test(code);
//# sourceMappingURL=Code.js.map