/**
 * Disclosure declared per record kind (PRD-046 commitment 4). The exchange
 * package enforces these levels when it builds bundles; this module is the
 * work package's declaration.
 *
 * - `owner-only`: never leaves the owner (journals, proposals).
 * - `parties`: shared with the parties named on the record.
 * - `pseudonymous`: shared with person references replaced by audience-scoped pseudonyms.
 * - `aggregate`: only attested totals leave the issuer.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Disclosure levels, most private first.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DisclosureLevel: Schema.Literals<readonly ["owner-only", "aggregate", "pseudonymous", "parties"]>;
/** @since 0.1.0 @category models */
export type DisclosureLevel = typeof DisclosureLevel.Type;
/**
 * Record kinds owned by the work package.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkRecordKind: Schema.Literals<readonly ["journal-entry", "time-proposal", "labour", "compute", "delivery", "licence-use", "work-order", "standing-authority", "acceptance", "project-link", "capacity-offer", "capacity-request", "capacity-commitment", "capacity-hold", "capacity-forecast", "firm-schedule"]>;
/** @since 0.1.0 @category models */
export type WorkRecordKind = typeof WorkRecordKind.Type;
/**
 * A kind's default disclosure and the fields that identify people.
 *
 * @since 0.1.0
 * @category models
 */
export interface DisclosureRule {
    readonly level: DisclosureLevel;
    readonly personFields: ReadonlyArray<string>;
    readonly note: string;
}
/**
 * The work package's disclosure declaration.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const WORK_DISCLOSURE: {
    readonly [K in WorkRecordKind]: DisclosureRule;
};
/**
 * Whether records of a kind may leave their owner at all.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const mayLeaveOwner: (kind: WorkRecordKind) => boolean;
//# sourceMappingURL=Disclosure.d.ts.map