/**
 * Dry-run render of journal entries as a minimal XBRL GL (`gl-cor`) instance.
 *
 * Emits `accountingEntries` → `entryHeader` → `entryDetail` with account,
 * amount, debit/credit code and posting date (XBRL GL 2015 Recommendation,
 * `gl-cor` module). Pure: returns an XML string for review. Validate with an
 * XBRL processor before relying on it; multicurrency (`gl-muc`) and
 * dimension (`gl-bus`) modules are on the roadmap.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Option } from 'effect';
import {} from "../core/Currency.js";
import { issue } from "../core/Issue.js";
import { resolve } from "./ChartMapping.js";
import { RenderRefused } from "./HledgerRender.js";
import { formatMinor } from "./internal/Codes.js";
/**
 * Namespaces used by the rendering.
 *
 * @since 0.1.0
 * @category constants
 */
export const NAMESPACES = {
    xbrli: 'http://www.xbrl.org/2003/instance',
    link: 'http://www.xbrl.org/2003/linkbase',
    xlink: 'http://www.w3.org/1999/xlink',
    iso4217: 'http://www.xbrl.org/2003/iso4217',
    'gl-cor': 'http://www.xbrl.org/int/gl/cor/2015-03-25',
};
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const element = (name, value, attributes = '') => `<gl-cor:${name} contextRef="c"${attributes}>${escape(value)}</gl-cor:${name}>`;
/**
 * Render entries of one entity.
 *
 * Codes: `render.no-mapping`, `render.unmapped-role`, `render.unknown-currency`, `render.mixed-entities`, `render.empty`.
 *
 * @since 0.1.0
 * @category render
 */
export const render = (options) => {
    const { entries, mapping } = options;
    const issues = [];
    const first = entries[0];
    if (first === undefined)
        return Effect.fail(new RenderRefused({ issues: [issue('render.empty', 'error', 'entries', 'nothing to render')] }));
    if (entries.some((entry) => entry.entityId !== mapping.entityId))
        issues.push(issue('render.mixed-entities', 'error', mapping.entityId, 'an instance covers the mapping entity only'));
    const currencies = new Set();
    const headers = entries.map((entry) => {
        const details = entry.lines.map((line, index) => {
            const account = resolve(mapping, line.role);
            const digits = options.table.minorUnits(line.amount.currency);
            if (Option.isNone(account)) {
                issues.push(issue('render.unmapped-role', 'error', entry.id, `role ${line.role} is unmapped`));
                return '';
            }
            if (digits === undefined) {
                issues.push(issue('render.unknown-currency', 'error', entry.id, `currency ${line.amount.currency} is unknown`));
                return '';
            }
            currencies.add(line.amount.currency);
            const accountId = account.value.code ?? account.value.account;
            return [
                '<gl-cor:entryDetail>',
                element('lineNumber', String(index + 1)),
                '<gl-cor:account>',
                element('accountMainID', accountId),
                element('accountMainDescription', account.value.account),
                '</gl-cor:account>',
                element('amount', formatMinor(line.amount, digits), ` unitRef="${line.amount.currency}" decimals="${digits}"`),
                element('debitCreditCode', line.side === 'debit' ? 'D' : 'C'),
                element('postingDate', entry.date),
                element('detailComment', `role:${line.role}`),
                '</gl-cor:entryDetail>',
            ].join('');
        });
        return [
            '<gl-cor:entryHeader>',
            element('postedDate', entry.date),
            element('enteredBy', entry.source.kind),
            element('sourceJournalID', 'gj'),
            element('entryNumber', entry.id),
            element('entryComment', entry.memo),
            ...details,
            '</gl-cor:entryHeader>',
        ].join('');
    });
    if (issues.length > 0)
        return Effect.fail(new RenderRefused({ issues }));
    const namespaceAttributes = Object.entries(NAMESPACES)
        .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
        .join(' ');
    const units = [...currencies].sort().map((code) => `<xbrli:unit id="${code}"><xbrli:measure>iso4217:${code}</xbrli:measure></xbrli:unit>`);
    const lastDate = entries.reduce((latest, entry) => (entry.date > latest ? entry.date : latest), first.date);
    return Effect.succeed([
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<xbrli:xbrl ${namespaceAttributes}>`,
        `<xbrli:context id="c"><xbrli:entity><xbrli:identifier scheme="urn:keiretsu:entity">${escape(mapping.entityId)}</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>${lastDate}</xbrli:instant></xbrli:period></xbrli:context>`,
        ...units,
        '<gl-cor:accountingEntries>',
        `<gl-cor:documentInfo>${element('entriesType', 'journal')}</gl-cor:documentInfo>`,
        ...headers,
        '</gl-cor:accountingEntries>',
        '</xbrli:xbrl>',
        '',
    ].join('\n'));
};
//# sourceMappingURL=XbrlGlRender.js.map