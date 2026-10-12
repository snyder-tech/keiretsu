/**
 * Price books and price lookup.
 *
 * A price book has exactly one currency (entries inherit it) and one audience:
 * list, a partner tier, one account, or an intercompany agreement. Entries for
 * the same (offering, unit) never overlap in time. Lookup resolves account →
 * partner tier → list (intercompany only when asked for its agreement) within
 * the requested currency and returns a price or an explicit hold — never a
 * fallback across currencies, markets or audiences it was not asked for.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Who a price book is for.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PriceAudience: Schema.TaggedUnion<{
    readonly list: Schema.TaggedStruct<"list", {}>;
    readonly "partner-tier": Schema.TaggedStruct<"partner-tier", {
        readonly tier: Schema.String;
    }>;
    readonly account: Schema.TaggedStruct<"account", {
        readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
    }>;
    readonly intercompany: Schema.TaggedStruct<"intercompany", {
        readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type PriceAudience = typeof PriceAudience.Type;
/**
 * One effective-dated price. `provisional` marks prices resting on an estimated baseline.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PriceEntry: Schema.Struct<{
    readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    readonly unit: Schema.String;
    readonly unitPrice: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly provisional: Schema.optional<Schema.Boolean>;
}>;
/** @since 0.1.0 @category models */
export type PriceEntry = typeof PriceEntry.Type;
/**
 * Price book invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const priceBookRules: {
    readonly noOverlap: import("./Invariant.ts").Rule<{
        readonly entries: ReadonlyArray<PriceEntry>;
    }>;
    readonly nonNegative: import("./Invariant.ts").Rule<{
        readonly entries: ReadonlyArray<PriceEntry>;
    }>;
};
/**
 * A price book.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PriceBook: Schema.Struct<{
    readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly audience: Schema.TaggedUnion<{
        readonly list: Schema.TaggedStruct<"list", {}>;
        readonly "partner-tier": Schema.TaggedStruct<"partner-tier", {
            readonly tier: Schema.String;
        }>;
        readonly account: Schema.TaggedStruct<"account", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
        readonly intercompany: Schema.TaggedStruct<"intercompany", {
            readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
        }>;
    }>;
    readonly status: Schema.Literals<readonly ["draft", "active", "retired"]>;
    readonly entries: Schema.$Array<Schema.Struct<{
        readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
        readonly unit: Schema.String;
        readonly unitPrice: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly provisional: Schema.optional<Schema.Boolean>;
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/PriceBookId">;
}>;
/** @since 0.1.0 @category models */
export type PriceBook = typeof PriceBook.Type;
/**
 * A resolved price or an explicit hold.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PriceResolution: Schema.TaggedUnion<{
    readonly hold: Schema.TaggedStruct<"hold", {
        readonly reasonCode: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
    }>;
    readonly priced: Schema.TaggedStruct<"priced", {
        readonly priceBookId: Schema.brand<Schema.String, "keiretsu/PriceBookId">;
        readonly priceBookRevision: Schema.Number;
        readonly audience: Schema.Literals<readonly ["list", "partner-tier", "account", "intercompany"]>;
        readonly unitPrice: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly provisional: Schema.Boolean;
    }>;
}>;
/** @since 0.1.0 @category models */
export type PriceResolution = typeof PriceResolution.Type;
/**
 * A price request.
 *
 * @since 0.1.0
 * @category models
 */
export interface PriceRequest {
    readonly seller: string;
    readonly offeringId: string;
    readonly unit: string;
    readonly currency: string;
    readonly date: string;
    readonly account?: string;
    readonly tier?: string;
    readonly intercompanyAgreementId?: string;
}
/**
 * Resolve a price. Holds: `price.not-found`, `price.ambiguous`.
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const lookupPrice: (books: ReadonlyArray<PriceBook>, request: PriceRequest) => PriceResolution;
//# sourceMappingURL=PriceBook.d.ts.map