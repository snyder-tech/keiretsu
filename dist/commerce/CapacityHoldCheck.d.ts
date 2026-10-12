/**
 * Capacity holds against their agreement: a hold (work package) is valid only
 * under a `hold-right` term of an agreement that is executed on the booking
 * date, between the right's holder and provider, inside its role scope,
 * minimum lead time, expiry and outstanding-minutes ceiling. The claimed
 * lead-time class must be the agreement's class for the hold's lead time.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `capacity-hold.agreement-unresolved` | warning | the cited agreement is in the set |
 * | `capacity-hold.agreement-not-executed` | error | the agreement is executed and in force on the booking date |
 * | `capacity-hold.right-unknown` | error | the agreement has a hold right with the cited key |
 * | `capacity-hold.right-parties` | error | holder and provider are the right's holder and provider |
 * | `capacity-hold.role-out-of-scope` | error | a role-scoped right covers the hold's role |
 * | `capacity-hold.lead-time-short` | error | lead days ≥ the right's minimum |
 * | `capacity-hold.expiry-exceeds-right` | error | expiry falls on or before booking + the right's business days |
 * | `capacity-hold.exceeds-right-minutes` | error | peak minutes held at once (overlapping windows) under one right ≤ its ceiling |
 * | `capacity-hold.agent-over-threshold` | error | an agent- or system-placed hold is below the right's `agentHoldBelowMinutes` |
 * | `capacity-hold.lead-time-class-unknown` | error | the agreement has a class for the hold's lead time |
 * | `capacity-hold.lead-time-class-mismatch` | error | the claimed class is that class |
 * | `capacity-hold.late-release` | warning | a released hold was released by the right's notice deadline |
 *
 * @since 0.1.0
 * @module
 */
import { type ValidationIssue } from '../core/Issue.ts';
import { type CapacityHold } from '../work/CapacityHold.ts';
import { type Agreement } from './Agreement.ts';
import { type BusinessDay, type HoldRight } from './CapacityTerms.ts';
/**
 * Options for {@link validateCapacityHolds}.
 *
 * @since 0.1.0
 * @category models
 */
export interface CapacityHoldCheckOptions {
    /**
     * The business-day calendar for a right's expiry and release deadlines: the
     * calendar the right names (`calendarRef`), else the provider's work
     * calendar. Default Monday–Friday.
     */
    readonly calendarFor?: (right: HoldRight) => BusinessDay;
}
/**
 * Check the latest revision of each hold against its agreement's hold right and lead-time classes.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateCapacityHolds: (holds: ReadonlyArray<CapacityHold>, agreements: ReadonlyArray<Agreement>, options?: CapacityHoldCheckOptions) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=CapacityHoldCheck.d.ts.map