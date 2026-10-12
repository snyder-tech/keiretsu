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
import { Effect } from 'effect';
import { type CurrencyTableShape } from '../core/Currency.ts';
import { type ChartMapping } from './ChartMapping.ts';
import { RenderRefused } from './HledgerRender.ts';
import type { JournalEntry } from './Journal.ts';
/**
 * Namespaces used by the rendering.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const NAMESPACES: {
    readonly xbrli: "http://www.xbrl.org/2003/instance";
    readonly link: "http://www.xbrl.org/2003/linkbase";
    readonly xlink: "http://www.w3.org/1999/xlink";
    readonly iso4217: "http://www.xbrl.org/2003/iso4217";
    readonly 'gl-cor': "http://www.xbrl.org/int/gl/cor/2015-03-25";
};
/**
 * Render entries of one entity.
 *
 * Codes: `render.no-mapping`, `render.unmapped-role`, `render.unknown-currency`, `render.mixed-entities`, `render.empty`.
 *
 * @since 0.1.0
 * @category render
 */
export declare const render: (options: {
    readonly entries: ReadonlyArray<JournalEntry>;
    readonly mapping: ChartMapping;
    readonly table: CurrencyTableShape;
}) => Effect.Effect<string, RenderRefused>;
//# sourceMappingURL=XbrlGlRender.d.ts.map