/**
 * Record identities owned by the commerce package. Cross-package identities
 * (agreements, routes, legs, charges, documents, offerings) come from
 * `@snyder-tech/keiretsu/core/Ids`; the brands here are defined once and only here.
 *
 * @since 0.1.0
 * @module
 */
import { brand } from '../core/Id.ts';

/** Rate card. @since 0.1.0 @category schemas */
export const RateCardId = brand('keiretsu/RateCardId');
/** @since 0.1.0 @category models */
export type RateCardId = typeof RateCardId.Type;

/** Price book. @since 0.1.0 @category schemas */
export const PriceBookId = brand('keiretsu/PriceBookId');
/** @since 0.1.0 @category models */
export type PriceBookId = typeof PriceBookId.Type;

/** Binding of a work object to a transfer route. @since 0.1.0 @category schemas */
export const RouteBindingId = brand('keiretsu/RouteBindingId');
/** @since 0.1.0 @category models */
export type RouteBindingId = typeof RouteBindingId.Type;

/** Transfer allocation (minutes of one event moved along one route). @since 0.1.0 @category schemas */
export const AllocationId = brand('keiretsu/AllocationId');
/** @since 0.1.0 @category models */
export type AllocationId = typeof AllocationId.Type;

/** Management-approved billing policy. @since 0.1.0 @category schemas */
export const BillingPolicyId = brand('keiretsu/BillingPolicyId');
/** @since 0.1.0 @category models */
export type BillingPolicyId = typeof BillingPolicyId.Type;
