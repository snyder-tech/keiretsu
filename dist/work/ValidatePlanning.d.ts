/**
 * Cross-record invariants for capacity holds and firm schedules, over every
 * revision supplied (not only the latest). `validateWork` runs them; they are
 * exported for callers that validate planning records alone. Checks against
 * the agreement's `hold-right` live in `@snyder-tech/keiretsu/commerce/CapacityHoldCheck`.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `work.capacity-hold.revision-sequence` | error | a hold's revisions are 1..n, one record each |
 * | `work.capacity-hold.illegal-transition` | error | each revision moves `held → converted / released / lapsed` |
 * | `work.capacity-hold.terms-changed` | error | parties, subject, window, minutes, booking, class, right, link and expiry never change |
 * | `work.capacity-hold.converted-order-unknown` | warning | the work order a hold converted into is in the set |
 * | `work.capacity-hold.conversion-mismatch` | error | that order is performed by the provider for the holder |
 * | `work.schedule.revision-sequence` | error | a schedule's revisions are 1..n, one record each |
 * | `work.schedule.not-daily` | error | each revision is for a later civil day than the one before |
 * | `work.schedule.parties-changed` | error | provider and audience never change |
 * | `work.schedule.assignment-mutated` | error | an assignment id keeps its content; moving work is a reassignment |
 * | `work.schedule.undeclared-change` | error | every assignment added or removed inside both horizons is declared |
 * | `work.schedule.unknown-change` | error | every declared change matches an actual addition or removal |
 *
 * @since 0.1.0
 * @module
 */
import { type ValidationIssue } from '../core/Issue.ts';
import { type CapacityHold } from './CapacityHold.ts';
import { type FirmSchedule } from './FirmSchedule.ts';
import type { WorkOrder } from './WorkOrder.ts';
/**
 * Planning records to validate together.
 *
 * @since 0.1.0
 * @category models
 */
export interface PlanningSet {
    readonly holds?: ReadonlyArray<CapacityHold>;
    readonly schedules?: ReadonlyArray<FirmSchedule>;
    readonly workOrders?: ReadonlyArray<WorkOrder>;
}
/**
 * Validate capacity holds and firm schedules (every revision).
 *
 * @since 0.1.0
 * @category validation
 */
export declare const planningIssues: (set: PlanningSet) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=ValidatePlanning.d.ts.map