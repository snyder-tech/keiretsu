/**
 * Invariants over people, engagements and work calendars.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `person.subject-duplicate` | error | (issuer, system, subject) is unique |
 * | `engagement.paying-agent-agreement` | error | a paying agent is present exactly when a reimbursement agreement is |
 * | `engagement.paying-agent-is-employer` | warning | the paying agent differs from the employer |
 * | `engagement.secondee-host` | error | a secondee has a host different from the employer |
 * | `engagement.overlap` | error | one active engagement per person, employer and date |
 * | `engagement.relationship-evidence-missing` | error | the legal relationship cites evidence |
 * | `engagement.eor-employer` | warning | an `eor-placed` engagement names a counterparty employer |
 * | `engagement.cost-bearer` | error | the cost bearer is a declared entity |
 * | `engagement.decider-unknown` | warning | the decider acts for a declared entity |
 * | `engagement.withholding-unknown` | hold | the withholding regime is in the regime pack |
 * | `engagement.social-security-unknown` | hold | each social-security regime is in the regime pack |
 * | `engagement.withholding-country` | warning | the withholding regime's country is the payroll country |
 * | `calendar.holiday-duplicate` | error | a pack lists a (date, name) once |
 * | `calendar.weekend-duplicate` | error | weekend days are listed once |
 * | `calendar.pack-jurisdiction` | warning | a calendar's packs are for its country |
 *
 * @since 0.1.0
 * @module
 */
import { type ValidationIssue } from '../core/Issue.ts';
import type { KeiretsuModel, KeySets } from './Model.ts';
import { type RegimeCodePack } from './RegimePack.ts';
/**
 * Validate people, engagements and calendars.
 *
 * @since 0.1.0
 * @category validation
 */
export declare const validatePeople: (options: {
    readonly model: KeiretsuModel;
    readonly keys: KeySets;
    readonly regimePack: RegimeCodePack;
}) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=PeopleInvariants.d.ts.map