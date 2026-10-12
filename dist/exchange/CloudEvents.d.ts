/**
 * CloudEvents 1.0 binding for bundles (structured JSON mode).
 *
 * `id` = bundleId, `source` = the issuer's URI, `type` =
 * `org.keiretsu.exchange.bundle.v1`, `subject` = the audience party key,
 * `time` = issuedAt, plus extension attributes `kwxseq` and `kwxdigest`. The
 * bundle travels as `data_base64` so the exact received text, and therefore
 * its digest, survives any queue that re-serialises JSON.
 *
 * @since 0.1.0
 * @module
 */
import type { Envelope } from './Bundle.ts';
/**
 * Event type for bundles.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const BUNDLE_EVENT_TYPE = "org.keiretsu.exchange.bundle.v1";
/**
 * A structured-mode CloudEvent carrying one bundle.
 *
 * @since 0.1.0
 * @category models
 */
export interface BundleEvent {
    readonly specversion: '1.0';
    readonly id: string;
    readonly source: string;
    readonly type: typeof BUNDLE_EVENT_TYPE;
    readonly subject: string;
    readonly time: string;
    readonly datacontenttype: 'application/json';
    readonly dataschema?: string;
    readonly kwxseq: number;
    readonly kwxdigest: string;
    readonly data_base64: string;
}
/**
 * Map a bundle (its decoded envelope and exact text) to a CloudEvent. Pure.
 *
 * @since 0.1.0
 * @category mapping
 */
export declare const toCloudEvent: (input: {
    readonly envelope: Pick<Envelope, "bundleId" | "audience" | "issuedAt" | "seq" | "contentDigest">;
    readonly text: string;
    /** URI identifying the issuer, e.g. `https://example.org/keiretsu/<entity-id>`. */
    readonly source: string;
    readonly dataschema?: string;
}) => BundleEvent;
/**
 * Recover the exact bundle text from a CloudEvent; `undefined` when the event
 * is not a keiretsu bundle event or its payload is not valid base64 UTF-8.
 *
 * @since 0.1.0
 * @category mapping
 */
export declare const fromCloudEvent: (event: {
    readonly type?: unknown;
    readonly data_base64?: unknown;
}) => string | undefined;
//# sourceMappingURL=CloudEvents.d.ts.map