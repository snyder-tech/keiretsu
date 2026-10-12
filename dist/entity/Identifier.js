/**
 * Scheme-tagged party identifiers and their format checks.
 *
 * The wire shape is open: `{ scheme, value }` where `scheme` is a known scheme
 * or an `x-` extension. Format and checksum rules run after decode and return
 * findings with stable codes, so an unfamiliar scheme never breaks decoding.
 *
 * Known schemes map to ISO 20022 `OrganisationIdentification` (`LEI`,
 * `Othr/SchmeNm`) and UBL `cbc:CompanyID@schemeID`.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Schemes with format rules in this package.
 *
 * @since 0.1.0
 * @category constants
 */
export const KNOWN_SCHEMES = ['lei', 'us-ein', 'in-pan', 'in-gstin', 'in-cin', 'pk-ntn'];
/**
 * Identifier scheme: `lei`, a `<country>-<name>` scheme or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IdentifierScheme = Schema.String.check(Schema.isPattern(/^(?:lei|[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*|x-[a-z0-9]+(?:-[a-z0-9]+)*)$/));
/**
 * A scheme-tagged identifier value. Never free text without a scheme.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Identifier = Schema.Struct({ scheme: IdentifierScheme, value: Schema.NonEmptyString });
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const mod97 = (digits) => {
    let remainder = 0;
    for (const digit of digits.split(''))
        remainder = (remainder * 10 + Number(digit)) % 97;
    return remainder;
};
const leiDigits = (text) => text.split('').map((char) => String(ALPHANUMERIC.indexOf(char))).join('');
/** @since 0.1.0 @category patterns */
export const LEI_PATTERN = /^[A-Z0-9]{18}[0-9]{2}$/;
/**
 * Check digits for an 18-character LEI prefix (ISO 17442, ISO 7064 MOD 97-10).
 *
 * @since 0.1.0
 * @category checksums
 */
export const leiCheckDigits = (prefix) => String(98 - mod97(`${leiDigits(prefix)}00`)).padStart(2, '0');
/**
 * Whether `value` is a well-formed LEI with valid MOD 97-10 check digits.
 *
 * @since 0.1.0
 * @category checksums
 */
export const leiIsValid = (value) => LEI_PATTERN.test(value) && mod97(leiDigits(value)) === 1;
/** @since 0.1.0 @category patterns */
export const EIN_PATTERN = /^\d{2}-\d{7}$/;
/**
 * IRS campus prefixes in use for EINs (data; prefixes change, so a miss is a warning).
 *
 * @since 0.1.0
 * @category constants
 */
export const EIN_PREFIXES = new Set([
    '01-06',
    '10-16',
    '20-27',
    '30-48',
    '50-68',
    '71-77',
    '80-88',
    '90-95',
    '98-99',
].flatMap((range) => {
    const [low = 0, high = 0] = range.split('-').map(Number);
    return Array.from({ length: high - low + 1 }, (_, offset) => String(low + offset).padStart(2, '0'));
}));
/** @since 0.1.0 @category patterns */
export const PAN_PATTERN = /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/;
/** @since 0.1.0 @category patterns */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
/**
 * GSTIN check character for the first 14 characters (alternating weights 1, 2 over base 36).
 *
 * @since 0.1.0
 * @category checksums
 */
export const gstinCheckChar = (first14) => {
    let sum = 0;
    first14.split('').forEach((char, index) => {
        const product = ALPHANUMERIC.indexOf(char) * (index % 2 === 0 ? 1 : 2);
        sum += Math.floor(product / 36) + (product % 36);
    });
    return ALPHANUMERIC.charAt((36 - (sum % 36)) % 36);
};
/**
 * Whether `value` is a well-formed GSTIN with a valid check character.
 *
 * @since 0.1.0
 * @category checksums
 */
export const gstinIsValid = (value) => GSTIN_PATTERN.test(value) && gstinCheckChar(value.slice(0, 14)) === value.slice(14);
/**
 * The PAN embedded in a GSTIN (characters 3–12).
 *
 * @since 0.1.0
 * @category accessors
 */
export const gstinPan = (value) => value.slice(2, 12);
/** @since 0.1.0 @category patterns */
export const CIN_PATTERN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
/**
 * Pakistan NTN: seven digits and a check digit, or a 13-digit CNIC-based number.
 *
 * @since 0.1.0
 * @category patterns
 */
export const NTN_PATTERN = /^(?:\d{7}-\d|\d{13})$/;
const finding = (code, message, severity = 'error') => ({ code, severity, message });
const checkLei = (value) => {
    if (!LEI_PATTERN.test(value))
        return [finding('identifier.lei-format', 'LEI must be 18 alphanumerics and 2 check digits')];
    return leiIsValid(value) ? [] : [finding('identifier.lei-checksum', 'LEI fails the MOD 97-10 check')];
};
const checkEin = (value) => {
    if (!EIN_PATTERN.test(value))
        return [finding('identifier.ein-format', 'EIN must be NN-NNNNNNN')];
    return EIN_PREFIXES.has(value.slice(0, 2)) ? [] : [finding('identifier.ein-prefix', `EIN prefix ${value.slice(0, 2)} is not a known IRS prefix`, 'warning')];
};
const checkGstin = (value) => {
    if (!GSTIN_PATTERN.test(value))
        return [finding('identifier.gstin-format', 'GSTIN must be state code, PAN, entity number, Z and a check character')];
    return gstinIsValid(value) ? [] : [finding('identifier.gstin-checksum', 'GSTIN check character does not match')];
};
const patternCheck = (pattern, code, message) => (value) => pattern.test(value) ? [] : [finding(code, message)];
const CHECKS = {
    lei: checkLei,
    'us-ein': checkEin,
    'in-pan': patternCheck(PAN_PATTERN, 'identifier.pan-format', 'PAN must be AAAAA9999A with a valid holder-type letter'),
    'in-gstin': checkGstin,
    'in-cin': patternCheck(CIN_PATTERN, 'identifier.cin-format', 'CIN must be the 21-character MCA format'),
    'pk-ntn': patternCheck(NTN_PATTERN, 'identifier.ntn-format', 'NTN must be NNNNNNN-N or a 13-digit number'),
};
const isKnownScheme = (scheme) => 
// SAFETY: widening a readonly tuple of literals to ReadonlyArray<string> is a safe upcast for `includes`.
KNOWN_SCHEMES.includes(scheme);
/**
 * Format and checksum findings for one identifier. Unknown non-`x-` schemes yield a warning.
 *
 * @since 0.1.0
 * @category checks
 */
export const checkIdentifier = (identifier) => {
    if (isKnownScheme(identifier.scheme))
        return CHECKS[identifier.scheme](identifier.value);
    if (identifier.scheme.startsWith('x-'))
        return [];
    return [finding('identifier.scheme-unknown', `scheme ${identifier.scheme} has no format rules here`, 'warning')];
};
/**
 * The country a scheme is issued in, if it is country-specific.
 *
 * @since 0.1.0
 * @category accessors
 */
export const schemeCountry = (scheme) => {
    const match = /^([a-z]{2})-/.exec(scheme);
    return match?.[1]?.toUpperCase();
};
//# sourceMappingURL=Identifier.js.map