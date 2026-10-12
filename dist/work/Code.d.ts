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
export declare const CODE_PATTERN: RegExp;
/**
 * A private extension code `x-<token>`.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const EXTENSION_PATTERN: RegExp;
/**
 * Any open code, at most 64 characters.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const OpenCode: Schema.String;
/** @since 0.1.0 @category models */
export type OpenCode = typeof OpenCode.Type;
/**
 * An extension code `x-…`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ExtensionCode: Schema.String;
/** @since 0.1.0 @category models */
export type ExtensionCode = typeof ExtensionCode.Type;
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
export declare const openVocabulary: <const L extends ReadonlyArray<string>>(values: L) => Schema.Union<readonly [Schema.Literals<L>, Schema.String]>;
/**
 * Whether a code is a private extension.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isExtension: (code: string) => boolean;
//# sourceMappingURL=Code.d.ts.map