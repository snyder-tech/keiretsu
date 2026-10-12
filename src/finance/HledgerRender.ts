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

import { type CurrencyTableShape } from '../core/Currency.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';

import { type ChartMapping, resolve } from './ChartMapping.ts';
import { formatMinor } from './internal/Codes.ts';
import type { JournalEntry, JournalLine } from './Journal.ts';

/**
 * Rendering was refused (unmapped role, missing mapping, unknown currency).
 *
 * @since 0.1.0
 * @category errors
 */
export class RenderRefused extends Data.TaggedError('RenderRefused')<{ readonly issues: ReadonlyArray<ValidationIssue> }> {}

const clean = (text: string): string => text.replace(/[\r\n;]+/g, ' ').replace(/\s+/g, ' ').trim();

const dimensionTags = (line: JournalLine): ReadonlyArray<string> =>
  Object.entries(line.dimensions ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${clean(String(value))}`);

const renderLine = (line: JournalLine, account: string, digits: number): string => {
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
export const render = (options: {
  readonly entries: ReadonlyArray<JournalEntry>;
  readonly mappings: ReadonlyArray<ChartMapping>;
  readonly table: CurrencyTableShape;
}): Effect.Effect<string, RenderRefused> => {
  const issues: Array<ValidationIssue> = [];
  const blocks: Array<string> = [];
  const ordered = [...options.entries].sort((left, right) => (left.date === right.date ? (left.id < right.id ? -1 : 1) : left.date < right.date ? -1 : 1));
  for (const entry of ordered) {
    const mapping = options.mappings.find((candidate) => candidate.entityId === entry.entityId);
    if (mapping === undefined) {
      issues.push(issue('render.no-mapping', 'error', entry.id, `no chart mapping for entity ${entry.entityId}`));
      continue;
    }
    const header = `${entry.date} ${clean(entry.memo)}  ; entry:${entry.id}, entity:${entry.entityId}, source:${entry.source.kind}, derivation:${entry.source.derivationId}`;
    const lines: Array<string> = [];
    for (const line of entry.lines) {
      const account = resolve(mapping, line.role);
      const digits = options.table.minorUnits(line.amount.currency);
      if (Option.isNone(account)) issues.push(issue('render.unmapped-role', 'error', entry.id, `role ${line.role} is unmapped`));
      else if (digits === undefined) issues.push(issue('render.unknown-currency', 'error', entry.id, `currency ${line.amount.currency} is unknown`));
      else lines.push(renderLine(line, account.value.account, digits));
    }
    blocks.push([header, ...lines].join('\n'));
  }
  return issues.length > 0 ? Effect.fail(new RenderRefused({ issues })) : Effect.succeed(`${blocks.join('\n\n')}\n`);
};
