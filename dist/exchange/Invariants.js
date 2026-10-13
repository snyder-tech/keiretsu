/**
 * Invariant catalogue (memo P8): every issue code this package emits, how it
 * is surfaced, and whether a JSON Schema 2020-12 rendering can express it.
 * Codes that JSON Schema cannot express must be covered by conformance vectors
 * so non-TypeScript implementers do not silently accept invalid bundles.
 *
 * @since 0.1.0
 * @module
 */
const entry = (code, shape, description) => ({
    code,
    ...shape,
    jsonSchemaExpressible: shape.kind !== 'semantic',
    description,
});
const decodeError = { severity: 'error', surface: 'decode' };
const issueError = { severity: 'error', surface: 'issue', kind: 'semantic' };
const recordError = { severity: 'error', surface: 'record-reason', kind: 'semantic' };
/**
 * Every code emitted by `@snyder-tech/keiretsu/exchange`.
 *
 * @since 0.1.0
 * @category catalogue
 */
export const catalogue = [
    entry('bundle.decode', { ...decodeError, kind: 'structural' }, 'The envelope is strict JSON (no duplicate members, no lone surrogates) and matches the envelope schema.'),
    entry('bundle.self-addressed', { ...decodeError, kind: 'semantic' }, 'The audience is not the issuer (cross-member equality has no JSON Schema form).'),
    entry('bundle.chain-link', { ...decodeError, kind: 'cross-field' }, 'prevBundleDigest is present exactly when seq > 1 (if/then on seq).'),
    entry('bundle.unsupported-major', { severity: 'error', surface: 'error', kind: 'structural' }, 'specVersion is major.minor with a supported major; an unknown major is rejected unread (UnsupportedMajor).'),
    entry('bundle.digest-mismatch', issueError, 'contentDigest equals SHA-256 over the RFC 8785 form of the received envelope minus contentDigest and signature.'),
    entry('bundle.audience-mismatch', issueError, 'The envelope audience matches the receiver identity supplied by the host installation before sequence admission.'),
    entry('bundle.signature-required', issueError, 'A bundle whose audience is outside the issuer control group carries a signature.'),
    entry('bundle.signature-unverifiable', issueError, 'A signed bundle is never accepted without a key resolver (fail closed).'),
    entry('bundle.unknown-member', { severity: 'warning', surface: 'issue', kind: 'semantic' }, 'A non-x- member unknown to an exactly supported version is preserved and ignored.'),
    entry('jws.malformed', issueError, 'The signature is a compact detached JWS with a decodable protected header.'),
    entry('jws.alg-unsupported', issueError, 'alg is EdDSA.'),
    entry('jws.crit', issueError, 'The header sets b64:false and crit:["b64"] with no other critical parameters (RFC 7797).'),
    entry('jws.typ-mismatch', issueError, 'typ separates bundle signatures from receipt signatures.'),
    entry('jws.binding-mismatch', issueError, 'The signed header binds the envelope issuer, audience, bundleId, seq and specVersion.'),
    entry('jws.key-unknown', issueError, 'kid resolves to a trusted Ed25519 key published by the signer itself.'),
    entry('jws.invalid', issueError, 'The Ed25519 signature verifies over the unencoded payload.'),
    entry('sequence.replay-conflict', { severity: 'error', surface: 'error', kind: 'semantic' }, 'A bundle id seen before with a different digest is never processed (ReplayConflict).'),
    entry('sequence.gap', { severity: 'hold', surface: 'admission', kind: 'semantic' }, 'seq is the next expected for the pair; a gap holds the bundle and asks for a resend.'),
    entry('sequence.fork', { severity: 'error', surface: 'error', kind: 'semantic' }, 'One seq per pair and prevBundleDigest equal to the previous contentDigest; a fork halts the pair (ChainFork).'),
    entry('record.unknown-kind', recordError, 'A kind outside the receiver profile is rejected per record; the bundle is not failed.'),
    entry('record.invalid', { ...recordError, kind: 'structural' }, 'A record decodes with the schema registered for its kind.'),
    entry('record.schema-mismatch', recordError, 'A strict profile record names exactly the locally registered schema identity before payload decoding.'),
    entry('disclosure.undeclared', recordError, 'Every record kind has a registered disclosure policy (fail closed).'),
    entry('disclosure.kind-exceeds-max', recordError, 'The bundle disclosure level does not exceed the kind maximum.'),
    entry('disclosure.kind-below-min', recordError, 'The bundle disclosure level meets the kind minimum.'),
    entry('disclosure.never-crosses', recordError, 'Kinds marked never do not leave the issuer control group.'),
    entry('disclosure.view-required', recordError, 'Kinds marked view-required leave the control group only as their redacted view kind.'),
    entry('disclosure.person-ref', recordError, 'Person references are no more revealing than the bundle level; aggregate bundles carry role-only references.'),
    entry('receipt.rejection-reason', { ...decodeError, kind: 'cross-field' }, 'A rejected record receipt states its reasons.'),
    entry('receipt.receiver-period', { ...decodeError, kind: 'cross-field' }, 'An accepted-in-period record receipt names the receiver period.'),
    entry('receipt.digest-mismatch', issueError, 'receiptDigest equals SHA-256 over the RFC 8785 form of the received receipt minus receiptDigest and signature.'),
    entry('receipt.content-mismatch', issueError, 'The receipt acknowledges the digest the sender sent.'),
    entry('receipt.issuer-mismatch', issueError, 'The receipt issuer matches the original sent envelope issuer.'),
    entry('receipt.receiver-mismatch', issueError, 'The receipt receiver matches the original sent envelope audience, including its party tag.'),
    entry('receipt.bundle-mismatch', issueError, 'The receipt bundleId matches the original sent envelope bundleId.'),
    entry('receipt.sequence-mismatch', issueError, 'The receipt seq matches the original sent envelope seq.'),
    entry('receipt.version-mismatch', issueError, 'The receipt specVersion matches the original sent envelope specVersion.'),
    entry('receipt.signature-required', issueError, 'A receipt the sender requires to be signed is signed.'),
    entry('receipt.signature-unverifiable', issueError, 'A signed receipt is never accepted without a key resolver.'),
];
/**
 * Look up a catalogued invariant by code.
 *
 * @since 0.1.0
 * @category catalogue
 */
export const byCode = (code) => catalogue.find((invariant) => invariant.code === code);
//# sourceMappingURL=Invariants.js.map