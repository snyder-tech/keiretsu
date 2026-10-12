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
import { revisionChain, RevisionFields } from "../core/Envelope.js";
import { EntityId } from "../core/Ids.js";
import { issue } from "../core/Issue.js";
import { AccountRole } from "./Journal.js";
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
/**
 * The account for a role, if mapped.
 *
 * @since 0.1.0
 * @category lookups
 */
export const resolve = (mapping, role) => Option.fromNullishOr(Object.entries(mapping.roles).find(([key]) => key === role)?.[1]);
/**
 * Check that a mapping covers every role used by the entity's entries.
 *
 * Codes: `chart.entity-mismatch`, `chart.unmapped-role`.
 *
 * @since 0.1.0
 * @category checks
 */
export const coverage = (mapping, entries) => {
    const issues = [];
    const missing = new Set();
    for (const entry of entries) {
        if (entry.entityId !== mapping.entityId)
            issues.push(issue('chart.entity-mismatch', 'error', entry.id, 'entry belongs to another entity'));
        for (const line of entry.lines)
            if (Option.isNone(resolve(mapping, line.role)))
                missing.add(line.role);
    }
    for (const role of [...missing].sort())
        issues.push(issue('chart.unmapped-role', 'error', role, `role ${role} has no account in ${mapping.chart}`));
    return issues;
};
//# sourceMappingURL=ChartMapping.js.map