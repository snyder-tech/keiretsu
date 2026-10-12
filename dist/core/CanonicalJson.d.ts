/**
 * Strict JSON parsing, RFC 8785 (JCS) canonical form and SHA-256 digests.
 *
 * Digests are computed over the **received wire JSON**, never over a decoded
 * value: decoding may drop unknown members or normalise values. The strict
 * parser rejects duplicate member names and lone surrogates (which
 * `JSON.parse` silently accepts), and canonicalisation accepts only strings,
 * safe integers, booleans, null, arrays and objects — keiretsu wire values
 * carry decimals as canonical strings.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
/**
 * Lowercase hex SHA-256.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Sha256: Schema.brand<Schema.String, "keiretsu/Sha256">;
/** @since 0.1.0 @category models */
export type Sha256 = typeof Sha256.Type;
declare const CanonicalJsonError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "CanonicalJsonError";
} & Readonly<A>;
/**
 * Input that is not strict JSON or not canonicalisable.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class CanonicalJsonError extends CanonicalJsonError_base<{
    readonly at: string;
    readonly reason: string;
    readonly code: 'core.json-duplicate-member' | 'core.json-lone-surrogate' | 'core.json-invalid';
}> {
}
/** Encoding failure at a JSON boundary. @since 0.1.0 @category errors */
export declare const invalidJson: (at: string, reason: string) => CanonicalJsonError;
/** @since 0.1.0 @category models */
export type JsonValue = null | boolean | number | string | ReadonlyArray<JsonValue> | {
    readonly [key: string]: JsonValue;
};
/**
 * Parse JSON text strictly (no duplicate members, no lone surrogates).
 *
 * @since 0.1.0
 * @category parsing
 */
export declare const parseStrict: (text: string) => Effect.Effect<JsonValue, CanonicalJsonError>;
/**
 * RFC 8785 canonical JSON. Members whose value is `undefined` are omitted.
 *
 * @since 0.1.0
 * @category canonicalisation
 */
export declare const canonicalize: (value: unknown) => Effect.Effect<string, CanonicalJsonError>;
/**
 * SHA-256 over the canonical JSON of a value (use for values you produced).
 *
 * @since 0.1.0
 * @category digests
 */
export declare const digestValue: (value: unknown) => Effect.Effect<Sha256, CanonicalJsonError>;
/**
 * Synchronous SHA-256 over the canonical JSON of a value, for pure validators.
 * Produces the same digest as {@link digestValue}.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const digestValueSync: (value: unknown) => Effect.Effect<Sha256, CanonicalJsonError>;
/**
 * SHA-256 over received wire JSON: strict parse, optionally drop named
 * top-level members (e.g. the digest and signature fields), canonicalise, hash.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const digestWire: (text: string, omitMembers?: ReadonlyArray<string>) => Effect.Effect<Sha256, CanonicalJsonError>;
export {};
//# sourceMappingURL=CanonicalJson.d.ts.map