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
import { Data, Effect, Option } from 'effect';
import {} from "../core/Currency.js";
import { issue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { resolve } from "./ChartMapping.js";
import { formatMinor } from "./internal/Codes.js";
/**
 * Rendering was refused (unmapped role, missing mapping, unknown currency).
 *
 * @since 0.1.0
 * @category errors
 */
export class RenderRefused extends Data.TaggedError('RenderRefused') {
}
const clean = (text) => text.replace(/[\r\n;]+/g, ' ').replace(/\s+/g, ' ').trim();
const dimensionTags = (line) => Object.entries(line.dimensions ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${clean(String(value))}`);
const renderLine = (line, account, digits) => {
    const signed = line.side === 'debit' ? line.amount : Money.negate(line.amount);
    const tags = [...dimensionTags(line), ...(line.transactionAmount === undefined ? [] : [`txn:${line.transactionAmount.minor}/${line.transactionAmount.currency}`])];
    const comment = tags.length === 0 ? '' : `  ; ${tags.join(', ')}`;
    return `    ${account}  ${formatMinor(signed, digits)} ${line.amount.currency}${comment}`;
};
/**
 * Render entries. Entries are ordered by date then id so output is deterministic.
 *
 * Codes: `render.no-mapping`, `render.unmapped-role`, `render.unknown-currency`.
 *
 * @since 0.1.0
 * @category render
 */
export const render = (options) => {
    const issues = [];
    const blocks = [];
    const ordered = [...options.entries].sort((left, right) => (left.date === right.date ? (left.id < right.id ? -1 : 1) : left.date < right.date ? -1 : 1));
    for (const entry of ordered) {
        const mapping = options.mappings.find((candidate) => candidate.entityId === entry.entityId);
        if (mapping === undefined) {
            issues.push(issue('render.no-mapping', 'error', entry.id, `no chart mapping for entity ${entry.entityId}`));
            continue;
        }
        const header = `${entry.date} ${clean(entry.memo)}  ; entry:${entry.id}, entity:${entry.entityId}, source:${entry.source.kind}, derivation:${entry.source.derivationId}`;
        const lines = [];
        for (const line of entry.lines) {
            const account = resolve(mapping, line.role);
            const digits = options.table.minorUnits(line.amount.currency);
            if (Option.isNone(account))
                issues.push(issue('render.unmapped-role', 'error', entry.id, `role ${line.role} is unmapped`));
            else if (digits === undefined)
                issues.push(issue('render.unknown-currency', 'error', entry.id, `currency ${line.amount.currency} is unknown`));
            else
                lines.push(renderLine(line, account.value.account, digits));
        }
        blocks.push([header, ...lines].join('\n'));
    }
    return issues.length > 0 ? Effect.fail(new RenderRefused({ issues })) : Effect.succeed(`${blocks.join('\n\n')}\n`);
};
//# sourceMappingURL=HledgerRender.js.map