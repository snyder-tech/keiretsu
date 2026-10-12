import { Schema } from 'effect';
/**
 * Legal relationship kinds. `eor-placed` means an employer of record is the legal employer.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RelationshipKind: Schema.Literals<readonly ["employee", "contractor", "secondee", "officer", "eor-placed"]>;
/** @since 0.1.0 @category models */
export type RelationshipKind = typeof RelationshipKind.Type;
/**
 * A human decider, structurally the core `HumanActor`: agents and systems cannot classify.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const HumanDecider: Schema.TaggedStruct<"human", {
    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly actingFor: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
}>;
/**
 * The legal relationship, its evidence and who determined it.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LegalRelationship: Schema.Struct<{
    readonly kind: Schema.Literals<readonly ["employee", "contractor", "secondee", "officer", "eor-placed"]>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly decidedBy: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/**
 * IANA time zone name.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TimeZone: Schema.String;
/**
 * Full-time equivalence in basis points (10,000 = full time).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FteBps: Schema.Number;
/**
 * An engagement as authored in config. Party fields name declared keys.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const EngagementInput: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/EngagementId">;
    readonly person: Schema.NonEmptyString;
    readonly employer: Schema.NonEmptyString;
    readonly contractingParty: Schema.NonEmptyString;
    readonly payingAgent: Schema.optional<Schema.NonEmptyString>;
    readonly reimbursementAgreementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AgreementId">>;
    readonly costBearer: Schema.NonEmptyString;
    readonly host: Schema.optional<Schema.NonEmptyString>;
    readonly relationship: Schema.Struct<{
        readonly kind: Schema.Literals<readonly ["employee", "contractor", "secondee", "officer", "eor-placed"]>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly decidedBy: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>;
    readonly payrollCountry: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly taxResidence: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly workLocation: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly timeZone: Schema.optional<Schema.String>;
    readonly withholdingRegime: Schema.String;
    readonly socialSecurityRegimes: Schema.$Array<Schema.String>;
    readonly fteBps: Schema.Number;
    readonly workCalendar: Schema.optional<Schema.NonEmptyString>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type EngagementInput = typeof EngagementInput.Encoded;
/** @since 0.1.0 @category models */
export type Engagement = typeof EngagementInput.Type;
//# sourceMappingURL=Engagement.d.ts.map