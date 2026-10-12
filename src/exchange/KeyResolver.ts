/**
 * Public-key resolution for signature verification.
 *
 * A key is resolved for a named signer (issuer of a bundle, receiver of a
 * receipt) and a `kid`. Resolution never auto-trusts: a `kid` published by one
 * party does not resolve for another, so a valid signature by the wrong party
 * is rejected as an unknown key. Adapters (issuer JWKS URL, `did:web`, pinned
 * keys, Key Vault) ship separately; {@link layerJwks} is the in-memory map.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Option, Schema } from 'effect';

/**
 * Ed25519 public key as an RFC 8037 OKP JSON Web Key.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PublicJwk = Schema.Struct({
  kty: Schema.Literal('OKP'),
  crv: Schema.Literal('Ed25519'),
  x: Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{43}$/)),
  kid: Schema.NonEmptyString,
});
/** @since 0.1.0 @category models */
export type PublicJwk = typeof PublicJwk.Type;

/**
 * A JWKS document (RFC 7517 §5).
 *
 * @since 0.1.0
 * @category schemas
 */
export const JwkSet = Schema.Struct({ keys: Schema.Array(PublicJwk) });
/** @since 0.1.0 @category models */
export type JwkSet = typeof JwkSet.Type;

/**
 * Resolve a signer's public key by `kid`; `None` when the signer has not published it.
 *
 * @since 0.1.0
 * @category services
 */
export class KeyResolver extends Context.Service<
  KeyResolver,
  { readonly resolve: (input: { readonly signer: string; readonly kid: string }) => Effect.Effect<Option.Option<PublicJwk>> }
>()('@snyder-tech/keiretsu/exchange/KeyResolver') {}

/**
 * In-memory resolver over JWKS documents keyed by signer (an entity id or a
 * `Party.partyKey`). Keys compare case-insensitively on the signer.
 *
 * @since 0.1.0
 * @category layers
 */
export const layerJwks = (sets: Readonly<Record<string, JwkSet>>): Layer.Layer<KeyResolver> => {
  const bySigner = new Map(Object.entries(sets).map(([signer, set]) => [signer.toLowerCase(), set.keys] as const));
  return Layer.succeed(KeyResolver, {
    resolve: ({ signer, kid }) => Effect.succeed(Option.fromNullishOr((bySigner.get(signer.toLowerCase()) ?? []).find((key) => key.kid === kid))),
  });
};
