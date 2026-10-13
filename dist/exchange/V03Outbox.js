/** Postcommit delivery. Ambiguous failures retain the durable intent for idempotent retry. */
import { Effect, Schema, Stream } from 'effect';
import { checkBoundsV03, failV03 } from "./V03Bundle.js";
import { DurableInboxV03, TransportV03 } from "./V03Ports.js";
import { sealReceiptV03, signReceiptV03 } from "./V03Receipt.js";
export const deliverReceiptsV03 = (options) => Effect.gen(function* () {
    if (!Number.isSafeInteger(options.limit) || options.limit < 1 || options.limit > options.limits.maxRecords)
        return yield* Effect.fail(failV03('v03.outbox.limit', 'outbox batch limit must be bounded by the configured record ceiling'));
    const store = yield* DurableInboxV03;
    const transport = yield* TransportV03;
    const pending = yield* store.pendingReceipts(options.limit);
    if (pending.length > options.limit)
        return yield* Effect.fail(failV03('v03.outbox.limit', 'storage adapter exceeded its requested outbox batch ceiling'));
    for (const intent of pending) {
        const text = intent.signedText ??
            (yield* Effect.gen(function* () {
                const sealed = yield* sealReceiptV03(intent.receipt);
                const signed = yield* signReceiptV03({ text: sealed.text, key: options.key, limits: options.limits });
                return yield* store.freezeReceipt(intent.key, signed);
            }));
        yield* checkBoundsV03(text, options.limits);
        yield* transport.send({ key: intent.key, text });
        yield* store.acknowledgeReceipt(intent.key);
    }
    return pending.length;
});
/** No eager mailbox drain. Take stops upstream and releases transport resources. */
export const deliveriesV03 = (options) => Stream.unwrap(Effect.gen(function* () {
    yield* Schema.decodeUnknownEffect(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(options.limits.maxRecords)))(options.limit).pipe(Effect.mapError(() => failV03('v03.transport.limit', 'receive batch count exceeds receiver ceiling')));
    const transport = yield* TransportV03;
    return transport.receive.pipe(Stream.take(options.limit), Stream.mapEffect((text) => checkBoundsV03(text, options.limits).pipe(Effect.as(text))));
}));
//# sourceMappingURL=V03Outbox.js.map