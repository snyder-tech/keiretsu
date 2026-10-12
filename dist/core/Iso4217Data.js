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
export const EDITION = 'iso4217-2026-01-partial';
/**
 * Alphabetic code → minor-unit exponent.
 *
 * @since 0.1.0
 * @category data
 */
export const MINOR_UNITS = new Map([
    ...['AED', 'ARS', 'AUD', 'BDT', 'BRL', 'CAD', 'CHF', 'CNY', 'COP', 'CZK', 'DKK', 'EGP', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'KES', 'LKR', 'MAD', 'MXN', 'MYR', 'NGN', 'NOK', 'NPR', 'NZD', 'PEN', 'PHP', 'PKR', 'PLN', 'QAR', 'RON', 'RUB', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'UAH', 'USD', 'ZAR'].map((code) => [code, 2]),
    ...['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'].map((code) => [code, 0]),
    ...['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'].map((code) => [code, 3]),
    ['CLF', 4],
    ['UYW', 4],
]);
//# sourceMappingURL=Iso4217Data.js.map