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
import { type ValidationIssue } from '../core/Issue.ts';
import { type JournalEntry } from './Journal.ts';
/**
 * Target account for a role.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const MappedAccount: Schema.Struct<{
    /** Account name or path, e.g. `Assets:Intercompany:Receivable` for plain-text ledgers. */
    readonly account: Schema.NonEmptyString;
    /** Account code/id in the target system, when it has one. */
    readonly code: Schema.optional<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type MappedAccount = typeof MappedAccount.Type;
/**
 * One entity's mapping.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ChartMapping: Schema.Struct<{
    readonly chart: Schema.NonEmptyString;
    readonly roles: Schema.$Record<Schema.brand<Schema.String, "keiretsu/AccountRole">, Schema.Struct<{
        /** Account name or path, e.g. `Assets:Intercompany:Receivable` for plain-text ledgers. */
        readonly account: Schema.NonEmptyString;
        /** Account code/id in the target system, when it has one. */
        readonly code: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
}>;
/** @since 0.1.0 @category models */
export type ChartMapping = typeof ChartMapping.Type;
/**
 * The account for a role, if mapped.
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const resolve: (mapping: ChartMapping, role: string) => Option.Option<MappedAccount>;
/**
 * Check that a mapping covers every role used by the entity's entries.
 *
 * Codes: `chart.entity-mismatch`, `chart.unmapped-role`.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const coverage: (mapping: ChartMapping, entries: ReadonlyArray<JournalEntry>) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=ChartMapping.d.ts.map