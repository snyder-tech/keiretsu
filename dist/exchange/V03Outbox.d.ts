/** Postcommit delivery. Ambiguous failures retain the durable intent for idempotent retry. */
import { Effect, Stream } from 'effect';
import type { SigningKey } from './Jws.ts';
import type { LimitsV03 } from './V03Contracts.ts';
import { DurableInboxV03, TransportV03 } from './V03Ports.ts';
export declare const deliverReceiptsV03: (options: {
    readonly limit: number;
    readonly key: SigningKey;
    readonly limits: LimitsV03;
}) => Effect.Effect<number, import("./V03Bundle.ts").ExchangeErrorV03 | import("./V03Ports.ts").StorageErrorV03 | import("./V03Ports.ts").TransportErrorV03, DurableInboxV03 | TransportV03>;
/** No eager mailbox drain. Take stops upstream and releases transport resources. */
export declare const deliveriesV03: (options: {
    readonly limit: number;
    readonly limits: LimitsV03;
}) => Stream.Stream<string, import("./V03Bundle.ts").ExchangeErrorV03 | import("./V03Ports.ts").TransportErrorV03, TransportV03>;
//# sourceMappingURL=V03Outbox.d.ts.map