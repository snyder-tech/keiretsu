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
const trailingSymbol = (alphabet: string, index: number, present: boolean, pad: boolean): string => (present ? (alphabet[index] ?? '') : pad ? '=' : '');

const encodeGroup = (bytes: Uint8Array, index: number, alphabet: string, pad: boolean): string => {
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

const encodeWith = (bytes: Uint8Array, alphabet: string, pad: boolean): string => {
  let out = '';
  for (let index = 0; index < bytes.length; index += 3) {
    out += encodeGroup(bytes, index, alphabet, pad);
  }
  return out;
};

const decodeWith = (text: string, alphabet: string): Uint8Array<ArrayBuffer> | undefined => {
  const body = text.replace(/=+$/, '');
  if (body.length % 4 === 1) return undefined;
  const bytes: Array<number> = [];
  let buffer = 0;
  let bits = 0;
  for (const char of body) {
    const value = alphabet.indexOf(char);
    if (value < 0) return undefined;
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
export const encodeUrl = (bytes: Uint8Array): string => encodeWith(bytes, URL_SAFE, false);
/** @since 0.1.0 @category encoding */
export const decodeUrl = (text: string): Uint8Array<ArrayBuffer> | undefined => (/^[A-Za-z0-9_-]*$/.test(text) ? decodeWith(text, URL_SAFE) : undefined);
/** @since 0.1.0 @category encoding */
export const encodeStandard = (bytes: Uint8Array): string => encodeWith(bytes, STANDARD, true);
/** @since 0.1.0 @category encoding */
export const decodeStandard = (text: string): Uint8Array<ArrayBuffer> | undefined => (/^[A-Za-z0-9+/]*={0,2}$/.test(text) ? decodeWith(text, STANDARD) : undefined);
/** @since 0.1.0 @category encoding */
export const utf8 = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text);
/** @since 0.1.0 @category encoding */
export const fromUtf8 = (bytes: Uint8Array): string => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
