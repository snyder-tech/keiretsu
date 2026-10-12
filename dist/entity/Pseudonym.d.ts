/**
 * Pseudonyms for people shared with partners.
 *
 * `pseudonym = HMAC-SHA-256(key(issuer, audience, epoch), input)` where the
 * key is held by the issuer, one per (issuer, audience, epoch), and the input
 * is domain-separated and length-prefixed so no two (scope, person) pairs
 * share bytes. Different audiences cannot link a person; rotating the epoch
 * unlinks old pseudonyms. Uses Web Crypto only.
 *
 * @since 0.1.0
 * @module
 */
import { type PersonId } from '../core/Actor.ts';
import { Context, Effect, Schema } from 'effect';
/**
 * Domain-separation label, versioned with the derivation.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const DOMAIN = "keiretsu/pseudonym/v1";
/**
 * Minimum key length in bytes.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const MIN_KEY_BYTES = 32;
/**
 * `kp1.` followed by the unpadded base64url HMAC (43 characters).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Pseudonym: Schema.brand<Schema.String, "keiretsu/Pseudonym">;
/** @since 0.1.0 @category models */
export type Pseudonym = typeof Pseudonym.Type;
/**
 * Who issues the pseudonym, who receives it and the key epoch.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PseudonymScope: Schema.Struct<{
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.String;
    readonly epoch: Schema.String;
}>;
/** @since 0.1.0 @category models */
export type PseudonymScope = typeof PseudonymScope.Type;
declare const PseudonymError_base: Schema.Class<PseudonymError, Schema.TaggedStruct<"PseudonymError", {
    readonly reason: Schema.Literals<readonly ["key-too-short", "crypto-failure", "key-unavailable"]>;
    readonly detail: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Derivation failed (short key, Web Crypto failure or missing key).
 *
 * @since 0.1.0
 * @category errors
 */
export declare class PseudonymError extends PseudonymError_base {
}
declare const PseudonymKeyring_base: Context.ServiceClass<PseudonymKeyring, "@snyder-tech/keiretsu/entity/PseudonymKeyring", {
    readonly keyFor: (scope: PseudonymScope) => Effect.Effect<Uint8Array, PseudonymError>;
}>;
/**
 * Issuer-side keyring port: returns the secret key for a scope.
 *
 * @since 0.1.0
 * @category services
 */
export declare class PseudonymKeyring extends PseudonymKeyring_base {
}
/**
 * The domain-separated HMAC input: each field length-prefixed (u32 big-endian).
 *
 * @since 0.1.0
 * @category encoding
 */
export declare const derivationInput: (scope: PseudonymScope, personId: PersonId) => Uint8Array<ArrayBuffer>;
/**
 * Derive the pseudonym of `personId` for `scope` with an explicit key.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const derive: (options: {
    readonly key: Uint8Array;
    readonly scope: PseudonymScope;
    readonly personId: PersonId;
}) => Effect.Effect<Pseudonym, PseudonymError>;
/**
 * Derive a pseudonym using the {@link PseudonymKeyring} service.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const pseudonymFor: (options: {
    readonly scope: PseudonymScope;
    readonly personId: PersonId;
}) => Effect.Effect<Pseudonym, PseudonymError, PseudonymKeyring>;
export {};
//# sourceMappingURL=Pseudonym.d.ts.map