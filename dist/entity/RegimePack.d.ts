import { Schema } from 'effect';
/**
 * Regime code pattern, e.g. `us-w2`, `in-192`, `pk-149`, or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RegimeCode: Schema.String;
/** @since 0.1.0 @category schemas */
export declare const RegimeEntry: Schema.Struct<{
    readonly code: Schema.String;
    readonly kind: Schema.Literals<readonly ["withholding", "social-security"]>;
    readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly label: Schema.NonEmptyString;
    readonly citations: Schema.$Array<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type RegimeEntry = typeof RegimeEntry.Type;
/**
 * A versioned regime code pack.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RegimeCodePack: Schema.Struct<{
    readonly edition: Schema.NonEmptyString;
    readonly status: Schema.Literals<readonly ["needs-verification", "adopter-verified"]>;
    readonly entries: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly kind: Schema.Literals<readonly ["withholding", "social-security"]>;
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly label: Schema.NonEmptyString;
        readonly citations: Schema.$Array<Schema.NonEmptyString>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type RegimeCodePack = typeof RegimeCodePack.Type;
/**
 * Bundled sample pack (US, India, Pakistan). `needs-verification`: India renumbered its
 * Income-tax Act provisions from tax year 2026-27, and every citation needs review.
 *
 * @since 0.1.0
 * @category data
 */
export declare const samplePack: () => RegimeCodePack;
/**
 * Look up a code in a pack.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const lookup: (pack: RegimeCodePack, code: string) => RegimeEntry | undefined;
//# sourceMappingURL=RegimePack.d.ts.map