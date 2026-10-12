/**
 * Transfer routes: how work moves from the performing entity to the last
 * recipient, one legal hop (leg) at a time.
 *
 * Each leg names its agreement, the work object on each side, the
 * related-party status of its parties (derived by the finance package and
 * carried here with a determination reference), its billing mode, invoice
 * currency and rounding mode. Routes are acyclic chains: leg n+1 starts where
 * leg n ends and no party appears twice.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Sha256 } from "../core/CanonicalJson.js";
import { CurrencyCode } from "../core/Currency.js";
import { EvidenceRef, revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { Uuid7 } from "../core/Id.js";
import { AgreementId, LegId, RouteId } from "../core/Ids.js";
import { RoundingMode } from "../core/Rounding.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { BillingMode, billingModeRules } from "./BillingMode.js";
import { DividendAllocation } from "./DividendAllocation.js";
import { RateClauseRef } from "./FxPort.js";
import { rule, toCheck } from "./Invariant.js";
import { PartyRef, partyKey, sameParty } from "./Party.js";
import { WorkObjectRef } from "./WorkObjectRef.js";
/**
 * Related-party status of a leg's parties for transfer pricing. `undetermined`
 * records work but holds every charge on the leg from invoicing.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelatedPartyStatus = Schema.Literals(['associated', 'unrelated', 'undetermined']);
/**
 * The status as carried on a leg, citing the finance package's `RelatedPartyDetermination`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelatedParty = Schema.Struct({
    status: RelatedPartyStatus,
    determination: Schema.optional(Schema.Struct({ id: Uuid7, digest: Sha256 })),
});
/**
 * Leg invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const legRules = {
    crossesBoundary: rule('leg.same-party', (leg) => (sameParty(leg.provider, leg.recipient) ? 'a leg crosses a legal-entity boundary' : undefined)),
    providerOwnsWorkObject: rule('leg.provider-work-object-owner', (leg) => sameParty(leg.providerWorkObject.owner, leg.provider) ? undefined : 'providerWorkObject is owned by the provider'),
    recipientOwnsWorkObject: rule('leg.recipient-work-object-owner', (leg) => sameParty(leg.recipientWorkObject.owner, leg.recipient) ? undefined : 'recipientWorkObject is owned by the recipient'),
    dividendRequired: rule('leg.dividend-required', (leg) => leg.billingMode._tag === 'value-based' && leg.dividendAllocation === undefined ? 'a value-based leg declares its dividend allocation' : undefined),
    dividendMisplaced: rule('leg.dividend-misplaced', (leg) => leg.billingMode._tag !== 'value-based' && leg.dividendAllocation !== undefined ? 'dividend allocation applies only to value-based legs' : undefined),
    determinationCited: rule('leg.determination-missing', (leg) => leg.relatedParty.status !== 'undetermined' && leg.relatedParty.determination === undefined ? 'a determined related-party status cites its determination' : undefined),
    capCurrency: rule(billingModeRules.capCurrency.code, (leg) => billingModeRules.capCurrency.test(leg.billingMode)),
    nonNegativeTerms: rule(billingModeRules.nonNegative.code, (leg) => billingModeRules.nonNegative.test(leg.billingMode)),
};
/**
 * One hop of a route.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TransferLeg = Schema.Struct({
    id: LegId,
    /** 1-based position on the route. */
    seq: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    provider: PartyRef,
    recipient: PartyRef,
    agreementId: AgreementId,
    relatedParty: RelatedParty,
    /** Transfer-pricing documentation (schedule, benchmark, study) supporting an associated leg. */
    tpDocumentation: Schema.optional(EvidenceRef),
    billingMode: BillingMode,
    invoiceCurrency: CurrencyCode,
    /** Overrides the agreement's rate clause for this leg. */
    rateClause: Schema.optional(RateClauseRef),
    rounding: RoundingMode,
    providerWorkObject: WorkObjectRef,
    recipientWorkObject: WorkObjectRef,
    dividendAllocation: Schema.optional(DividendAllocation),
}).check(toCheck(legRules.crossesBoundary), toCheck(legRules.providerOwnsWorkObject), toCheck(legRules.recipientOwnsWorkObject), toCheck(legRules.dividendRequired), toCheck(legRules.dividendMisplaced), toCheck(legRules.determinationCited), toCheck(legRules.capCurrency), toCheck(legRules.nonNegativeTerms));
const chainProblem = (legs) => {
    const first = legs[0];
    const visited = new Set(first === undefined ? [] : [partyKey(first.provider)]);
    for (const [index, leg] of legs.entries()) {
        if (leg.seq !== index + 1)
            return `leg at position ${index + 1} has seq ${leg.seq}; legs are numbered 1..n in order`;
        const next = legs[index + 1];
        if (next !== undefined && !sameParty(next.provider, leg.recipient))
            return `leg ${next.seq} starts where leg ${leg.seq} ends`;
        if (visited.has(partyKey(leg.recipient)))
            return `${partyKey(leg.recipient)} appears twice; routes are acyclic`;
        visited.add(partyKey(leg.recipient));
    }
    return undefined;
};
/**
 * Route invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const routeRules = {
    chained: rule('route.legs-not-chained', (route) => chainProblem(route.legs)),
    uniqueLegIds: rule('route.duplicate-leg-id', (route) => new Set(route.legs.map((leg) => leg.id)).size === route.legs.length ? undefined : 'leg ids are unique within a route'),
    dividendOwnerOnRoute: rule('route.dividend-owner-off-route', (route) => {
        const parties = new Set(route.legs.flatMap((leg) => [partyKey(leg.provider), partyKey(leg.recipient)]));
        const stray = route.legs.find((leg) => leg.dividendAllocation !== undefined && !parties.has(partyKey(leg.dividendAllocation.capabilityOwner)));
        return stray === undefined ? undefined : `leg ${stray.seq} names a capability owner that is not on the route`;
    }),
};
/**
 * Ordered legs from the performing party to the last recipient. Same-entity
 * work has no route.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TransferRoute = Schema.Struct({
    id: RouteId,
    ...RevisionFields,
    label: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
    legs: Schema.NonEmptyArray(TransferLeg),
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    recordedAt: Instant,
}).check(revisionChain, validInterval, toCheck(routeRules.chained), toCheck(routeRules.uniqueLegIds), toCheck(routeRules.dividendOwnerOnRoute));
/**
 * The party where work on the route is performed (first provider).
 *
 * @since 0.1.0
 * @category accessors
 */
export const routeOrigin = (route) => route.legs[0].provider;
/**
 * Find a leg by id.
 *
 * @since 0.1.0
 * @category accessors
 */
export const findLeg = (route, legId) => route.legs.find((leg) => leg.id === legId);
//# sourceMappingURL=TransferRoute.js.map