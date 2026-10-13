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
import { Clock, Effect, Schema } from 'effect';
import type { Types } from 'effect';

/**
 * RFC 9562 UUID version 7, lowercase or uppercase hex.
 *
 * @since 0.1.0
 * @category patterns
 */
export const UUID_V7_PATTERN: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * An unbranded UUIDv7 string.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Uuid7 = Schema.String.check(Schema.isPattern(UUID_V7_PATTERN));

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
export const brand = <const K extends `keiretsu/${string}`>(key: K & BrandKey<K>) => Uuid7.pipe(Schema.brand<K>(key));

/**
 * Render a UUIDv7 from a millisecond timestamp and 10 random bytes. Pure and
 * deterministic, so tests and conformance vectors can reproduce ids.
 *
 * @since 0.1.0
 * @category constructors
 */
export const fromParts = (unixMillis: number, random: Uint8Array): string => {
  if (!Number.isSafeInteger(unixMillis) || unixMillis < 0 || unixMillis > 0xffffffffffff) throw new RangeError('UUIDv7 timestamp must be an integer from 0 to 2^48 - 1');
  if (random.length !== 10) throw new RangeError('UUIDv7 needs exactly 10 random bytes');
  const bytes = new Uint8Array(16);
  let time = BigInt(unixMillis);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(time & 0xffn);
    time >>= 8n;
  }
  bytes.set(random.subarray(0, 10), 6);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/**
 * Mint a fresh UUIDv7 using the Effect clock and Web Crypto randomness.
 *
 * @since 0.1.0
 * @category constructors
 */
export const generate: Effect.Effect<string> = Effect.gen(function* () {
  const millis = yield* Clock.currentTimeMillis;
  return fromParts(Number(millis), crypto.getRandomValues(new Uint8Array(10)));
});
