/**
 * Port: the tax facts this package needs about a legal entity. Supplied by
 * `@snyder-tech/keiretsu/entity` (entity timeline, fiscal calendar,
 * registrations); declared here narrowly so the packages stay decoupled.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * A registration or approval an entity holds (e.g. a software-export board
 * registration or an in-house R&D approval), with its validity and evidence.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Registration: Schema.Struct<{
    readonly kind: Schema.String;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type Registration = typeof Registration.Type;
/**
 * Entity tax profile port.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const EntityTaxProfile: Schema.Struct<{
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    /** Where the entity is resident for tax. */
    readonly situs: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly functionalCurrency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly fiscalYearEndMonth: Schema.Number;
    /** Income flows through to owners (partnership, S corporation, disregarded entity). */
    readonly passThrough: Schema.Boolean;
    readonly registrations: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.String;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type EntityTaxProfile = typeof EntityTaxProfile.Type;
//# sourceMappingURL=EntityTaxProfile.d.ts.map