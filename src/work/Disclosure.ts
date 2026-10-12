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
export const DisclosureLevel = Schema.Literals(['owner-only', 'aggregate', 'pseudonymous', 'parties']);
/** @since 0.1.0 @category models */
export type DisclosureLevel = typeof DisclosureLevel.Type;

/**
 * Record kinds owned by the work package.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkRecordKind = Schema.Literals([
  'journal-entry',
  'time-proposal',
  'labour',
  'compute',
  'delivery',
  'licence-use',
  'work-order',
  'standing-authority',
  'acceptance',
  'project-link',
  'capacity-offer',
  'capacity-request',
  'capacity-commitment',
  'capacity-hold',
  'capacity-forecast',
  'firm-schedule',
]);
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
export const WORK_DISCLOSURE: { readonly [K in WorkRecordKind]: DisclosureRule } = {
  'journal-entry': { level: 'owner-only', personFields: ['owner', 'provenance.actor', 'affirmation.by'], note: 'Signals and unaffirmed entries never enter bundles.' },
  'time-proposal': { level: 'owner-only', personFields: ['owner', 'proposedBy'], note: 'Only the promoted labour event crosses companies.' },
  labour: {
    level: 'pseudonymous',
    personFields: ['person', 'engagementId', 'attestedBy', 'origin.promotedBy'],
    note: 'Situs, work date and employer stay: tax attribution reads them. Identified disclosure needs a DPA reference.',
  },
  compute: { level: 'pseudonymous', personFields: ['operator'], note: 'Cost and cost bearer travel; the operator is pseudonymised.' },
  delivery: { level: 'parties', personFields: [], note: 'Provider and receiver.' },
  'licence-use': { level: 'parties', personFields: [], note: 'Licensor and licensee.' },
  'work-order': { level: 'parties', personFields: ['requester', 'draftedBy', 'authorization.approvals[].by'], note: 'Requesting party and performer.' },
  'standing-authority': { level: 'parties', personFields: ['grantor'], note: 'Granting entity and covered parties.' },
  acceptance: { level: 'parties', personFields: ['decidedBy'], note: 'Accepting party and provider.' },
  'project-link': { level: 'parties', personFields: ['acceptances[].by'], note: 'The two owners.' },
  'capacity-offer': { level: 'pseudonymous', personFields: ['subject.person', 'offeredBy'], note: 'Partners see a pseudonym or a role, never leave reasons.' },
  'capacity-request': { level: 'parties', personFields: ['requestedBy'], note: 'Offering entity and requester.' },
  'capacity-commitment': { level: 'parties', personFields: ['committedBy'], note: 'Employer and requester.' },
  'capacity-hold': {
    level: 'pseudonymous',
    personFields: ['subject.person', 'heldBy', 'closedBy'],
    note: 'Holder and provider. The reserved person travels as a pseudonym or a role; no rates, cost or resale price travel with a hold.',
  },
  'capacity-forecast': { level: 'pseudonymous', personFields: ['weeks[].subject.person', 'preparedBy'], note: 'Non-binding; partners see pseudonyms or roles, never leave reasons.' },
  'firm-schedule': { level: 'pseudonymous', personFields: ['assignments[].subject.person', 'revisedBy'], note: 'Provider and audience; each daily revision is the signed fact.' },
};

/**
 * Whether records of a kind may leave their owner at all.
 *
 * @since 0.1.0
 * @category predicates
 */
export const mayLeaveOwner = (kind: WorkRecordKind): boolean => WORK_DISCLOSURE[kind].level !== 'owner-only';
