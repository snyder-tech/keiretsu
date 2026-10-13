/** Portable ports. Hosts own authentication, transactional authority, domain writes and storage. */
import { Context, Schema } from 'effect';
export class StorageErrorV03 extends Schema.TaggedError()('StorageErrorV03', { reason: Schema.NonEmptyString }) {
}
export class TransportErrorV03 extends Schema.TaggedError()('TransportErrorV03', {
    classification: Schema.Literals(['transient', 'permanent', 'ambiguous']),
    code: Schema.NonEmptyString,
}) {
}
export class HostAuthorizationV03 extends Context.Service()('@snyder-tech/keiretsu/exchange/HostAuthorizationV03') {
}
export class DurableInboxV03 extends Context.Service()('@snyder-tech/keiretsu/exchange/DurableInboxV03') {
}
/** Pull one bounded delivery at a time. Implementations propagate interruption to their I/O. */
export class TransportV03 extends Context.Service()('@snyder-tech/keiretsu/exchange/TransportV03') {
}
//# sourceMappingURL=V03Ports.js.map