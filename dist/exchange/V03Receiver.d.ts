/** Restart-safe two-stage admission/application. No domain writes occur on classification. */
import { Effect } from 'effect';
import type { KeyResolver } from './KeyResolver.ts';
import type { DescriptorMap } from './Profile.ts';
import { type ExchangeErrorV03, type OpenedV03 } from './V03Bundle.ts';
import { type LimitsV03 } from './V03Contracts.ts';
import { DurableInboxV03, HostAuthorizationV03 } from './V03Ports.ts';
export declare const pairKeyV03: (envelope: OpenedV03["envelope"]) => string;
export declare const inboundKeyV03: (envelope: OpenedV03["envelope"]) => string;
/** Tx1 atomically stores sequence/replay state, permitted payload, commands and receipt intents. */
export declare const receiveV03: (options: {
    readonly text: string;
    readonly limits: LimitsV03;
    readonly descriptors: DescriptorMap;
}) => Effect.Effect<{
    tag: "rejected" | "held" | "duplicate" | "admitted";
    key: string;
    classification: {
        readonly text: string;
        readonly receipt: import("./V03Contracts.ts").ReceiptV03;
    };
    validation: {
        readonly text: string;
        readonly receipt: import("./V03Contracts.ts").ReceiptV03;
    };
}, ExchangeErrorV03 | import("./V03Ports.ts").StorageErrorV03, KeyResolver | HostAuthorizationV03 | DurableInboxV03>;
/** Tx2 survives restarts and rechecks current host authority and expected revisions before writes. */
export declare const applyV03: (options: {
    readonly key: string;
    readonly applicationId: string;
}) => Effect.Effect<{
    readonly text: string;
    readonly receipt: import("./V03Contracts.ts").ReceiptV03;
}, ExchangeErrorV03 | import("./V03Ports.ts").StorageErrorV03, HostAuthorizationV03 | DurableInboxV03>;
/** Public error/service channels remain inferred, including mandatory KeyResolver on ingress. */
export type ReceiveRequirementsV03 = DurableInboxV03 | HostAuthorizationV03 | KeyResolver;
export type ReceiveFailureV03 = ExchangeErrorV03 | import('./V03Ports.ts').StorageErrorV03;
//# sourceMappingURL=V03Receiver.d.ts.map