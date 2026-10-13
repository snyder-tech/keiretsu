/**
 * Bounded exact rational arithmetic. Fractions are reduced on construction,
 * carry no binary floats, and round only at an explicit conversion boundary.
 * Wire form is canonical integer text; zero is exactly 0/1.
 * @since 0.44.12 @module
 */
import { Effect, Schema } from 'effect';
import { Decimal, fromScaled, fromUnits, SCALE_DIGITS } from "./Decimal.js";
import { gcd, normalise as normaliseParts } from "./internal/ExactRatioMath.js";
import { divide as roundInteger, RoundingMode } from "./Rounding.js";
/** Maximum decimal digits in either reduced component. @since 0.44.12 @category constants */
export const MAX_COMPONENT_DIGITS = 256;
/**
 * Maximum requested output precision. Scaling a bounded numerator by this
 * power of ten produces at most 512 intermediate digits. Rounded output
 * still obeys MAX_COMPONENT_DIGITS; precision never silently truncates inputs.
 * @since 0.44.12 @category constants
 */
export const MAX_OUTPUT_DIGITS = MAX_COMPONENT_DIGITS;
const SIGNED_INTEGER = /^(?:0|-?[1-9]\d*)$/;
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const digitCount = (text) => (text.startsWith('-') ? text.length - 1 : text.length);
const bounded = (value) => digitCount(value.toString()) <= MAX_COMPONENT_DIGITS;
const Integer = Schema.String.check(Schema.isPattern(SIGNED_INTEGER), Schema.makeFilter((text) => (digitCount(text) <= MAX_COMPONENT_DIGITS ? undefined : 'ratio component exceeds the digit bound')));
const PositiveInteger = Schema.String.check(Schema.isPattern(POSITIVE_INTEGER), Schema.makeFilter((text) => (text.length <= MAX_COMPONENT_DIGITS ? undefined : 'ratio component exceeds the digit bound')));
/** Canonical, reduced wire fraction with positive denominator. @since 0.44.12 @category schemas */
export const ExactRatio = Schema.Struct({ numerator: Integer, denominator: PositiveInteger })
    .check(Schema.makeFilter((ratio) => (gcd(BigInt(ratio.numerator), BigInt(ratio.denominator)) === 1n ? undefined : 'ratio must be reduced (zero is 0/1)')))
    .pipe(Schema.brand('keiretsu/ExactRatio'));
/** Closed expected failures; no operand text is disclosed. @since 0.44.12 @category errors */
export class ExactRatioError extends Schema.TaggedError()('ExactRatioError', {
    code: Schema.Literals(['invalid-input', 'division-by-zero', 'bound-exceeded', 'invalid-precision', 'invalid-rounding']),
    operation: Schema.String,
}) {
}
const fault = (operation, code) => new ExactRatioError({ operation, code });
const checked = (value, operation) => {
    const decoded = Schema.decodeUnknownResult(ExactRatio)(value);
    if (decoded._tag === 'Failure')
        throw fault(operation, 'invalid-input');
    return decoded.success;
};
const parsePart = (value, operation) => {
    if (typeof value !== 'string' && typeof value !== 'bigint')
        throw fault(operation, 'invalid-input');
    const text = String(value);
    if (digitCount(text) > MAX_COMPONENT_DIGITS)
        throw fault(operation, 'bound-exceeded');
    if (!SIGNED_INTEGER.test(text))
        throw fault(operation, 'invalid-input');
    return BigInt(text);
};
const normalise = (numerator, denominator, operation) => {
    if (denominator === 0n)
        throw fault(operation, 'division-by-zero');
    const { numerator: n, denominator: d } = normaliseParts(numerator, denominator);
    if (!bounded(n) || !bounded(d))
        throw fault(operation, 'bound-exceeded');
    return Schema.decodeSync(ExactRatio)({ numerator: n.toString(), denominator: d.toString() });
};
const attempt = (operation, compute) => Effect.try({
    try: compute,
    catch: (error) => (error instanceof ExactRatioError ? error : fault(operation, 'invalid-input')),
});
/** Checked synchronous constructor; throws ExactRatioError. @since 0.44.12 @category constructors */
export const fromPartsSync = (numerator, denominator) => normalise(parsePart(numerator, 'fromParts'), parsePart(denominator, 'fromParts'), 'fromParts');
/** Construct and reduce a fraction, rejecting unsafe numeric inputs. @since 0.44.12 @category constructors */
export const fromParts = (numerator, denominator) => attempt('fromParts', () => fromPartsSync(numerator, denominator));
/** Parse a canonical wire fraction without normalising received bytes. @since 0.44.12 @category constructors */
export const decode = (input) => attempt('decode', () => {
    const decoded = Schema.decodeUnknownResult(ExactRatio)(input);
    if (decoded._tag === 'Failure')
        throw fault('decode', 'invalid-input');
    return decoded.success;
});
/** Checked synchronous decimal conversion; throws ExactRatioError. @since 0.44.12 @category constructors */
export const fromDecimalSync = (value) => {
    if (typeof value !== 'string')
        throw fault('fromDecimal', 'invalid-input');
    if (value.length > MAX_COMPONENT_DIGITS + SCALE_DIGITS + 2)
        throw fault('fromDecimal', 'bound-exceeded');
    const decimal = Schema.decodeUnknownResult(Decimal)(value);
    if (decimal._tag === 'Failure')
        throw fault('fromDecimal', 'invalid-input');
    const negative = decimal.success.startsWith('-');
    const [whole = '0', fraction = ''] = (negative ? decimal.success.slice(1) : decimal.success).split('.');
    if (whole.length > MAX_COMPONENT_DIGITS)
        throw fault('fromDecimal', 'bound-exceeded');
    return normalise(BigInt(`${whole}${fraction}`) * (negative ? -1n : 1n), 10n ** BigInt(fraction.length), 'fromDecimal');
};
/** Decimal to exact rational, with no rounding. @since 0.44.12 @category constructors */
export const fromDecimal = (value) => attempt('fromDecimal', () => fromDecimalSync(value));
/** Exact multiplicative identity. @since 0.44.12 @category constants */
export const ONE = fromPartsSync(1n, 1n);
/** Exact additive identity. @since 0.44.12 @category constants */
export const ZERO = fromPartsSync(0n, 1n);
/** Checked synchronous multiplication; throws ExactRatioError. @since 0.44.12 @category math */
export const multiplySync = (left, right) => {
    const a = checked(left, 'multiply');
    const b = checked(right, 'multiply');
    const an = BigInt(a.numerator), ad = BigInt(a.denominator), bn = BigInt(b.numerator), bd = BigInt(b.denominator);
    // Cross-cancel before multiplying; intermediates have at most twice the bound.
    const crossA = gcd(an, bd), crossB = gcd(bn, ad);
    return normalise((an / crossA) * (bn / crossB), (ad / crossB) * (bd / crossA), 'multiply');
};
/** @since 0.44.12 @category math */
export const multiply = (left, right) => attempt('multiply', () => multiplySync(left, right));
/** Checked synchronous inverse; zero fails with ExactRatioError. @since 0.44.12 @category math */
export const inverseSync = (value) => {
    const ratio = checked(value, 'inverse');
    return normalise(BigInt(ratio.denominator), BigInt(ratio.numerator), 'inverse');
};
/** @since 0.44.12 @category math */
export const inverse = (value) => attempt('inverse', () => inverseSync(value));
/** @since 0.44.12 @category math */
export const divide = (left, right) => attempt('divide', () => multiplySync(left, inverseSync(right)));
const combine = (left, right, subtract) => {
    const operation = subtract ? 'subtract' : 'add';
    const a = checked(left, operation), b = checked(right, operation);
    const ad = BigInt(a.denominator), bd = BigInt(b.denominator);
    const common = gcd(ad, bd);
    return normalise(BigInt(a.numerator) * (bd / common) + (subtract ? -1n : 1n) * BigInt(b.numerator) * (ad / common), ad * (bd / common), operation);
};
/** @since 0.44.12 @category math */
export const add = (left, right) => attempt('add', () => combine(left, right, false));
/** @since 0.44.12 @category math */
export const subtract = (left, right) => attempt('subtract', () => combine(left, right, true));
/** Checked synchronous rounding to integer units; throws ExactRatioError. @since 0.44.12 @category conversions */
export const toUnitsSync = (value, options) => {
    const ratio = checked(value, 'toUnits');
    if (!Number.isInteger(options.digits) || options.digits < 0 || options.digits > MAX_OUTPUT_DIGITS)
        throw fault('toUnits', 'invalid-precision');
    if (Schema.decodeUnknownResult(RoundingMode)(options.rounding)._tag === 'Failure')
        throw fault('toUnits', 'invalid-rounding');
    const units = roundInteger(BigInt(ratio.numerator) * 10n ** BigInt(options.digits), BigInt(ratio.denominator), options.rounding);
    if (!bounded(units))
        throw fault('toUnits', 'bound-exceeded');
    return units;
};
/** Round once to integer minor units with an explicit mode. @since 0.44.12 @category conversions */
export const toUnits = (value, options) => attempt('toUnits', () => toUnitsSync(value, options));
/** Explicitly rounded Decimal projection, never an exact-arithmetic intermediate. @since 0.44.12 @category conversions */
export const toDecimal = (value, options) => attempt('toDecimal', () => {
    if (options.digits > SCALE_DIGITS)
        throw fault('toDecimal', 'invalid-precision');
    return fromScaled(fromUnits(toUnitsSync(value, options), options.digits));
});
//# sourceMappingURL=ExactRatio.js.map