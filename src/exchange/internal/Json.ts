/**
 * JSON helpers shared by the bundle and receipt modules.
 *
 * @since 0.1.0
 * @module
 * @internal
 */
import type { JsonValue } from '../../core/CanonicalJson.ts';

/** @since 0.1.0 @category models */
export type JsonObject = { readonly [key: string]: JsonValue };

/** @since 0.1.0 @category guards */
export const isJsonObject = (value: JsonValue): value is JsonObject => value !== null && typeof value === 'object' && !Array.isArray(value);
