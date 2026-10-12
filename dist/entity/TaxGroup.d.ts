import { Schema } from 'effect';
import { type OwnershipEdge } from './Ownership.ts';
/** @since 0.1.0 @category schemas */
export declare const TaxGroupKind: Schema.Literals<readonly ["us-1563-controlled", "us-41f-single-taxpayer", "oecd-associated", "consolidated-return", "gst-group"]>;
/** @since 0.1.0 @category models */
export type TaxGroupKind = typeof TaxGroupKind.Type;
/**
 * A tax group as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TaxGroupInput: Schema.Struct<{
    readonly kind: Schema.Literals<readonly ["us-1563-controlled", "us-41f-single-taxpayer", "oecd-associated", "consolidated-return", "gst-group"]>;
    readonly members: Schema.NonEmptyArray<Schema.NonEmptyString>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type TaxGroupInput = typeof TaxGroupInput.Encoded;
/** @since 0.1.0 @category models */
export type TaxGroup = typeof TaxGroupInput.Type & {
    readonly key: string;
};
/**
 * Ownership thresholds used by the screen: §1563(a)(1) "at least 80 percent", §41(f)(5)
 * "more than 50 percent". Kinds without a threshold are not screened.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const SCREEN_THRESHOLD_BPS: Readonly<Partial<Record<TaxGroupKind, number>>>;
/**
 * Whether some common owner (a member or an outside party) reaches every member through
 * chains of holdings at or above `thresholdBps` on `date`. Unverified edges are excluded.
 *
 * @since 0.1.0
 * @category screens
 */
export declare const ownershipSupports: (options: {
    readonly members: ReadonlyArray<string>;
    readonly edges: ReadonlyArray<OwnershipEdge>;
    readonly date: string;
    readonly thresholdBps: number;
}) => boolean;
//# sourceMappingURL=TaxGroup.d.ts.map