/**
 * Route views: a route as disclosed to one audience.
 *
 * Legs the audience is party to are complete. Every other leg is redacted to
 * who handed work to whom, without agreement, price, currency or work objects,
 * so an end customer can trace origin without seeing an intercompany price.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { RouteId } from '../core/Ids.ts';

import { rule, toCheck } from './Invariant.ts';
import { PartyRef, sameParty } from './Party.ts';
import { routeRules, TransferLeg, type TransferRoute } from './TransferRoute.ts';

/**
 * A leg the audience is not party to.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RedactedLeg = Schema.Struct({
  seq: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  provider: PartyRef,
  recipient: PartyRef,
  redacted: Schema.Literal(true),
});
/** @since 0.1.0 @category models */
export type RedactedLeg = typeof RedactedLeg.Type;

const isParty = (audience: PartyRef, leg: { readonly provider: PartyRef; readonly recipient: PartyRef }): boolean =>
  sameParty(leg.provider, audience) || sameParty(leg.recipient, audience);

/**
 * View invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const routeViewRules = {
  disclosure: rule<{ readonly audience: PartyRef; readonly legs: ReadonlyArray<TransferLeg | RedactedLeg> }>('route-view.undisclosable-leg', (view) =>
    view.legs.every((leg) => 'redacted' in leg || isParty(view.audience, leg)) ? undefined : 'complete legs are disclosed only to their parties',
  ),
} as const;

/**
 * A route as one audience sees it.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RouteView = Schema.Struct({
  routeId: RouteId,
  routeRevision: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  audience: PartyRef,
  label: Schema.NonEmptyString,
  legs: Schema.NonEmptyArray(Schema.Union([TransferLeg, RedactedLeg])),
}).check(toCheck(routeRules.chained), toCheck(routeViewRules.disclosure));
/** @since 0.1.0 @category models */
export type RouteView = typeof RouteView.Type;

/**
 * Redact a route for an audience.
 *
 * @since 0.1.0
 * @category constructors
 */
export const viewFor = (route: TransferRoute, audience: PartyRef): RouteView => {
  const disclose = (leg: TransferLeg): TransferLeg | RedactedLeg =>
    isParty(audience, leg) ? leg : { seq: leg.seq, provider: leg.provider, recipient: leg.recipient, redacted: true };
  return {
    routeId: route.id,
    routeRevision: route.revision,
    audience,
    label: route.label,
    legs: [disclose(route.legs[0]), ...route.legs.slice(1).map(disclose)],
  };
};
