/**
 * Base64 and base64url (RFC 4648) without padding for base64url, with padding
 * for standard base64. Pure, no host dependencies.
 *
 * @since 0.1.0
 * @module
 * @internal
 */
const STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/** The third and fourth symbols are present only for their corresponding source bytes. */
const trailingSymbol = (alphabet, index, present, pad) => (present ? (alphabet[index] ?? '') : pad ? '=' : '');
const encodeGroup = (bytes, index, alphabet, pad) => {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    const remaining = bytes.length - index;
    let out = alphabet[(triple >> 18) & 63] ?? '';
    out += alphabet[(triple >> 12) & 63] ?? '';
    out += trailingSymbol(alphabet, (triple >> 6) & 63, remaining > 1, pad);
    out += trailingSymbol(alphabet, triple & 63, remaining > 2, pad);
    return out;
};
const encodeWith = (bytes, alphabet, pad) => {
    let out = '';
    for (let index = 0; index < bytes.length; index += 3) {
        out += encodeGroup(bytes, index, alphabet, pad);
    }
    return out;
};
const decodeWith = (text, alphabet) => {
    const body = text.replace(/=+$/, '');
    if (body.length % 4 === 1)
        return undefined;
    const bytes = [];
    let buffer = 0;
    let bits = 0;
    for (const char of body) {
        const value = alphabet.indexOf(char);
        if (value < 0)
            return undefined;
        buffer = (buffer << 6) | value;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xff);
        }
    }
    return Uint8Array.from(bytes);
};
/** @since 0.1.0 @category encoding */
export const encodeUrl = (bytes) => encodeWith(bytes, URL_SAFE, false);
/** @since 0.1.0 @category encoding */
export const decodeUrl = (text) => (/^[A-Za-z0-9_-]*$/.test(text) ? decodeWith(text, URL_SAFE) : undefined);
/** @since 0.1.0 @category encoding */
export const encodeStandard = (bytes) => encodeWith(bytes, STANDARD, true);
/** @since 0.1.0 @category encoding */
export const decodeStandard = (text) => (/^[A-Za-z0-9+/]*={0,2}$/.test(text) ? decodeWith(text, STANDARD) : undefined);
/** @since 0.1.0 @category encoding */
export const utf8 = (text) => new TextEncoder().encode(text);
/** @since 0.1.0 @category encoding */
export const fromUtf8 = (bytes) => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
//# sourceMappingURL=Base64.js.map