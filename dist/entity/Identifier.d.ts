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
export declare const KNOWN_SCHEMES: readonly ["lei", "us-ein", "in-pan", "in-gstin", "in-cin", "pk-ntn"];
/** @since 0.1.0 @category models */
export type KnownScheme = (typeof KNOWN_SCHEMES)[number];
/**
 * Identifier scheme: `lei`, a `<country>-<name>` scheme or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IdentifierScheme: Schema.String;
/**
 * A scheme-tagged identifier value. Never free text without a scheme.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Identifier: Schema.Struct<{
    readonly scheme: Schema.String;
    readonly value: Schema.NonEmptyString;
}>;
/** @since 0.1.0 @category models */
export type Identifier = typeof Identifier.Type;
/**
 * One identifier check result.
 *
 * @since 0.1.0
 * @category models
 */
export interface IdentifierFinding {
    readonly code: string;
    readonly severity: 'error' | 'warning';
    readonly message: string;
}
/** @since 0.1.0 @category patterns */
export declare const LEI_PATTERN: RegExp;
/**
 * Check digits for an 18-character LEI prefix (ISO 17442, ISO 7064 MOD 97-10).
 *
 * @since 0.1.0
 * @category checksums
 */
export declare const leiCheckDigits: (prefix: string) => string;
/**
 * Whether `value` is a well-formed LEI with valid MOD 97-10 check digits.
 *
 * @since 0.1.0
 * @category checksums
 */
export declare const leiIsValid: (value: string) => boolean;
/** @since 0.1.0 @category patterns */
export declare const EIN_PATTERN: RegExp;
/**
 * IRS campus prefixes in use for EINs (data; prefixes change, so a miss is a warning).
 *
 * @since 0.1.0
 * @category constants
 */
export declare const EIN_PREFIXES: ReadonlySet<string>;
/** @since 0.1.0 @category patterns */
export declare const PAN_PATTERN: RegExp;
/** @since 0.1.0 @category patterns */
export declare const GSTIN_PATTERN: RegExp;
/**
 * GSTIN check character for the first 14 characters (alternating weights 1, 2 over base 36).
 *
 * @since 0.1.0
 * @category checksums
 */
export declare const gstinCheckChar: (first14: string) => string;
/**
 * Whether `value` is a well-formed GSTIN with a valid check character.
 *
 * @since 0.1.0
 * @category checksums
 */
export declare const gstinIsValid: (value: string) => boolean;
/**
 * The PAN embedded in a GSTIN (characters 3–12).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const gstinPan: (value: string) => string;
/** @since 0.1.0 @category patterns */
export declare const CIN_PATTERN: RegExp;
/**
 * Pakistan NTN: seven digits and a check digit, or a 13-digit CNIC-based number.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const NTN_PATTERN: RegExp;
/**
 * Format and checksum findings for one identifier. Unknown non-`x-` schemes yield a warning.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const checkIdentifier: (identifier: Identifier) => ReadonlyArray<IdentifierFinding>;
/**
 * The country a scheme is issued in, if it is country-specific.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const schemeCountry: (scheme: string) => string | undefined;
//# sourceMappingURL=Identifier.d.ts.map