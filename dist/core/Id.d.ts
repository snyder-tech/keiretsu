/**
 * UUIDv7 identifiers and namespaced brands.
 *
 * Every keiretsu record id is a UUIDv7 (RFC 9562) minted by the record's owner.
 * Brands are namespaced `keiretsu/<Name>` and defined once, here or in the
 * package that owns the record, so they unify across packages.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import type { Types } from 'effect';
/**
 * RFC 9562 UUID version 7, lowercase or uppercase hex.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const UUID_V7_PATTERN: RegExp;
/**
 * An unbranded UUIDv7 string.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Uuid7: Schema.String;
/**
 * A single, literal `keiretsu/<Name>` brand key. Effect 4 brands require one
 * concrete key, so a union or a widened `string` is rejected at the call site.
 *
 * @since 0.44.11
 * @category models
 */
export type BrandKey<K extends `keiretsu/${string}`> = Types.IsUnion<K> extends false ? ({} extends Record<K, unknown> ? never : unknown) : never;
/**
 * Define a branded UUIDv7 id schema. The brand key is the full namespaced
 * literal `keiretsu/<Name>`.
 *
 * @example
 * ```ts
 * import { Id } from './Id.ts'
 * export const InvoiceId = Id.brand('keiretsu/InvoiceId')
 * ```
 * @since 0.1.0
 * @category constructors
 */
export declare const brand: <const K extends `keiretsu/${string}`>(key: K & BrandKey<K>) => Schema.brand<Schema.String, K>;
/**
 * Render a UUIDv7 from a millisecond timestamp and 10 random bytes. Pure and
 * deterministic, so tests and conformance vectors can reproduce ids.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const fromParts: (unixMillis: number, random: Uint8Array) => string;
/**
 * Mint a fresh UUIDv7 using the Effect clock and Web Crypto randomness.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const generate: Effect.Effect<string>;
//# sourceMappingURL=Id.d.ts.map