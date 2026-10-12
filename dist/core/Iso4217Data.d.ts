/**
 * ISO 4217 minor-unit exponents (data pack). Codes absent here are unknown to
 * this pack; callers receive a typed failure rather than a guessed exponent.
 *
 * Coverage note: this edition lists commonly traded currencies and every
 * currency whose exponent differs from 2. Regenerate from the ISO 4217
 * maintenance agency list (List One) before 1.0.
 *
 * @since 0.1.0
 * @module
 */
/**
 * Edition identifier recorded on values derived from this pack.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const EDITION: "iso4217-2026-01-partial";
/**
 * Alphabetic code → minor-unit exponent.
 *
 * @since 0.1.0
 * @category data
 */
export declare const MINOR_UNITS: ReadonlyMap<string, number>;
//# sourceMappingURL=Iso4217Data.d.ts.map