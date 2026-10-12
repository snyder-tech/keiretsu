import { type ValidationIssue } from '../core/Issue.ts';
import { Effect, Option, Schema } from 'effect';
import { KeyResolver, PublicJwk } from './KeyResolver.ts';
/**
 * `typ` of a bundle signature.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const BUNDLE_TYP = "kwx-bundle+jws";
/**
 * `typ` of a receipt signature.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const RECEIPT_TYP = "kwx-receipt+jws";
/**
 * Compact detached JWS (`header..signature`); the Ed25519 signature is 86 base64url characters.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DetachedJws: Schema.String;
/** @since 0.1.0 @category models */
export type DetachedJws = typeof DetachedJws.Type;
/**
 * Claims bound into the protected header under `kwx`.
 *
 * @since 0.1.0
 * @category models
 */
export type Binding = Readonly<Record<string, string | number>>;
/**
 * Protected header.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ProtectedHeader: Schema.Struct<{
    readonly alg: Schema.String;
    readonly kid: Schema.NonEmptyString;
    readonly typ: Schema.String;
    readonly b64: Schema.Boolean;
    readonly crit: Schema.$Array<Schema.String>;
    readonly kwx: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number]>>;
}>;
/** @since 0.1.0 @category models */
export type ProtectedHeader = typeof ProtectedHeader.Type;
/**
 * A private signing key the holder never exports.
 *
 * @since 0.1.0
 * @category models
 */
export interface SigningKey {
    readonly kid: string;
    readonly privateKey: CryptoKey;
}
declare const JwsError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "JwsError";
} & Readonly<A>;
/**
 * Signing failed (Web Crypto refused the key or the header was not canonicalisable).
 *
 * @since 0.1.0
 * @category errors
 */
export declare class JwsError extends JwsError_base<{
    readonly reason: string;
}> {
}
/**
 * Generate an Ed25519 key pair (non-extractable private key) and its public JWK.
 *
 * @since 0.1.0
 * @category keys
 */
export declare const generateEd25519: (kid: string) => Effect.Effect<{
    readonly signingKey: SigningKey;
    readonly publicJwk: PublicJwk;
}, JwsError>;
/**
 * Sign `payload` (ASCII, unencoded) with a bound protected header; returns the compact detached JWS.
 *
 * @since 0.1.0
 * @category signing
 */
export declare const sign: (options: {
    readonly key: SigningKey;
    readonly typ: string;
    readonly binding: Binding;
    readonly payload: string;
}) => Effect.Effect<DetachedJws, JwsError>;
/**
 * What a verifier expects: who signed, the media type, the bound claims and the payload.
 *
 * @since 0.1.0
 * @category models
 */
export interface Expectation {
    /** Signer key space for {@link KeyResolver} (issuer entity id, or receiver party key). */
    readonly signer: string;
    readonly typ: string;
    readonly binding: Binding;
    readonly payload: string;
    /** Issue subject (e.g. the bundle id). */
    readonly subject: string;
}
/**
 * Parse the protected header of a compact detached JWS without verifying it.
 *
 * @since 0.1.0
 * @category parsing
 */
export declare const readHeader: (jws: string) => Option.Option<ProtectedHeader>;
/**
 * Verify a compact detached JWS against an expectation, resolving the key
 * through {@link KeyResolver}. Returns issues; an empty list means valid.
 *
 * @since 0.1.0
 * @category verification
 */
export declare const verify: (jws: string, expected: Expectation) => Effect.Effect<ReadonlyArray<ValidationIssue>, never, KeyResolver>;
export {};
//# sourceMappingURL=Jws.d.ts.map