/**
 * Receipts: the receiver's answer per record and per bundle.
 *
 * A {@link RecordReceipt} is `accepted`, `accepted-in-period` (the receiver
 * booked it in a later period because the bundle's period is locked on its
 * side) or `rejected` with a coded reason. A {@link BundleReceipt} carries the
 * digest the receiver actually computed, every record outcome and the
 * receiver's period. It has its own digest (`receiptDigest`, same JCS rule as
 * bundles) and may carry a detached JWS by the receiver, so a sender stops
 * authenticate acknowledgment against the original sent envelope context.
 *
 * @since 0.1.0
 * @module
 */
import { EntityId } from "../core/Actor.js";
import { canonicalize, digestWire, parseStrict, Sha256 } from "../core/CanonicalJson.js";
import { BundleId } from "../core/Ids.js";
import { issue, ValidationIssue } from "../core/Issue.js";
import { Instant, Period } from "../core/Temporal.js";
import { Data, Effect, Option, Schema } from 'effect';
import { isJsonObject } from "./internal/Json.js";
import { DetachedJws, RECEIPT_TYP, sign, verify } from "./Jws.js";
import { KeyResolver } from "./KeyResolver.js";
import { PartyRef, partyKey } from "./Party.js";
import { SpecVersion } from "./SpecVersion.js";
/**
 * Coded reason for a rejection (issue codes from the invariant catalogue).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Reason = Schema.Struct({ code: ValidationIssue.fields.code, message: Schema.NonEmptyString });
/** @since 0.1.0 @category schemas */
export const RecordOutcome = Schema.Literals(['accepted', 'accepted-in-period', 'rejected']);
/**
 * Outcome for one record of a bundle.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RecordReceipt = Schema.Struct({
    index: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
    kind: Schema.NonEmptyString,
    recordId: Schema.optional(Schema.NonEmptyString),
    recordDigest: Sha256,
    outcome: RecordOutcome,
    receiverPeriod: Schema.optional(Period),
    reasons: Schema.optional(Schema.NonEmptyArray(Reason)),
}).check(Schema.makeFilter((receipt) => (receipt.outcome === 'rejected' && receipt.reasons === undefined ? 'a rejection states its reasons (receipt.rejection-reason)' : undefined)), Schema.makeFilter((receipt) => receipt.outcome === 'accepted-in-period' && receipt.receiverPeriod === undefined ? 'accepted-in-period names the receiver period (receipt.receiver-period)' : undefined));
/** @since 0.1.0 @category schemas */
export const BundleOutcome = Schema.Literals(['accepted', 'partial', 'rejected', 'duplicate']);
const receiptFields = {
    specVersion: SpecVersion,
    bundleId: BundleId,
    issuer: EntityId,
    receiver: PartyRef,
    seq: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    /** Digest the receiver computed over what it received. */
    contentDigest: Sha256,
    receivedAt: Instant,
    receiverPeriod: Schema.optional(Period),
    outcome: BundleOutcome,
    records: Schema.Array(RecordReceipt),
    /** Bundle-level findings (digest, signature, version). */
    issues: Schema.Array(ValidationIssue),
    /** For `duplicate`: the digest of the receipt first issued for this bundle. */
    originalReceiptDigest: Schema.optional(Sha256),
};
/**
 * Receipt before sealing.
 *
 * @since 0.1.0
 * @category schemas
 */
export const UnsealedReceipt = Schema.Struct(receiptFields);
/**
 * Bundle-level receipt, signed by the receiver when policy requires.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BundleReceipt = Schema.Struct({ ...receiptFields, receiptDigest: Sha256, signature: Schema.optional(DetachedJws) });
/**
 * Members excluded from the receipt digest.
 *
 * @since 0.1.0
 * @category constants
 */
export const RECEIPT_DIGEST_EXCLUDED = ['receiptDigest', 'signature'];
/**
 * A receipt could not be sealed, signed or read.
 *
 * @since 0.1.0
 * @category errors
 */
export class ReceiptError extends Data.TaggedError('ReceiptError') {
}
const receiptFail = (reason) => new ReceiptError({ reason });
/**
 * Bundle outcome from record outcomes (an empty bundle is accepted).
 *
 * @since 0.1.0
 * @category constructors
 */
export const outcomeOf = (records) => {
    const rejected = records.filter((record) => record.outcome === 'rejected').length;
    if (rejected === 0)
        return 'accepted';
    return rejected === records.length ? 'rejected' : 'partial';
};
/**
 * Seal a receipt: canonical text with `receiptDigest`.
 *
 * @since 0.1.0
 * @category producing
 */
export const sealReceipt = (receipt) => Effect.gen(function* () {
    const wire = yield* Schema.encodeUnknownEffect(UnsealedReceipt)(receipt).pipe(Effect.mapError((error) => receiptFail(error.message)));
    const unsealedText = yield* Effect.mapError(canonicalize(wire), (error) => receiptFail(error.reason));
    const receiptDigest = yield* Effect.mapError(digestWire(unsealedText, RECEIPT_DIGEST_EXCLUDED), (error) => receiptFail(error.reason));
    const text = yield* Effect.mapError(canonicalize({ ...wire, receiptDigest }), (error) => receiptFail(error.reason));
    const sealed = yield* Schema.decodeUnknownEffect(BundleReceipt)(JSON.parse(text)).pipe(Effect.mapError((error) => receiptFail(error.message)));
    return { text, receipt: sealed };
});
const receiptBinding = (receipt) => ({
    receiver: partyKey(receipt.receiver),
    issuer: receipt.issuer.toLowerCase(),
    bundleId: receipt.bundleId.toLowerCase(),
    seq: receipt.seq,
    specVersion: receipt.specVersion,
    contentDigest: receipt.contentDigest,
});
const parseReceipt = (text) => Effect.gen(function* () {
    const parsed = yield* Effect.mapError(parseStrict(text), (error) => receiptFail(error.reason));
    if (!isJsonObject(parsed))
        return yield* Effect.fail(receiptFail('a receipt is a JSON object'));
    const receipt = yield* Schema.decodeUnknownEffect(BundleReceipt)(parsed).pipe(Effect.mapError((error) => receiptFail(error.message)));
    return { parsed, receipt };
});
/**
 * Strictly parse and decode receipt text.
 *
 * @since 0.1.0
 * @category parsing
 */
export const readReceipt = (text) => Effect.map(parseReceipt(text), ({ receipt }) => receipt);
/**
 * Sign sealed receipt text as the receiver (`typ` {@link RECEIPT_TYP}). The
 * receipt digest is recomputed from the text first, so stale or edited text is
 * refused rather than signed.
 *
 * @since 0.1.0
 * @category producing
 */
export const signReceipt = (options) => Effect.gen(function* () {
    const { parsed, receipt } = yield* parseReceipt(options.text);
    const digest = yield* Effect.mapError(digestWire(options.text, RECEIPT_DIGEST_EXCLUDED), (error) => receiptFail(error.reason));
    if (digest !== receipt.receiptDigest)
        return yield* Effect.fail(receiptFail('receiptDigest does not match the text; reseal before signing'));
    const signature = yield* sign({ key: options.key, typ: RECEIPT_TYP, binding: receiptBinding(receipt), payload: receipt.receiptDigest }).pipe(Effect.mapError((error) => receiptFail(error.reason)));
    return yield* Effect.mapError(canonicalize({ ...parsed, signature }), (error) => receiptFail(error.reason));
});
const contextIssues = (receipt, expected) => {
    const at = expected.bundleId;
    const found = [];
    if (receipt.issuer.toLowerCase() !== expected.issuer.toLowerCase())
        found.push(issue('receipt.issuer-mismatch', 'error', at, 'the receipt identifies a different issuer'));
    if (partyKey(receipt.receiver) !== partyKey(expected.audience))
        found.push(issue('receipt.receiver-mismatch', 'error', at, 'the receipt identifies a different receiver'));
    if (receipt.bundleId.toLowerCase() !== expected.bundleId.toLowerCase())
        found.push(issue('receipt.bundle-mismatch', 'error', at, 'the receipt identifies a different bundle'));
    if (receipt.seq !== expected.seq)
        found.push(issue('receipt.sequence-mismatch', 'error', at, 'the receipt acknowledges a different sequence'));
    if (receipt.specVersion !== expected.specVersion)
        found.push(issue('receipt.version-mismatch', 'error', at, 'the receipt acknowledges a different specification version'));
    if (receipt.contentDigest !== expected.contentDigest)
        found.push(issue('receipt.content-mismatch', 'error', at, 'the receipt acknowledges different content than was sent'));
    return found;
};
/**
 * Check a receipt's raw-wire digest, original sent envelope context and signature
 * using the expected audience's key. The outcome still determines acceptance;
 * context and signature verification do not prove business application.
 *
 * @since 0.1.0
 * @category verification
 */
export const verifyReceipt = (options) => Effect.gen(function* () {
    const { receipt } = yield* parseReceipt(options.text);
    const digest = yield* Effect.mapError(digestWire(options.text, RECEIPT_DIGEST_EXCLUDED), (error) => receiptFail(error.reason));
    const at = options.expected.bundleId;
    const found = [...contextIssues(receipt, options.expected)];
    if (digest !== receipt.receiptDigest)
        found.push(issue('receipt.digest-mismatch', 'error', at, 'receiptDigest does not match the received receipt'));
    if (receipt.signature === undefined) {
        if (options.requireSignature)
            found.push(issue('receipt.signature-required', 'error', at, 'the receipt must be signed by the receiver'));
        return found;
    }
    const resolver = yield* Effect.serviceOption(KeyResolver);
    if (Option.isNone(resolver))
        return [...found, issue('receipt.signature-unverifiable', 'error', at, 'the receipt is signed but no key resolver is configured')];
    const signatureIssues = yield* verify(receipt.signature, {
        signer: partyKey(options.expected.audience),
        typ: RECEIPT_TYP,
        binding: receiptBinding({ ...options.expected, receiver: options.expected.audience }),
        payload: receipt.receiptDigest,
        subject: at,
    }).pipe(Effect.provideService(KeyResolver, resolver.value));
    return [...found, ...signatureIssues];
});
//# sourceMappingURL=Receipt.js.map