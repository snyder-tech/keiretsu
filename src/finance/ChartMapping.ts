/**
 * Per-entity chart-of-accounts mappings from account roles to ledger accounts.
 *
 * A mapping must cover every role the entity's entries emit; an unmapped role
 * is an error, never a default account.
 *
 * @since 0.1.0
 * @module
 */
import { Option, Schema } from 'effect';

import { revisionChain, RevisionFields } from '../core/Envelope.ts';
import { EntityId } from '../core/Ids.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';

import { AccountRole, type JournalEntry } from './Journal.ts';

/**
 * Target account for a role.
 *
 * @since 0.1.0
 * @category schemas
 */
export const MappedAccount = Schema.Struct({
  /** Account name or path, e.g. `Assets:Intercompany:Receivable` for plain-text ledgers. */
  account: Schema.NonEmptyString,
  /** Account code/id in the target system, when it has one. */
  code: Schema.optional(Schema.NonEmptyString),
});
/** @since 0.1.0 @category models */
export type MappedAccount = typeof MappedAccount.Type;

/**
 * One entity's mapping.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ChartMapping = Schema.Struct({
  entityId: EntityId,
  ...RevisionFields,
  chart: Schema.NonEmptyString,
  roles: Schema.Record(AccountRole, MappedAccount),
}).check(revisionChain);
/** @since 0.1.0 @category models */
export type ChartMapping = typeof ChartMapping.Type;

/**
 * The account for a role, if mapped.
 *
 * @since 0.1.0
 * @category lookups
 */
export const resolve = (mapping: ChartMapping, role: string): Option.Option<MappedAccount> => Option.fromNullishOr(Object.entries(mapping.roles).find(([key]) => key === role)?.[1]);

/**
 * Check that a mapping covers every role used by the entity's entries.
 *
 * Codes: `chart.entity-mismatch`, `chart.unmapped-role`.
 *
 * @since 0.1.0
 * @category checks
 */
export const coverage = (mapping: ChartMapping, entries: ReadonlyArray<JournalEntry>): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  const missing = new Set<string>();
  for (const entry of entries) {
    if (entry.entityId !== mapping.entityId) issues.push(issue('chart.entity-mismatch', 'error', entry.id, 'entry belongs to another entity'));
    for (const line of entry.lines) if (Option.isNone(resolve(mapping, line.role))) missing.add(line.role);
  }
  for (const role of [...missing].sort()) issues.push(issue('chart.unmapped-role', 'error', role, `role ${role} has no account in ${mapping.chart}`));
  return issues;
};
