/**
 * Base-period facts for regimes whose computation looks back at prior years.
 * A missing year is `unknown`, never zero; a year with no qualifying spend is
 * stated as `attested-none` with evidence.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * One prior year's base amount status.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BasePeriodFact: Schema.Struct<{
    readonly claimant: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly regimeId: Schema.brand<Schema.String, "keiretsu/RegimeId">;
    readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
    readonly status: Schema.Literals<readonly ["known", "unknown", "attested-none"]>;
    readonly amount: Schema.optional<Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type BasePeriodFact = typeof BasePeriodFact.Type;
//# sourceMappingURL=BasePeriodFact.d.ts.map