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
import { CurrencyCode } from "../core/Currency.js";
import { Decimal } from "../core/Decimal.js";
import { revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { AgreementId, CounterpartyId, EntityId, OfferingId } from "../core/Ids.js";
import { contains, Instant, IsoDate, overlaps } from "../core/Temporal.js";
import { isNegativeDecimal, OpenCode, UnitCode } from "./Code.js";
import { PriceBookId } from "./CommerceIds.js";
import { rule, toCheck } from "./Invariant.js";
/**
 * Who a price book is for.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PriceAudience = Schema.TaggedUnion({
    list: {},
    'partner-tier': { tier: OpenCode },
    account: { counterpartyId: CounterpartyId },
    intercompany: { agreementId: AgreementId },
});
/**
 * One effective-dated price. `provisional` marks prices resting on an estimated baseline.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PriceEntry = Schema.Struct({
    offeringId: OfferingId,
    unit: UnitCode,
    unitPrice: Decimal,
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    provisional: Schema.optional(Schema.Boolean),
}).check(validInterval);
/**
 * Price book invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const priceBookRules = {
    noOverlap: rule('price-book.entry-overlap', (book) => {
        const clash = book.entries.find((entry, index) => book.entries.some((other, otherIndex) => otherIndex > index && other.offeringId === entry.offeringId && other.unit === entry.unit && overlaps(entry, other)));
        return clash === undefined ? undefined : `entries for ${clash.offeringId}/${clash.unit} overlap in time`;
    }),
    nonNegative: rule('price-book.negative-price', (book) => book.entries.some((entry) => isNegativeDecimal(entry.unitPrice)) ? 'prices are non-negative' : undefined),
};
/**
 * A price book.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PriceBook = Schema.Struct({
    id: PriceBookId,
    ...RevisionFields,
    owner: EntityId,
    currency: CurrencyCode,
    audience: PriceAudience,
    status: Schema.Literals(['draft', 'active', 'retired']),
    entries: Schema.Array(PriceEntry),
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    recordedAt: Instant,
}).check(revisionChain, validInterval, toCheck(priceBookRules.noOverlap), toCheck(priceBookRules.nonNegative));
/**
 * A resolved price or an explicit hold.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PriceResolution = Schema.TaggedUnion({
    priced: {
        priceBookId: PriceBookId,
        priceBookRevision: Schema.Number,
        audience: Schema.Literals(['list', 'partner-tier', 'account', 'intercompany']),
        unitPrice: Decimal,
        currency: CurrencyCode,
        provisional: Schema.Boolean,
    },
    hold: { reasonCode: Schema.NonEmptyString, message: Schema.NonEmptyString },
});
const audienceOrder = (request) => request.intercompanyAgreementId !== undefined
    ? [(audience) => audience._tag === 'intercompany' && audience.agreementId === request.intercompanyAgreementId]
    : [
        (audience) => audience._tag === 'account' && audience.counterpartyId === request.account,
        (audience) => audience._tag === 'partner-tier' && audience.tier === request.tier,
        (audience) => audience._tag === 'list',
    ];
const latestBooks = (books) => {
    const latest = new Map();
    for (const book of books) {
        const current = latest.get(book.id);
        if (current === undefined || book.revision > current.revision)
            latest.set(book.id, book);
    }
    return [...latest.values()];
};
const hold = (reasonCode, message) => ({ _tag: 'hold', reasonCode, message });
/**
 * Resolve a price. Holds: `price.not-found`, `price.ambiguous`.
 *
 * @since 0.1.0
 * @category lookups
 */
export const lookupPrice = (books, request) => {
    const candidates = latestBooks(books).filter((book) => book.status === 'active' && book.owner === request.seller && book.currency === request.currency && contains(book, request.date));
    for (const matches of audienceOrder(request)) {
        const hits = candidates.flatMap((book) => matches(book.audience) ? book.entries.filter((entry) => entry.offeringId === request.offeringId && entry.unit === request.unit && contains(entry, request.date)).map((entry) => ({ book, entry })) : []);
        if (hits.length > 1)
            return hold('price.ambiguous', `${hits.length} active ${hits[0]?.book.audience._tag ?? ''} prices apply on ${request.date}`);
        const [hit] = hits;
        if (hit !== undefined)
            return {
                _tag: 'priced',
                priceBookId: hit.book.id,
                priceBookRevision: hit.book.revision,
                audience: hit.book.audience._tag,
                unitPrice: hit.entry.unitPrice,
                currency: hit.book.currency,
                provisional: hit.entry.provisional ?? false,
            };
    }
    return hold('price.not-found', `no active ${request.currency} price for ${request.offeringId}/${request.unit} on ${request.date}`);
};
//# sourceMappingURL=PriceBook.js.map