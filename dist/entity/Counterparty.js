/**
 * Counterparties: customers, vendors, partners and other parties outside the
 * declared group, with roles and an optional related-party basis.
 *
 * A related-party basis (ASC 850, IAS 24.9; OECD MTC Art. 9 associated
 * enterprises) is a declared fact with evidence; transfer-pricing packages
 * read it to decide which arm's-length checks apply. This package never
 * concludes that a party is or is not related.
 *
 * @since 0.1.0
 * @module
 */
import { Situs } from "../core/Country.js";
import { EvidenceRef } from "../core/Envelope.js";
import { CounterpartyId } from "../core/Ids.js";
import { IsoDate } from "../core/Temporal.js";
import { Schema } from 'effect';
import { Identifier } from "./Identifier.js";
const extension = Schema.String.check(Schema.isPattern(/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/));
/**
 * Counterparty roles; `x-` extensions are accepted.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CounterpartyRole = Schema.Union([
    Schema.Literals(['customer', 'vendor', 'partner', 'reseller', 'licensor', 'licensee', 'employer-of-record', 'paying-agent']),
    extension,
]);
/**
 * Why a counterparty is a related party; `x-` extensions are accepted.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelatedPartyBasis = Schema.Union([
    Schema.Literals(['common-control', 'significant-influence', 'key-management-personnel', 'close-family', 'associated-enterprise']),
    extension,
]);
/**
 * A counterparty as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CounterpartyInput = Schema.Struct({
    id: CounterpartyId,
    legalName: Schema.NonEmptyString,
    jurisdiction: Situs,
    identifiers: Schema.optional(Schema.Array(Identifier)),
    roles: Schema.NonEmptyArray(CounterpartyRole),
    relatedParty: Schema.optional(Schema.Struct({ basis: RelatedPartyBasis, validFrom: IsoDate, validTo: Schema.optional(IsoDate), evidence: Schema.Array(EvidenceRef) })),
});
//# sourceMappingURL=Counterparty.js.map