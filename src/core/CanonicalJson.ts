/**
 * Strict JSON parsing, RFC 8785 (JCS) canonical form and SHA-256 digests.
 *
 * Digests are computed over the **received wire JSON**, never over a decoded
 * value: decoding may drop unknown members or normalise values. The strict
 * parser rejects duplicate member names and lone surrogates (which
 * `JSON.parse` silently accepts), and canonicalisation accepts only strings,
 * safe integers, booleans, null, arrays and objects — keiretsu wire values
 * carry decimals as canonical strings.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';

import { sha256Hex } from './internal/sha256.ts';

/**
 * Lowercase hex SHA-256.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Sha256 = Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)).pipe(Schema.brand('keiretsu/Sha256'));
/** @since 0.1.0 @category models */
export type Sha256 = typeof Sha256.Type;

/**
 * Input that is not strict JSON or not canonicalisable.
 *
 * @since 0.1.0
 * @category errors
 */
export class CanonicalJsonError extends Data.TaggedError('CanonicalJsonError')<{
  readonly at: string;
  readonly reason: string;
  readonly code: 'core.json-duplicate-member' | 'core.json-lone-surrogate' | 'core.json-invalid';
}> {}

/** Encoding failure at a JSON boundary. @since 0.1.0 @category errors */
export const invalidJson = (at: string, reason: string): CanonicalJsonError => new CanonicalJsonError({ at, reason, code: 'core.json-invalid' });

/** @since 0.1.0 @category models */
export type JsonValue = null | boolean | number | string | ReadonlyArray<JsonValue> | { readonly [key: string]: JsonValue };

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

class Parser {
  private index = 0;
  private readonly text: string;

  constructor(text: string) {
    this.text = text;
  }

  parse(): JsonValue {
    const value = this.value();
    this.whitespace();
    if (this.index !== this.text.length) this.fail('trailing characters');
    return value;
  }

  private fail(reason: string, code: CanonicalJsonError['code'] = 'core.json-invalid'): never {
    throw new CanonicalJsonError({ at: `offset ${this.index}`, reason, code });
  }

  private whitespace(): void {
    while (/[ \t\n\r]/.test(this.text[this.index] ?? '')) this.index += 1;
  }

  private value(): JsonValue {
    this.whitespace();
    const char = this.text[this.index];
    if (char === '{') return this.object();
    if (char === '[') return this.array();
    if (char === '"') return this.string();
    return this.literal();
  }

  private object(): JsonValue {
    this.index += 1;
    const result: Record<string, JsonValue> = {};
    const seen = new Set<string>();
    this.whitespace();
    if (this.text[this.index] === '}') {
      this.index += 1;
      return result;
    }
    for (;;) {
      this.whitespace();
      if (this.text[this.index] !== '"') this.fail('expected member name');
      const key = this.string();
      if (seen.has(key)) this.fail(`duplicate member ${JSON.stringify(key)}`, 'core.json-duplicate-member');
      seen.add(key);
      this.whitespace();
      if (this.text[this.index] !== ':') this.fail('expected ":"');
      this.index += 1;
      Object.defineProperty(result, key, { value: this.value(), enumerable: true, writable: true, configurable: true });
      this.whitespace();
      const next = this.text[this.index];
      this.index += 1;
      if (next === '}') return result;
      if (next !== ',') this.fail('expected "," or "}"');
    }
  }

  private array(): JsonValue {
    this.index += 1;
    const result: Array<JsonValue> = [];
    this.whitespace();
    if (this.text[this.index] === ']') {
      this.index += 1;
      return result;
    }
    for (;;) {
      result.push(this.value());
      this.whitespace();
      const next = this.text[this.index];
      this.index += 1;
      if (next === ']') return result;
      if (next !== ',') this.fail('expected "," or "]"');
    }
  }

  private stringEnd(): number {
    let cursor = this.index + 1;
    while (cursor < this.text.length) {
      const code = this.text.charCodeAt(cursor);
      if (code < 0x20) this.fail('control character in string');
      if (code === 0x22) return cursor + 1;
      cursor += code === 0x5c ? 2 : 1;
    }
    return this.fail('unterminated string');
  }

  private string(): string {
    const end = this.stringEnd();
    const literal = this.text.slice(this.index, end);
    if (!/^"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"$/.test(literal)) this.fail('invalid escape');
    this.index = end;
    // The literal is a complete, validated JSON string, so JSON.parse yields a string.
    const value: string = JSON.parse(literal);
    if (LONE_SURROGATE.test(value)) this.fail('lone surrogate', 'core.json-lone-surrogate');
    return value;
  }

  private literal(): JsonValue {
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(this.text.slice(this.index));
    if (match === null) this.fail('unexpected token');
    this.index += match[0].length;
    // The match is a JSON boolean, null or number literal.
    const value: JsonValue = JSON.parse(match[0]);
    return value;
  }
}

/**
 * Parse JSON text strictly (no duplicate members, no lone surrogates).
 *
 * @since 0.1.0
 * @category parsing
 */
export const parseStrict = (text: string): Effect.Effect<JsonValue, CanonicalJsonError> =>
  Effect.try({
    try: () => new Parser(text).parse(),
    catch: (cause) => (cause instanceof CanonicalJsonError ? cause : new CanonicalJsonError({ code: 'core.json-invalid', at: '$', reason: String(cause) })),
  });

const compareCodeUnits = (left: string, right: string): number => {
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

const canonicalNumber = (value: number, at: string): string => {
  if (!Number.isSafeInteger(value)) throw new CanonicalJsonError({ code: 'core.json-invalid', at, reason: 'only safe integers are canonical; encode decimals as strings' });
  return Object.is(value, -0) ? '0' : String(value);
};

const canonicalString = (value: string, at: string): string => {
  if (LONE_SURROGATE.test(value)) throw new CanonicalJsonError({ code: 'core.json-lone-surrogate', at, reason: 'lone surrogate' });
  return JSON.stringify(value);
};

const render = (value: unknown, at: string): string => {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return canonicalNumber(value, at);
  if (typeof value === 'string') return canonicalString(value, at);
  if (Array.isArray(value)) return `[${value.map((entry, position) => render(entry, `${at}[${position}]`)).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => compareCodeUnits(left, right));
    return `{${entries.map(([key, entry]) => `${canonicalString(key, at)}:${render(entry, `${at}.${key}`)}`).join(',')}}`;
  }
  throw new CanonicalJsonError({ code: 'core.json-invalid', at, reason: `unsupported ${typeof value}` });
};

/**
 * RFC 8785 canonical JSON. Members whose value is `undefined` are omitted.
 *
 * @since 0.1.0
 * @category canonicalisation
 */
export const canonicalize = (value: unknown): Effect.Effect<string, CanonicalJsonError> =>
  Effect.try({
    try: () => render(value, '$'),
    catch: (cause) => (cause instanceof CanonicalJsonError ? cause : new CanonicalJsonError({ code: 'core.json-invalid', at: '$', reason: String(cause) })),
  });

const toSha256 = (buffer: ArrayBuffer): Sha256 => {
  const hex = [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  // SAFETY: SHA-256 yields 32 bytes, rendered as 64 lowercase hex characters.
  return hex as Sha256;
};

/**
 * SHA-256 over the canonical JSON of a value (use for values you produced).
 *
 * @since 0.1.0
 * @category digests
 */
export const digestValue = (value: unknown): Effect.Effect<Sha256, CanonicalJsonError> =>
  Effect.flatMap(canonicalize(value), (json) => Effect.promise(() => crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))).pipe(Effect.map(toSha256)));

/**
 * Synchronous SHA-256 over the canonical JSON of a value, for pure validators.
 * Produces the same digest as {@link digestValue}.
 *
 * @since 0.1.0
 * @category digests
 */
export const digestValueSync = (value: unknown): Effect.Effect<Sha256, CanonicalJsonError> =>
  Effect.map(canonicalize(value), (json) => {
    const hex = sha256Hex(new TextEncoder().encode(json));
    // SAFETY: sha256Hex returns 64 lowercase hex characters.
    return hex as Sha256;
  });

/**
 * SHA-256 over received wire JSON: strict parse, optionally drop named
 * top-level members (e.g. the digest and signature fields), canonicalise, hash.
 *
 * @since 0.1.0
 * @category digests
 */
export const digestWire = (text: string, omitMembers: ReadonlyArray<string> = []): Effect.Effect<Sha256, CanonicalJsonError> =>
  Effect.flatMap(parseStrict(text), (parsed) => {
    if (omitMembers.length === 0 || parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return digestValue(parsed);
    return digestValue(Object.fromEntries(Object.entries(parsed).filter(([key]) => !omitMembers.includes(key))));
  });
