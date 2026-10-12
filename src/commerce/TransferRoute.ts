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

import { Sha256 } from '../core/CanonicalJson.ts';
import { CurrencyCode } from '../core/Currency.ts';
import { EvidenceRef, revisionChain, RevisionFields, validInterval } from '../core/Envelope.ts';
import { Uuid7 } from '../core/Id.ts';
import { AgreementId, LegId, RouteId } from '../core/Ids.ts';
import { RoundingMode } from '../core/Rounding.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';

import { BillingMode, billingModeRules } from './BillingMode.ts';
import { DividendAllocation } from './DividendAllocation.ts';
import { RateClauseRef } from './FxPort.ts';
import { rule, toCheck } from './Invariant.ts';
import { PartyRef, partyKey, sameParty } from './Party.ts';
import { WorkObjectRef } from './WorkObjectRef.ts';

/**
 * Related-party status of a leg's parties for transfer pricing. `undetermined`
 * records work but holds every charge on the leg from invoicing.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelatedPartyStatus = Schema.Literals(['associated', 'unrelated', 'undetermined']);
/** @since 0.1.0 @category models */
export type RelatedPartyStatus = typeof RelatedPartyStatus.Type;

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
/** @since 0.1.0 @category models */
export type RelatedParty = typeof RelatedParty.Type;

interface LegShape {
  readonly provider: PartyRef;
  readonly recipient: PartyRef;
  readonly relatedParty: RelatedParty;
  readonly billingMode: BillingMode;
  readonly providerWorkObject: WorkObjectRef;
  readonly recipientWorkObject: WorkObjectRef;
  readonly dividendAllocation?: DividendAllocation | undefined;
}

/**
 * Leg invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const legRules = {
  crossesBoundary: rule<LegShape>('leg.same-party', (leg) => (sameParty(leg.provider, leg.recipient) ? 'a leg crosses a legal-entity boundary' : undefined)),
  providerOwnsWorkObject: rule<LegShape>('leg.provider-work-object-owner', (leg) =>
    sameParty(leg.providerWorkObject.owner, leg.provider) ? undefined : 'providerWorkObject is owned by the provider',
  ),
  recipientOwnsWorkObject: rule<LegShape>('leg.recipient-work-object-owner', (leg) =>
    sameParty(leg.recipientWorkObject.owner, leg.recipient) ? undefined : 'recipientWorkObject is owned by the recipient',
  ),
  dividendRequired: rule<LegShape>('leg.dividend-required', (leg) =>
    leg.billingMode._tag === 'value-based' && leg.dividendAllocation === undefined ? 'a value-based leg declares its dividend allocation' : undefined,
  ),
  dividendMisplaced: rule<LegShape>('leg.dividend-misplaced', (leg) =>
    leg.billingMode._tag !== 'value-based' && leg.dividendAllocation !== undefined ? 'dividend allocation applies only to value-based legs' : undefined,
  ),
  determinationCited: rule<LegShape>('leg.determination-missing', (leg) =>
    leg.relatedParty.status !== 'undetermined' && leg.relatedParty.determination === undefined ? 'a determined related-party status cites its determination' : undefined,
  ),
  capCurrency: rule<LegShape>(billingModeRules.capCurrency.code, (leg) => billingModeRules.capCurrency.test(leg.billingMode)),
  nonNegativeTerms: rule<LegShape>(billingModeRules.nonNegative.code, (leg) => billingModeRules.nonNegative.test(leg.billingMode)),
} as const;

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
}).check(
  toCheck(legRules.crossesBoundary),
  toCheck(legRules.providerOwnsWorkObject),
  toCheck(legRules.recipientOwnsWorkObject),
  toCheck(legRules.dividendRequired),
  toCheck(legRules.dividendMisplaced),
  toCheck(legRules.determinationCited),
  toCheck(legRules.capCurrency),
  toCheck(legRules.nonNegativeTerms),
);
/** @since 0.1.0 @category models */
export type TransferLeg = typeof TransferLeg.Type;

interface LegEnds {
  readonly id?: string | undefined;
  readonly seq: number;
  readonly provider: PartyRef;
  readonly recipient: PartyRef;
}

const chainProblem = (legs: ReadonlyArray<LegEnds>): string | undefined => {
  const first = legs[0];
  const visited = new Set<string>(first === undefined ? [] : [partyKey(first.provider)]);
  for (const [index, leg] of legs.entries()) {
    if (leg.seq !== index + 1) return `leg at position ${index + 1} has seq ${leg.seq}; legs are numbered 1..n in order`;
    const next = legs[index + 1];
    if (next !== undefined && !sameParty(next.provider, leg.recipient)) return `leg ${next.seq} starts where leg ${leg.seq} ends`;
    if (visited.has(partyKey(leg.recipient))) return `${partyKey(leg.recipient)} appears twice; routes are acyclic`;
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
  chained: rule<{ readonly legs: ReadonlyArray<LegEnds> }>('route.legs-not-chained', (route) => chainProblem(route.legs)),
  uniqueLegIds: rule<{ readonly legs: ReadonlyArray<LegEnds> }>('route.duplicate-leg-id', (route) =>
    new Set(route.legs.map((leg) => leg.id)).size === route.legs.length ? undefined : 'leg ids are unique within a route',
  ),
  dividendOwnerOnRoute: rule<{ readonly legs: ReadonlyArray<TransferLeg> }>('route.dividend-owner-off-route', (route) => {
    const parties = new Set(route.legs.flatMap((leg) => [partyKey(leg.provider), partyKey(leg.recipient)]));
    const stray = route.legs.find((leg) => leg.dividendAllocation !== undefined && !parties.has(partyKey(leg.dividendAllocation.capabilityOwner)));
    return stray === undefined ? undefined : `leg ${stray.seq} names a capability owner that is not on the route`;
  }),
} as const;

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
/** @since 0.1.0 @category models */
export type TransferRoute = typeof TransferRoute.Type;

/**
 * The party where work on the route is performed (first provider).
 *
 * @since 0.1.0
 * @category accessors
 */
export const routeOrigin = (route: TransferRoute): PartyRef => route.legs[0].provider;

/**
 * Find a leg by id.
 *
 * @since 0.1.0
 * @category accessors
 */
export const findLeg = (route: TransferRoute, legId: string): TransferLeg | undefined => route.legs.find((leg) => leg.id === legId);
