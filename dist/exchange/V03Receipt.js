/** Complete record acknowledgments, explicitly separating validation from application. */
import { Effect, Schema } from 'effect';
import { canonicalize, digestWire, parseStrict } from "../core/CanonicalJson.js";
import { RECEIPT_TYP, sign, verify } from "./Jws.js";
import { partyKey } from "./Party.js";
import { checkBoundsV03, failV03 } from "./V03Bundle.js";
import { aggregateV03, ReceiptV03, UnsealedReceiptV03 } from "./V03Contracts.js";
import { isJsonObject } from "./internal/Json.js";
import { validateJwsV03 } from "./internal/V03Jws.js";
const excluded = ['receiptDigest', 'signature'];
const binding = (receipt) => ({
    issuer: receipt.issuer.toLowerCase(),
    receiver: partyKey(receipt.receiver),
    bundleId: receipt.bundleId.toLowerCase(),
    seq: receipt.seq,
    specVersion: receipt.specVersion,
    contentDigest: receipt.contentDigest,
    phase: receipt.phase,
});
const allowedOutcomes = {
    classification: new Set(['classified', 'invalid', 'rejected']),
    validation: new Set(['staged', 'held', 'invalid', 'unauthorized', 'rejected']),
    application: new Set(['applied', 'held', 'invalid', 'unauthorized', 'conflict', 'rejected']),
};
const checkReceipt = (receipt) => {
    if (receipt.outcome !== aggregateV03(receipt.records))
        return Effect.fail(failV03('v03.receipt.aggregate', 'aggregate does not follow record outcomes'));
    if (receipt.records.some((row) => !allowedOutcomes[receipt.phase].has(row.outcome)))
        return Effect.fail(failV03('v03.receipt.phase', 'record outcome is invalid for receipt phase'));
    if ((receipt.phase === 'application') !== (receipt.applicationId !== undefined))
        return Effect.fail(failV03('v03.receipt.application-id', 'application identity is required exactly for application receipts'));
    return Effect.void;
};
export const sealReceiptV03 = (input) => Effect.gen(function* () {
    const wire = yield* Schema.encodeEffect(UnsealedReceiptV03)(input, { onExcessProperty: 'error' }).pipe(Effect.mapError(() => failV03('v03.receipt.invalid', 'invalid receipt intent')));
    yield* checkReceipt(input);
    const unsigned = yield* canonicalize(wire).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    const receiptDigest = yield* digestWire(unsigned, excluded).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    const text = yield* canonicalize({ ...wire, receiptDigest }).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    return { text, receipt: { ...input, receiptDigest } };
});
export const readReceiptV03 = (text, limits) => Effect.gen(function* () {
    yield* checkBoundsV03(text, limits);
    const parsed = yield* parseStrict(text).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    const receipt = yield* Schema.decodeUnknownEffect(ReceiptV03)(parsed, { onExcessProperty: 'error' }).pipe(Effect.mapError(() => failV03('v03.receipt.invalid', 'invalid receipt')));
    if (receipt.records.length > limits.maxRecords)
        return yield* Effect.fail(failV03('v03.limits.records', 'receipt exceeds record ceiling'));
    yield* checkReceipt(receipt);
    const digest = yield* digestWire(text, excluded).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    if (digest !== receipt.receiptDigest)
        return yield* Effect.fail(failV03('v03.receipt.digest', 'receipt digest mismatch'));
    return receipt;
});
export const signReceiptV03 = (options) => Effect.gen(function* () {
    const receipt = yield* readReceiptV03(options.text, options.limits);
    const signature = yield* sign({ key: options.key, typ: RECEIPT_TYP, binding: binding(receipt), payload: receipt.receiptDigest }).pipe(Effect.mapError((error) => failV03('v03.signature.failed', error.reason)));
    const raw = yield* parseStrict(options.text).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    if (!isJsonObject(raw))
        return yield* Effect.fail(failV03('v03.receipt.invalid', 'receipt must be an object'));
    const text = yield* canonicalize({ ...raw, signature }).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    yield* checkBoundsV03(text, options.limits);
    return text;
});
const contextMatches = (receipt, expected) => {
    const claims = binding(receipt);
    const envelope = expected.envelope;
    const required = {
        issuer: envelope.issuer.toLowerCase(),
        receiver: partyKey(envelope.audience),
        bundleId: envelope.bundleId.toLowerCase(),
        seq: envelope.seq,
        contentDigest: envelope.contentDigest,
        phase: expected.phase,
    };
    return Object.entries(required).every(([key, value]) => Reflect.get(claims, key) === value) && receipt.applicationId === expected.applicationId;
};
const checkCoverage = (receipt, identities) => {
    if (receipt.records.length !== identities.length)
        return Effect.fail(failV03('v03.receipt.coverage', 'receipt must acknowledge exactly every sent record'));
    for (const [index, identity] of identities.entries()) {
        const row = receipt.records[index];
        if (row === undefined || identity.index !== index)
            return Effect.fail(failV03('v03.receipt.record', 'receipt record index mismatch'));
        if (Object.entries(identity).some(([key, value]) => Reflect.get(row, key) !== value))
            return Effect.fail(failV03('v03.receipt.record', 'receipt record identity mismatch'));
    }
    return Effect.void;
};
const checkDuplicate = (receipt, expected) => Effect.gen(function* () {
    if ((receipt.originalReceiptDigest !== undefined) !== (expected.original !== undefined))
        return yield* Effect.fail(failV03('v03.receipt.duplicate', 'duplicate acknowledgment expectation does not match'));
    const original = expected.original;
    if (original === undefined)
        return;
    if (!contextMatches(original, expected) || original.receiptDigest !== receipt.originalReceiptDigest || original.outcome !== receipt.outcome)
        return yield* Effect.fail(failV03('v03.receipt.duplicate', 'duplicate does not bind the original authorized outcome'));
    const records = yield* canonicalize(receipt.records).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    const originalRecords = yield* canonicalize(original.records).pipe(Effect.mapError((error) => failV03(error.code, error.reason)));
    if (records !== originalRecords)
        return yield* Effect.fail(failV03('v03.receipt.duplicate', 'duplicate record outcomes differ from the original'));
});
export const verifyReceiptV03 = (options) => Effect.gen(function* () {
    const receipt = yield* readReceiptV03(options.text, options.limits);
    const expected = options.expected;
    const envelope = expected.envelope;
    if (!contextMatches(receipt, expected))
        return yield* Effect.fail(failV03('v03.receipt.context', 'receipt context does not match the sent bundle'));
    yield* checkCoverage(receipt, expected.identities);
    yield* checkDuplicate(receipt, expected);
    if (receipt.signature === undefined)
        return yield* Effect.fail(failV03('v03.receipt.signature', '0.3 receipts require a receiver signature'));
    yield* validateJwsV03({ jws: receipt.signature, typ: RECEIPT_TYP, limits: options.limits });
    const issues = yield* verify(receipt.signature, { signer: partyKey(envelope.audience), typ: RECEIPT_TYP, binding: binding(receipt), payload: receipt.receiptDigest, subject: receipt.bundleId });
    if (issues.length !== 0)
        return yield* Effect.fail(failV03('v03.receipt.signature', 'receiver signature verification failed'));
    return receipt;
});
//# sourceMappingURL=V03Receipt.js.map