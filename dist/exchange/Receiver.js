/**
 * The receiver pipeline: open → verify → admit → classify → receipt → commit.
 *
 * 1. {@link open} the exact received text (strict parse, version negotiation,
 *    wire digest, envelope decode, record classification).
 * 2. {@link verifyBundle}: digest, signature policy. Bundle-level errors yield a
 *    `rejected` receipt and the chain does not advance (a forged bundle cannot
 *    fork or halt a pair).
 * 3. {@link SequenceStore} `admit`: duplicate, replay conflict, gap (hold) or fork (halt).
 * 4. Per record: unknown kind, invalid record and disclosure violations are
 *    `rejected` with coded reasons; other records are `accepted`, or
 *    `accepted-in-period` when the receiver books them in its own open period.
 * 5. Seal (and optionally sign) the receipt and `commit` it.
 *
 * The receiver applies records under its own authority; the receipt is the
 * only thing that crosses back.
 *
 * @since 0.1.0
 * @module
 */
import { Instant } from "../core/Temporal.js";
import { Clock, Effect, Option, Schema } from 'effect';
import { open } from "./Bundle.js";
import { checkDisclosure } from "./Disclosure.js";
import { outcomeOf, readReceipt, sealReceipt, signReceipt } from "./Receipt.js";
import { SequenceStore } from "./Sequence.js";
import { verifyBundle } from "./Verify.js";
const reasonFor = (entry, disclosure) => {
    if (entry._tag === 'unknown-kind')
        return [{ code: 'record.unknown-kind', message: `kind ${entry.kind} is not in the receiver's profile` }];
    if (entry._tag === 'invalid')
        return [{ code: 'record.invalid', message: entry.reason }];
    return disclosure.filter((found) => found.index === entry.index).map((found) => ({ code: found.issue.code, message: found.issue.message }));
};
const recordIdOf = (raw) => {
    if (raw === null || typeof raw !== 'object' || !('id' in raw))
        return undefined;
    return typeof raw.id === 'string' && raw.id !== '' ? raw.id : undefined;
};
const recordReceipt = (entry, options) => {
    const reasons = reasonFor(entry, options.disclosure);
    const recordId = recordIdOf(entry.raw);
    const base = { index: entry.index, kind: entry.kind, recordDigest: entry.recordDigest, ...(recordId === undefined ? {} : { recordId }) };
    const [first, ...rest] = reasons;
    if (first !== undefined)
        return { ...base, outcome: 'rejected', reasons: [first, ...rest] };
    if (options.receiverPeriod !== undefined && options.receiverPeriod !== options.period)
        return { ...base, outcome: 'accepted-in-period', receiverPeriod: options.receiverPeriod };
    return { ...base, outcome: 'accepted' };
};
const recordReceipts = (opened, options) => {
    const { envelope } = opened;
    const known = opened.entries.flatMap((entry) => (entry._tag === 'known' ? [{ index: entry.index, kind: entry.kind, record: entry.entry.record }] : []));
    const disclosure = checkDisclosure({ disclosure: envelope.disclosure, issuer: envelope.issuer, audience: envelope.audience, records: known }, options.disclosure, options.policy.controlGroup);
    return opened.entries.map((entry) => recordReceipt(entry, { disclosure, period: envelope.period, ...(options.receiverPeriod === undefined ? {} : { receiverPeriod: options.receiverPeriod }) }));
};
const now = Effect.map(Clock.currentTimeMillis, (millis) => Schema.decodeSync(Instant)(new Date(Number(millis)).toISOString()));
const finish = (options, receipt) => Effect.gen(function* () {
    const sealed = yield* sealReceipt(receipt);
    if (options.signingKey === undefined)
        return sealed;
    const text = yield* signReceipt({ text: sealed.text, key: options.signingKey });
    return { text, receipt: yield* readReceipt(text) };
});
const positionOf = (opened) => ({
    issuer: opened.envelope.issuer,
    audience: opened.envelope.audience,
    bundleId: opened.envelope.bundleId,
    seq: opened.envelope.seq,
    prevBundleDigest: opened.envelope.prevBundleDigest,
    contentDigest: opened.digest,
});
/**
 * Receive one bundle from its exact wire text.
 *
 * @since 0.1.0
 * @category receiving
 */
export const receive = (options) => Effect.gen(function* () {
    const opened = yield* open(options.codec, options.text, options.supported === undefined ? {} : { supported: options.supported });
    const { envelope } = opened;
    const header = {
        specVersion: envelope.specVersion,
        bundleId: envelope.bundleId,
        issuer: envelope.issuer,
        receiver: options.self ?? envelope.audience,
        seq: envelope.seq,
        contentDigest: opened.digest,
        receivedAt: yield* now,
        ...(options.receiverPeriod === undefined ? {} : { receiverPeriod: options.receiverPeriod }),
    };
    const verification = yield* verifyBundle(opened, options.policy);
    if (verification.errorCount > 0) {
        const sealed = yield* finish(options, { ...header, outcome: 'rejected', records: [], issues: verification.issues });
        return { _tag: 'receipted', ...sealed, committed: false };
    }
    const store = yield* SequenceStore;
    const position = positionOf(opened);
    const admission = yield* store.admit(position);
    if (admission._tag === 'hold')
        return { _tag: 'held', expectedSeq: admission.expectedSeq, reason: admission.reason };
    if (admission._tag === 'halted')
        return { _tag: 'halted', reason: admission.reason };
    if (admission._tag === 'duplicate') {
        const original = Option.isSome(admission.receipt) ? yield* readReceipt(admission.receipt.value) : undefined;
        const sealed = yield* finish(options, {
            ...header,
            outcome: 'duplicate',
            records: [],
            issues: verification.issues,
            ...(original === undefined ? {} : { originalReceiptDigest: original.receiptDigest }),
        });
        return { _tag: 'duplicate', ...sealed, original: admission.receipt };
    }
    const records = recordReceipts(opened, options);
    const sealed = yield* finish(options, { ...header, outcome: outcomeOf(records), records, issues: verification.issues });
    yield* store.commit({ position, receipt: sealed.text });
    return { _tag: 'receipted', ...sealed, committed: true };
});
//# sourceMappingURL=Receiver.js.map