/**
 * Dry-run render of journal entries as an hledger / ledger-cli plain-text journal.
 *
 * Pure: it returns text for a human to review and import; it never writes to
 * a ledger. Debits render positive and credits negative; dimensions and the
 * source derivation render as `; key:value` tags.
 *
 * @since 0.1.0
 * @module
 */
import { Effect } from 'effect';
import { type CurrencyTableShape } from '../core/Currency.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { type ChartMapping } from './ChartMapping.ts';
import type { JournalEntry } from './Journal.ts';
declare const RenderRefused_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "RenderRefused";
} & Readonly<A>;
/**
 * Rendering was refused (unmapped role, missing mapping, unknown currency).
 *
 * @since 0.1.0
 * @category errors
 */
export declare class RenderRefused extends RenderRefused_base<{
    readonly issues: ReadonlyArray<ValidationIssue>;
}> {
}
/**
 * Render entries. Entries are ordered by date then id so output is deterministic.
 *
 * Codes: `render.no-mapping`, `render.unmapped-role`, `render.unknown-currency`.
 *
 * @since 0.1.0
 * @category render
 */
export declare const render: (options: {
    readonly entries: ReadonlyArray<JournalEntry>;
    readonly mappings: ReadonlyArray<ChartMapping>;
    readonly table: CurrencyTableShape;
}) => Effect.Effect<string, RenderRefused>;
export {};
//# sourceMappingURL=HledgerRender.d.ts.map