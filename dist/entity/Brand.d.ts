import { Schema } from 'effect';
/**
 * A brand as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BrandInput: Schema.Struct<{
    readonly entity: Schema.NonEmptyString;
    readonly name: Schema.NonEmptyString;
    readonly kind: Schema.Literals<readonly ["dba", "trade-name", "product-brand"]>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type BrandInput = typeof BrandInput.Encoded;
/** @since 0.1.0 @category models */
export type Brand = typeof BrandInput.Type & {
    readonly key: string;
};
//# sourceMappingURL=Brand.d.ts.map