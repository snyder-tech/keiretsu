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
import { EntityId } from "../core/Actor.js";
import { Context, Effect, Schema } from 'effect';
/**
 * Domain-separation label, versioned with the derivation.
 *
 * @since 0.1.0
 * @category constants
 */
export const DOMAIN = 'keiretsu/pseudonym/v1';
/**
 * Minimum key length in bytes.
 *
 * @since 0.1.0
 * @category constants
 */
export const MIN_KEY_BYTES = 32;
/**
 * `kp1.` followed by the unpadded base64url HMAC (43 characters).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Pseudonym = Schema.String.check(Schema.isPattern(/^kp1\.[A-Za-z0-9_-]{43}$/)).pipe(Schema.brand('keiretsu/Pseudonym'));
/**
 * Who issues the pseudonym, who receives it and the key epoch.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PseudonymScope = Schema.Struct({
    issuer: EntityId,
    audience: Schema.String.check(Schema.isPattern(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/)),
    epoch: Schema.String.check(Schema.isPattern(/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/)),
});
/**
 * Derivation failed (short key, Web Crypto failure or missing key).
 *
 * @since 0.1.0
 * @category errors
 */
export class PseudonymError extends Schema.TaggedError()('PseudonymError', {
    reason: Schema.Literals(['key-too-short', 'crypto-failure', 'key-unavailable']),
    detail: Schema.String,
}) {
}
/**
 * Issuer-side keyring port: returns the secret key for a scope.
 *
 * @since 0.1.0
 * @category services
 */
export class PseudonymKeyring extends Context.Service()('@snyder-tech/keiretsu/entity/PseudonymKeyring') {
}
const encoder = new TextEncoder();
const lengthPrefixed = (field) => {
    const bytes = encoder.encode(field);
    const length = bytes.length;
    return [(length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff, ...bytes];
};
/**
 * The domain-separated HMAC input: each field length-prefixed (u32 big-endian).
 *
 * @since 0.1.0
 * @category encoding
 */
export const derivationInput = (scope, personId) => Uint8Array.from([DOMAIN, scope.issuer, scope.audience, scope.epoch, personId].flatMap(lengthPrefixed));
const base64Url = (bytes) => btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
const hmac = (key, input) => Effect.tryPromise({
    try: async () => {
        const cryptoKey = await crypto.subtle.importKey('raw', Uint8Array.from(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, input));
    },
    catch: (cause) => new PseudonymError({ reason: 'crypto-failure', detail: String(cause) }),
});
/**
 * Derive the pseudonym of `personId` for `scope` with an explicit key.
 *
 * @since 0.1.0
 * @category constructors
 */
export const derive = (options) => options.key.length < MIN_KEY_BYTES
    ? Effect.fail(new PseudonymError({ reason: 'key-too-short', detail: `key must be at least ${MIN_KEY_BYTES} bytes` }))
    : Effect.map(hmac(options.key, derivationInput(options.scope, options.personId)), (mac) => Schema.decodeSync(Pseudonym)(`kp1.${base64Url(mac)}`));
/**
 * Derive a pseudonym using the {@link PseudonymKeyring} service.
 *
 * @since 0.1.0
 * @category constructors
 */
export const pseudonymFor = (options) => Effect.gen(function* () {
    const keyring = yield* PseudonymKeyring;
    const key = yield* keyring.keyFor(options.scope);
    return yield* derive({ key, ...options });
});
//# sourceMappingURL=Pseudonym.js.map