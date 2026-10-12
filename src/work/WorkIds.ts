/**
 * Identities of records owned by the work package. Cross-package identities
 * (events, work orders, journal entries, people, entities) come from core `Ids`.
 *
 * @since 0.1.0
 * @module
 */
import { brand } from '../core/Id.ts';

/** Agent- or system-drafted time proposal (owner-only). @since 0.1.0 @category schemas */
export const TimeProposalId = brand('keiretsu/TimeProposalId');
/** @since 0.1.0 @category models */
export type TimeProposalId = typeof TimeProposalId.Type;

/** Standing authority granted by a human. @since 0.1.0 @category schemas */
export const StandingAuthorityId = brand('keiretsu/StandingAuthorityId');
/** @since 0.1.0 @category models */
export type StandingAuthorityId = typeof StandingAuthorityId.Type;

/** Deliverable acceptance. @since 0.1.0 @category schemas */
export { AcceptanceId } from '../core/Ids.ts';
/** @since 0.1.0 @category models */

/** Bilateral project link. @since 0.1.0 @category schemas */
export const ProjectLinkId = brand('keiretsu/ProjectLinkId');
/** @since 0.1.0 @category models */
export type ProjectLinkId = typeof ProjectLinkId.Type;

/** Capacity offer. @since 0.1.0 @category schemas */
export const CapacityOfferId = brand('keiretsu/CapacityOfferId');
/** @since 0.1.0 @category models */
export type CapacityOfferId = typeof CapacityOfferId.Type;

/** Capacity request. @since 0.1.0 @category schemas */
export const CapacityRequestId = brand('keiretsu/CapacityRequestId');
/** @since 0.1.0 @category models */
export type CapacityRequestId = typeof CapacityRequestId.Type;

/** Capacity commitment. @since 0.1.0 @category schemas */
export const CapacityCommitmentId = brand('keiretsu/CapacityCommitmentId');
/** @since 0.1.0 @category models */
export type CapacityCommitmentId = typeof CapacityCommitmentId.Type;

/** Capacity hold (a time-boxed reservation of another company's capacity). @since 0.1.0 @category schemas */
export const CapacityHoldId = brand('keiretsu/CapacityHoldId');
/** @since 0.1.0 @category models */
export type CapacityHoldId = typeof CapacityHoldId.Type;

/** Non-binding capacity forecast. @since 0.1.0 @category schemas */
export const CapacityForecastId = brand('keiretsu/CapacityForecastId');
/** @since 0.1.0 @category models */
export type CapacityForecastId = typeof CapacityForecastId.Type;

/** Firm schedule (revised daily). @since 0.1.0 @category schemas */
export const FirmScheduleId = brand('keiretsu/FirmScheduleId');
/** @since 0.1.0 @category models */
export type FirmScheduleId = typeof FirmScheduleId.Type;
