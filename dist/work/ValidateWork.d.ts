import { type ValidationReport } from '../core/Issue.ts';
import type { Acceptance } from './Acceptance.ts';
import type { ApprovalChain } from './ApprovalChain.ts';
import type { CapacityCommitment } from './CapacityCommitment.ts';
import type { CapacityHold } from './CapacityHold.ts';
import type { CapacityOffer } from './CapacityOffer.ts';
import type { CapacityRequest } from './CapacityRequest.ts';
import { type EconomicEvent } from './EconomicEvent.ts';
import { type EmploymentFact } from './Employment.ts';
import type { FirmSchedule } from './FirmSchedule.ts';
import { type JournalEntry } from './JournalEntry.ts';
import type { ProjectLink } from './ProjectLink.ts';
import { type StandingAuthority } from './StandingAuthority.ts';
import type { TimeProposal } from './TimeProposal.ts';
import { type WorkOrder } from './WorkOrder.ts';
/**
 * Records to validate together. Omitted collections are empty. `employments`
 * is the port supplied by `keiretsu-entity`; without it, employer checks are skipped
 * (unknown, not a mismatch).
 *
 * @since 0.1.0
 * @category models
 */
export interface WorkSet {
    readonly events?: ReadonlyArray<EconomicEvent>;
    readonly journals?: ReadonlyArray<JournalEntry>;
    readonly proposals?: ReadonlyArray<TimeProposal>;
    readonly workOrders?: ReadonlyArray<WorkOrder>;
    readonly chains?: ReadonlyArray<ApprovalChain>;
    readonly authorities?: ReadonlyArray<StandingAuthority>;
    readonly acceptances?: ReadonlyArray<Acceptance>;
    readonly projectLinks?: ReadonlyArray<ProjectLink>;
    readonly offers?: ReadonlyArray<CapacityOffer>;
    readonly requests?: ReadonlyArray<CapacityRequest>;
    readonly commitments?: ReadonlyArray<CapacityCommitment>;
    /** Every revision of each capacity hold. */
    readonly holds?: ReadonlyArray<CapacityHold>;
    /** Every daily revision of each firm schedule. */
    readonly schedules?: ReadonlyArray<FirmSchedule>;
    readonly employments?: ReadonlyArray<EmploymentFact>;
}
/**
 * Validate a set of work records together.
 *
 * @since 0.1.0
 * @category validation
 */
export declare const validateWork: (set: WorkSet) => ValidationReport;
//# sourceMappingURL=ValidateWork.d.ts.map