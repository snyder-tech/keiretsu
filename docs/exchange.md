# @snyder-tech/keiretsu/exchange

The exchange layer of the **Keiretsu commercial interoperability standard**: how one company sends
records to an affiliate or partner, and how the receiver proves what it got. The package defines the
envelope, canonical digests, detached signatures, sequencing, receipts, disclosure enforcement,
version negotiation and transport bindings. It is **generic over record kinds** and imports no domain
package: domains (work, commerce, finance, tax incentives) export record profiles and disclosure
policies, and adopters combine them.

## Modules

| Module        | Purpose                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Bundle`      | `makeBundleSchema(profile)` codec; envelope schema; `seal` (producer), `signBundle`, `open` (receiver: strict parse, version negotiation, wire digest, decode, per-record classification) |
| `SpecVersion` | `major.minor` pattern; `negotiate(received, supported)`                                                                                                                                   |
| `Party`       | audience reference (entity or counterparty), party keys, control-group crossing                                                                                                           |
| `Jws`         | detached JWS, RFC 7515 + RFC 7797 (`b64:false`, `crit:["b64"]`), EdDSA/Ed25519 via Web Crypto; header binds `kid`, `typ` and issuer/audience/bundleId/seq/specVersion                     |
| `KeyResolver` | `Context.Service` resolving a signer's key by `kid`; `layerJwks` in-memory map                                                                                                            |
| `Verify`      | `verifyBundle`: digest, fail-closed signature policy, unknown-member warnings                                                                                                             |
| `Sequence`    | `SequenceStore` service: idempotency on (issuer, audience, bundleId), per-pair hash chain; `layerMemory`                                                                                  |
| `Receipt`     | `RecordReceipt`, `BundleReceipt`, `sealReceipt`, `signReceipt`, `verifyReceipt`                                                                                                           |
| `Receiver`    | `receive`: open → verify → admit → classify → receipt → commit                                                                                                                            |
| `Disclosure`  | disclosure levels; `RecordKindPolicy`; `checkDisclosure(bundle, policies, controlGroup)`                                                                                                  |
| `Merkle`      | RFC 6962-shaped Merkle root over record digests; inclusion proofs (v0.2 preview)                                                                                                          |
| `Transport`   | `Transport` service (raw text only); in-memory file-drop layer                                                                                                                            |
| `CloudEvents` | pure CloudEvents 1.0 structured-mode mapping (`data_base64` keeps exact bytes)                                                                                                            |
| `Invariants`  | catalogue of every issue code, its surface and whether JSON Schema can express it                                                                                                         |

## Rules the package enforces

- **Digest over the wire.** `contentDigest` is SHA-256 over the RFC 8785 form of the _received_
  envelope minus `contentDigest` and `signature`, computed from the received text with core
  `digestWire`. Decoding never feeds the digest, so unknown members and newer-minor fields survive.
- **Strict JSON.** Duplicate member names and lone surrogates are rejected before anything else.
- **Signatures fail closed.** A signed bundle with no key resolver is an error. A bundle whose
  audience is outside the issuer's control group must be signed. The signed header binds the
  audience, so a signature cannot be replayed to another party; `typ` separates bundles from receipts.
- **Sign only what you sealed.** `signBundle` and `signReceipt` recompute the digest from the text and
  refuse stale or edited text instead of signing it.
- **Receiver identity.** Hosts supply required `self` from their installation configuration. A bundle
  addressed to another party yields a rejected receipt identifying the actual receiver, before admission.
- **Receipt context.** `verifyReceipt` requires the original sent envelope's issuer, audience, bundle id,
  sequence, specification version and content digest as `expected`. Key resolution and signed claims
  derive from that expectation. An empty verification result establishes matching context and any
  required signature; the receipt outcome still determines acceptance and does not prove business application.
- **Serialized receipt tracking.** Same bundle id and digest → `duplicate` receipt citing the original; same id,
  different digest → `ReplayConflict`. A gap holds; a fork (`ChainFork`) halts the pair for a human.
  Bundles failing digest, signature or audience checks never advance or fork a chain. The memory store
  is process-local and reserves nothing between admission and commit. Hosts must provide an atomic
  transaction joining application writes, durable idempotency and acknowledgment for durable guarantees.
- **Open wire.** Unknown record kinds are rejected per record (`record.unknown-kind`), never as a bundle
  failure; `x-` members are preserved; an unknown major is rejected unread (`UnsupportedMajor`).
- **Disclosure declared per kind.** A kind without a policy fails closed (`disclosure.undeclared`).

## Example

```ts
import { Effect, Layer } from 'effect';
import * as Bundle from '@snyder-tech/keiretsu/exchange/Bundle';
import * as Receiver from '@snyder-tech/keiretsu/exchange/Receiver';
import * as Sequence from '@snyder-tech/keiretsu/exchange/Sequence';

const codec = Bundle.makeBundleSchema({ 'nw.charge': ChargeLine });

// Northwind Engineering India Limited → Northwind Services LLC
const sealed =
  yield *
  Bundle.seal(codec, {
    specVersion,
    bundleId,
    issuer: nwIn,
    audience: { _tag: 'entity', entityId: nwUs },
    seq: 1,
    period,
    issuedAt,
    disclosure: 'pseudonymous',
    records: [{ kind: 'nw.charge', record: charge }],
  });

// receiver side, from the exact text that arrived
const result =
  yield *
  Receiver.receive({
    codec,
    self: { _tag: 'entity', entityId: nwUs },
    text: sealed.text,
    policy: { controlGroup: new Set([nwUs, nwIn, nwPk]) },
    disclosure: { 'nw.charge': { kind: 'nw.charge', maxDisclosure: 'identified', personRefPaths: [], crossesControlGroup: 'allowed' } },
  }).pipe(Effect.provide(Sequence.layerMemory));
```

## Ports

- `Disclosure.PersonRefView` — the level of a person reference; the entity package owns the full
  `PersonRef` union and its pseudonym scheme.
- `Party.ControlGroup` — entity ids of the issuer's control group; the entity package derives it from
  control relations.

## Roadmap (deferred)

- `signatures[]` (co-signing, key-rotation overlap) and a `profile` member naming record-schema versions.
- `KeyStore` (HSM / Key Vault signing), JWKS-URL and `did:web` resolvers with TTL cache, `TrustRegistry`.
- Durable `SequenceStore` adapters (SQL, KV, file) and resend requests for held gaps.
- HTTPS (`Idempotency-Key`), queue and MCP transports; CloudEvents binary mode.
- DPA references for `identified` bundles crossing companies. (The pseudonym scheme, `HMAC-SHA-256`
  per issuer, audience and epoch, ships in `keiretsu/entity` `Pseudonym`.)
- Merkle commitments inside aggregate bundles and two-party period close roots (v0.2); SD-JWT
  field-level disclosure (1.x).
- JSON Schema 2020-12 generation and conformance vectors for the semantic invariants in `Invariants`.

Effect is a peer dependency. ESM only. Apache-2.0.

The current wire spec is 0.2. Before 1.0, receivers accept only versions they explicitly support; changed minor versions can have incompatible record shapes. Unknown members are still preserved for a supported contract. From 1.0, same-major minor releases are additive.
