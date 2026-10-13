/** 0.3 numeric wire profile: exact safe integers, with at most six significant exponent digits.
 * This preflight never constructs powers or BigInts. The enclosing boundary bounds token bytes.
 * Exponent limits apply to zero coefficients too; leading exponent zeroes do not count.
 * The legacy strict parser remains unchanged.
 */
const SAFE_MAXIMUM = '9007199254740991';
const EXPONENT_DIGITS = 6;
const NUMBER_TOKEN = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

const exponentOf = (text: string): number | undefined => {
  const digits = text.replace(/^[+-]/, '').replace(/^0+/, '');
  if (digits.length > EXPONENT_DIGITS) return undefined;
  const absolute = Number(digits);
  return text.startsWith('-') ? -absolute : absolute;
};
const exactIntegerReason = (token: string): string | undefined => {
  const [mantissa = '', exponentText = '0'] = token.toLowerCase().split('e');
  const exponent = exponentOf(exponentText);
  if (exponent === undefined) return 'numeric exponents may contain at most six significant digits';
  const point = mantissa.indexOf('.');
  const fractionLength = point === -1 ? 0 : mantissa.length - point - 1;
  const digits = mantissa.replace('-', '').replace('.', '');
  const withoutTrailing = digits.replace(/0+$/, '');
  const significant = withoutTrailing.replace(/^0+/, '');
  if (significant.length === 0) return undefined;
  const scale = exponent - fractionLength + digits.length - withoutTrailing.length;
  if (scale < 0) return 'wire numbers must be exactly integral before JavaScript rounding';
  const length = significant.length + scale;
  if (length > SAFE_MAXIMUM.length) return 'wire numbers must be within the safe integer range';
  const integer = significant + '0'.repeat(scale);
  if (integer.length === SAFE_MAXIMUM.length && integer > SAFE_MAXIMUM) return 'wire numbers must be within the safe integer range';
  return undefined;
};
const startsNumber = (character: string): boolean => character === '-' || (character >= '0' && character <= '9');

/** Check only unquoted numeric lexemes; JSON syntax remains the canonical parser's responsibility. */
export const numericWireReasonV03 = (text: string): string | undefined => {
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (quoted || !startsNumber(character)) continue;
    NUMBER_TOKEN.lastIndex = index;
    const match = NUMBER_TOKEN.exec(text);
    if (match === null) return 'invalid numeric token';
    const reason = exactIntegerReason(match[0]);
    if (reason !== undefined) return reason;
    index = NUMBER_TOKEN.lastIndex - 1;
  }
  return undefined;
};
