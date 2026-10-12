import { decodeStandard, encodeStandard, fromUtf8, utf8 } from "./internal/Base64.js";
import { partyKey } from "./Party.js";
/**
 * Event type for bundles.
 *
 * @since 0.1.0
 * @category constants
 */
export const BUNDLE_EVENT_TYPE = 'org.keiretsu.exchange.bundle.v1';
/**
 * Map a bundle (its decoded envelope and exact text) to a CloudEvent. Pure.
 *
 * @since 0.1.0
 * @category mapping
 */
export const toCloudEvent = (input) => ({
    specversion: '1.0',
    id: input.envelope.bundleId,
    source: input.source,
    type: BUNDLE_EVENT_TYPE,
    subject: partyKey(input.envelope.audience),
    time: input.envelope.issuedAt,
    datacontenttype: 'application/json',
    ...(input.dataschema === undefined ? {} : { dataschema: input.dataschema }),
    kwxseq: input.envelope.seq,
    kwxdigest: input.envelope.contentDigest,
    data_base64: encodeStandard(utf8(input.text)),
});
/**
 * Recover the exact bundle text from a CloudEvent; `undefined` when the event
 * is not a keiretsu bundle event or its payload is not valid base64 UTF-8.
 *
 * @since 0.1.0
 * @category mapping
 */
export const fromCloudEvent = (event) => {
    if (event.type !== BUNDLE_EVENT_TYPE || typeof event.data_base64 !== 'string')
        return undefined;
    const bytes = decodeStandard(event.data_base64);
    if (bytes === undefined)
        return undefined;
    try {
        return fromUtf8(bytes);
    }
    catch {
        return undefined;
    }
};
//# sourceMappingURL=CloudEvents.js.map