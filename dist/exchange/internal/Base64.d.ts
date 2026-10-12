/**
 * Base64 and base64url (RFC 4648) without padding for base64url, with padding
 * for standard base64. Pure, no host dependencies.
 *
 * @since 0.1.0
 * @module
 * @internal
 */
/** @since 0.1.0 @category encoding */
export declare const encodeUrl: (bytes: Uint8Array) => string;
/** @since 0.1.0 @category encoding */
export declare const decodeUrl: (text: string) => Uint8Array<ArrayBuffer> | undefined;
/** @since 0.1.0 @category encoding */
export declare const encodeStandard: (bytes: Uint8Array) => string;
/** @since 0.1.0 @category encoding */
export declare const decodeStandard: (text: string) => Uint8Array<ArrayBuffer> | undefined;
/** @since 0.1.0 @category encoding */
export declare const utf8: (text: string) => Uint8Array<ArrayBuffer>;
/** @since 0.1.0 @category encoding */
export declare const fromUtf8: (bytes: Uint8Array) => string;
//# sourceMappingURL=Base64.d.ts.map