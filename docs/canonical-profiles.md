# Canonical interoperability profiles

Keiretsu owns the canonical meaning of exchanged records. An external application
is a versioned source of assertions, not an alternative master vocabulary.
Registry company identity, evidenced legal-entity identity, equity ownership,
controlling membership, source contacts and application installations are distinct.
Existing identifiers remain stable when a new source binding is introduced.

## Composition and versions

New profiles compose independently: `canonical-mapping/1`, `work/1`, `service/1`,
`admission/1` and `work-source-admission/1` use the core scalar contracts. Admission
entitlement/redemption and source-work qualification are separate capabilities.
`exact-unit-price/1` and `exact-computation/1` select the exact computation profiles.
`exchange/0.3` is the optional
signed exchange and durable application profile. Work or admission adoption does
not require finance or tax-incentive adoption. Historical L0–L4 claims and 0.1/0.2
vectors retain their original meaning. Package version, schema identity, domain
profile and envelope version are separate coordinates.

JSON Schema describes structural validity. The semantic rules below and their
conformance cases are additional requirements; successful schema validation alone
does not establish application eligibility, authorization or business acceptance.

## Exact computation

- UTC instants use real Gregorian dates, seconds 00–59 and up to nine fractional
  digits. Compare their nanosecond value; preserve original wire spelling.
- Wire JSON numbers are safe integers. Monetary/decimal quantities are strings.
- Exact ratios use canonical signed integer numerators and positive denominators,
  reduced by their greatest common divisor. Zero is `0/1`. Public operations bound
  operand size and require explicit output precision and rounding.
- `exact-unit-price/1` keeps intermediate multiplication, discounts and FX rational
  until the specified currency rounding boundary. Legacy Decimal and charge
  profiles keep their historical arithmetic semantics.
- `exact-computation/1` pins each input, rule and configuration by digest. Hosts
  must retain or resolve the actual matching artifacts to claim reproducibility.
  A digest by itself does not prove their availability or policy authority.

## Source mapping and authority

Source identity includes installation, model and opaque record key. Extraction
company context is separate: a shared record is not public or ownerless. Database
clones and replacement installations require distinct identities or an explicit
evidence-backed continuity decision. A branch relationship does not prove equity
ownership; a contact hierarchy does not establish payer identity.

Mappings pin source product/version/modules/configuration, target schema,
direction and transform rules. They produce candidates with field provenance,
losses and unresolved/ambiguous/conflicting/unsupported results. Missing source
fields do not delete canonical values. Email/name similarity does not merge
identities. Reverse writes require a separately authored mapping and capability.

An application assessment must match the coherent computation receipt and current
source, company context, registry, mapping, configuration and field-authority
revisions. The host still performs the authorized compare-and-swap atomically.
Mapping success and a signed assertion are not authorization to mutate a master.

## Work and service

Work containers/items, requests, execution observations and optional service cases
have separate contracts. Source stage/status remains a source assertion. Task
completion, independent time review, customer acceptance, billing eligibility,
invoicing and payment are separate facts with separate evidence.

Qualification considers the complete declared source cohort before filtering.
Missing coverage, unknown identity/employment, invalid rows, duplicate occurrence
ownership and unbound revision histories remain visible holds. Qualified events
bind the exact observation, work reference, source identity and conversion policy.
Employer, provider, beneficiary, seller, buyer, issuer and book are not inferred
from a shared brand or staff member.

Copying or sharing does not delegate responsibility. A handoff binds an exact work
revision/digest, target acceptance and source release under scoped authority. It
does not waive existing obligations. SLA calendars, time zones, pauses and policy
revisions remain explicit; source deadlines cannot establish a new contractual SLA.

## Admission

An entitlement is an owner-issued right. A credential is a presentation of that
right. A scan is an observation, and the owner-authorized atomic redemption is a
separate decision. Credential replacement preserves the entitlement and consumed
quantity. Online single-entry is the initial supported capability; unsupported
multi-entry, offline or transfer semantics must be held or refused explicitly.

Redemption rechecks current authority, revocation, credential generation, expected
revision, validity and scope within the host transaction. Idempotency is scoped to
the issuer and exact command digest. A repeated key with different content is a
conflict. Refund/payment source observations do not silently grant or cancel entry.

## Exchange 0.3

Detached JWS uses canonical, unpadded base64url segments and a 64-byte Ed25519
signature. Protected headers contain exactly `alg`, `kid`, `typ`, `b64`, `crit`
and `kwx`, with `alg: EdDSA`, `b64: false` and `crit: [b64]`. Claims contain
exactly the typed bundle or receipt binding fields. Unknown header/claim fields
are refused by this version. Valid signed protected JSON may retain its own
whitespace and member order. These stricter ingress rules do not alter 0.1/0.2.

Wire numeric tokens must denote exact safe integers before JavaScript parsing;
rounding a fraction or an underflow to an integer is forbidden. Exponents have
at most six significant decimal digits (absolute value at most 999999), even
for zero coefficients. Exact integer spellings such as `1e2` remain valid.

Classification, validation/staging, application and domain acceptance are distinct.
Each receipt covers exactly the sent record identities: index, kind, schema and
record digest. Aggregate outcomes derive from record outcomes. Empty bundles are
not valid. Replays bind the original authorized result.

Transaction one atomically stores chain/replay state, permitted payload, validation,
staged commands and receipt outbox intent. Transaction two rechecks current authority
and target revisions, applies domain writes and stores command outcomes plus the
application receipt outbox. Signing, key-service calls and network delivery occur
after commit. A durable host must prove restart, crash, concurrency and retry
behavior; an in-memory adapter cannot establish those guarantees.

Before first delivery, the host atomically freezes the signed receipt bytes for
the outbox key and returns the first committed value to competing signers.
Retries use those bytes across restarts and signing-key rotation; acknowledgment
atomically retires the pending intent and its frozen delivery.

The initial application profile supports independent records and explicit atomic
correction cohorts with distinct targets. Unsupported dependency cohorts and
repeated targets are held. Remote provider writes are not part of a local database
transaction; ambiguous remote outcomes require reconciliation rather than blind
retry. Retry delivery of the identical signed bytes.

Discovery, a claimed actor, a valid signature or transport acceptance does not
establish recipient authorization. Hosts enforce audience, installation, key
lifecycle, disclosure and retention policy. Redaction creates a new derived artifact
and digest; hashes are not anonymous data. Receivers bound bytes, depth and record
counts and propagate cancellation to the actual transport.
