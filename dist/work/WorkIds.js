/**
 * Identities of records owned by the work package. Cross-package identities
 * (events, work orders, journal entries, people, entities) come from core `Ids`.
 *
 * @since 0.1.0
 * @module
 */
import { brand } from "../core/Id.js";
/** Agent- or system-drafted time proposal (owner-only). @since 0.1.0 @category schemas */
export const TimeProposalId = brand('keiretsu/TimeProposalId');
/** Standing authority granted by a human. @since 0.1.0 @category schemas */
export const StandingAuthorityId = brand('keiretsu/StandingAuthorityId');
/** Deliverable acceptance. @since 0.1.0 @category schemas */
export { AcceptanceId } from "../core/Ids.js";
/** @since 0.1.0 @category models */
/** Bilateral project link. @since 0.1.0 @category schemas */
export const ProjectLinkId = brand('keiretsu/ProjectLinkId');
/** Capacity offer. @since 0.1.0 @category schemas */
export const CapacityOfferId = brand('keiretsu/CapacityOfferId');
/** Capacity request. @since 0.1.0 @category schemas */
export const CapacityRequestId = brand('keiretsu/CapacityRequestId');
/** Capacity commitment. @since 0.1.0 @category schemas */
export const CapacityCommitmentId = brand('keiretsu/CapacityCommitmentId');
/** Capacity hold (a time-boxed reservation of another company's capacity). @since 0.1.0 @category schemas */
export const CapacityHoldId = brand('keiretsu/CapacityHoldId');
/** Non-binding capacity forecast. @since 0.1.0 @category schemas */
export const CapacityForecastId = brand('keiretsu/CapacityForecastId');
/** Firm schedule (revised daily). @since 0.1.0 @category schemas */
export const FirmScheduleId = brand('keiretsu/FirmScheduleId');
//# sourceMappingURL=WorkIds.js.map