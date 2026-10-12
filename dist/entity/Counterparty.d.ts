import { Schema } from 'effect';
/**
 * Counterparty roles; `x-` extensions are accepted.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CounterpartyRole: Schema.Union<readonly [Schema.Literals<readonly ["customer", "vendor", "partner", "reseller", "licensor", "licensee", "employer-of-record", "paying-agent"]>, Schema.String]>;
/**
 * Why a counterparty is a related party; `x-` extensions are accepted.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RelatedPartyBasis: Schema.Union<readonly [Schema.Literals<readonly ["common-control", "significant-influence", "key-management-personnel", "close-family", "associated-enterprise"]>, Schema.String]>;
/**
 * A counterparty as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CounterpartyInput: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
    readonly legalName: Schema.NonEmptyString;
    readonly jurisdiction: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly identifiers: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly scheme: Schema.String;
        readonly value: Schema.NonEmptyString;
    }>>>;
    readonly roles: Schema.NonEmptyArray<Schema.Union<readonly [Schema.Literals<readonly ["customer", "vendor", "partner", "reseller", "licensor", "licensee", "employer-of-record", "paying-agent"]>, Schema.String]>>;
    readonly relatedParty: Schema.optional<Schema.Struct<{
        readonly basis: Schema.Union<readonly [Schema.Literals<readonly ["common-control", "significant-influence", "key-management-personnel", "close-family", "associated-enterprise"]>, Schema.String]>;
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
export type CounterpartyInput = typeof CounterpartyInput.Encoded;
/** @since 0.1.0 @category models */
export type Counterparty = typeof CounterpartyInput.Type & {
    readonly key: string;
};
//# sourceMappingURL=Counterparty.d.ts.map