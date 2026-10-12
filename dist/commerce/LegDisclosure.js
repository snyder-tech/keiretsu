/**
 * Leg disclosure: what a cross-company bundle may say about transfer legs.
 *
 * Invariant: no bundle addressed to a party carries the commercial terms of a
 * leg that party is not on — another leg's cost base, markup, rate card, price
 * or the downstream resale price. An audience sees its own legs in full and
 * every other leg only as "who handed work to whom" (a `RouteView` redacted
 * leg). The exchange package is domain-free, so the issuer runs this check on
 * the commerce records it is about to bundle; a receiver can run it too.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `leg-disclosure.full-route` | error | a full route goes only to a party on every leg; others receive a route view |
 * | `leg-disclosure.view-audience` | error | a route view is built for the bundle's audience |
 * | `leg-disclosure.foreign-leg` | error | a view carries complete legs only where the audience is a party |
 * | `leg-disclosure.foreign-charge` | error | a charge line goes only to its provider or recipient |
 *
 * @since 0.1.0
 * @module
 */
import { issue } from "../core/Issue.js";
import { sameParty } from "./Party.js";
const onLeg = (audience, leg) => sameParty(leg.provider, audience) || sameParty(leg.recipient, audience);
const routeIssues = (audience, route) => route.legs.every((leg) => onLeg(audience, leg)) ? [] : [issue('leg-disclosure.full-route', 'error', route.id, 'the audience is not on every leg; send a route view')];
const viewIssues = (audience, view) => [
    ...(sameParty(view.audience, audience) ? [] : [issue('leg-disclosure.view-audience', 'error', view.routeId, 'the route view was built for another audience')]),
    ...view.legs
        .filter((leg) => !('redacted' in leg) && !onLeg(audience, leg))
        .map((leg) => issue('leg-disclosure.foreign-leg', 'error', `${view.routeId}#${leg.seq}`, 'a complete leg is disclosed to a party that is not on it')),
];
const chargeIssues = (audience, line) => onLeg(audience, line) ? [] : [issue('leg-disclosure.foreign-charge', 'error', line.id, 'a charge line is disclosed to a party that is neither its provider nor its recipient')];
/**
 * Check that a payload exposes no leg terms to an audience that is not on the leg.
 *
 * @since 0.1.0
 * @category validators
 */
export const checkLegDisclosure = (payload) => [
    ...(payload.routes ?? []).flatMap((route) => routeIssues(payload.audience, route)),
    ...(payload.routeViews ?? []).flatMap((view) => viewIssues(payload.audience, view)),
    ...(payload.chargeLines ?? []).flatMap((line) => chargeIssues(payload.audience, line)),
];
//# sourceMappingURL=LegDisclosure.js.map