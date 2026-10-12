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

import { CurrencyCode } from '../core/Currency.ts';
import { Decimal } from '../core/Decimal.ts';
import { revisionChain, RevisionFields, validInterval } from '../core/Envelope.ts';
import { AgreementId, CounterpartyId, EntityId, OfferingId } from '../core/Ids.ts';
import { contains, Instant, IsoDate, overlaps } from '../core/Temporal.ts';

import { isNegativeDecimal, OpenCode, UnitCode } from './Code.ts';
import { PriceBookId } from './CommerceIds.ts';
import { rule, toCheck } from './Invariant.ts';

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
/** @since 0.1.0 @category models */
export type PriceAudience = typeof PriceAudience.Type;

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
/** @since 0.1.0 @category models */
export type PriceEntry = typeof PriceEntry.Type;

/**
 * Price book invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const priceBookRules = {
  noOverlap: rule<{ readonly entries: ReadonlyArray<PriceEntry> }>('price-book.entry-overlap', (book) => {
    const clash = book.entries.find((entry, index) =>
      book.entries.some((other, otherIndex) => otherIndex > index && other.offeringId === entry.offeringId && other.unit === entry.unit && overlaps(entry, other)),
    );
    return clash === undefined ? undefined : `entries for ${clash.offeringId}/${clash.unit} overlap in time`;
  }),
  nonNegative: rule<{ readonly entries: ReadonlyArray<PriceEntry> }>('price-book.negative-price', (book) =>
    book.entries.some((entry) => isNegativeDecimal(entry.unitPrice)) ? 'prices are non-negative' : undefined,
  ),
} as const;

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
/** @since 0.1.0 @category models */
export type PriceBook = typeof PriceBook.Type;

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

const audienceOrder = (request: PriceRequest): ReadonlyArray<(audience: PriceAudience) => boolean> =>
  request.intercompanyAgreementId !== undefined
    ? [(audience) => audience._tag === 'intercompany' && audience.agreementId === request.intercompanyAgreementId]
    : [
        (audience) => audience._tag === 'account' && audience.counterpartyId === request.account,
        (audience) => audience._tag === 'partner-tier' && audience.tier === request.tier,
        (audience) => audience._tag === 'list',
      ];

const latestBooks = (books: ReadonlyArray<PriceBook>): ReadonlyArray<PriceBook> => {
  const latest = new Map<string, PriceBook>();
  for (const book of books) {
    const current = latest.get(book.id);
    if (current === undefined || book.revision > current.revision) latest.set(book.id, book);
  }
  return [...latest.values()];
};

const hold = (reasonCode: string, message: string): PriceResolution => ({ _tag: 'hold', reasonCode, message });

/**
 * Resolve a price. Holds: `price.not-found`, `price.ambiguous`.
 *
 * @since 0.1.0
 * @category lookups
 */
export const lookupPrice = (books: ReadonlyArray<PriceBook>, request: PriceRequest): PriceResolution => {
  const candidates = latestBooks(books).filter((book) => book.status === 'active' && book.owner === request.seller && book.currency === request.currency && contains(book, request.date));
  for (const matches of audienceOrder(request)) {
    const hits = candidates.flatMap((book) =>
      matches(book.audience) ? book.entries.filter((entry) => entry.offeringId === request.offeringId && entry.unit === request.unit && contains(entry, request.date)).map((entry) => ({ book, entry })) : [],
    );
    if (hits.length > 1) return hold('price.ambiguous', `${hits.length} active ${hits[0]?.book.audience._tag ?? ''} prices apply on ${request.date}`);
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
