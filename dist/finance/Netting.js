/**
 * Intercompany netting proposals.
 *
 * Positions are grouped by unordered pair, currency and flow kind (loans,
 * capital and service fees are never netted together). A pair's net is
 * `proposed` only when both jurisdictions' rule packs permit netting that
 * flow (verified rows) and the agreement permits it; otherwise it is `held`
 * with the reason. Export-proceeds realisation rules (e.g. FEMA, SBP) make
 * cross-border netting a professional decision; this never settles anything.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { CountryCode } from "../core/Country.js";
import {} from "../core/Ids.js";
import { issue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { extensible } from "./internal/Codes.js";
/**
 * Flow kinds. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FlowKind = extensible(['services', 'royalty', 'interest', 'loan-principal', 'capital', 'goods']);
/**
 * Data-pack row: whether a jurisdiction permits netting a flow kind.
 *
 * @since 0.1.0
 * @category schemas
 */
export const NettingPermission = Schema.Struct({
    jurisdiction: CountryCode,
    flowKind: FlowKind,
    permitted: Schema.Literals(['yes', 'no', 'unknown']),
    citation: Schema.NonEmptyString,
    status: Schema.Literals(['needs-verification', 'verified']),
});
const permits = (permissions, jurisdiction, flowKind) => permissions.some((row) => row.jurisdiction === jurisdiction && row.flowKind === flowKind && row.permitted === 'yes' && row.status === 'verified');
const pairIssues = (group, permissions, subject) => {
    const issues = [];
    const jurisdictions = new Set(group.flatMap((position) => [position.creditor.jurisdiction, position.debtor.jurisdiction]));
    const flowKind = group[0]?.flowKind ?? '';
    for (const jurisdiction of jurisdictions) {
        if (!permits(permissions, jurisdiction, flowKind))
            issues.push(issue('netting.jurisdiction-not-permitted', 'hold', subject, `${jurisdiction} rule pack does not (verifiably) permit netting ${flowKind}`));
    }
    if (group.some((position) => !position.agreementPermitsNetting))
        issues.push(issue('netting.agreement-not-permitted', 'hold', subject, 'agreement does not permit netting'));
    return issues;
};
/**
 * Propose nets per pair, currency and flow kind.
 *
 * Codes: `netting.jurisdiction-not-permitted` (hold), `netting.agreement-not-permitted` (hold).
 *
 * @since 0.1.0
 * @category netting
 */
export const proposeNetting = (positions, permissions) => {
    const groups = new Map();
    for (const position of positions) {
        const [a, b] = position.creditor.entityId < position.debtor.entityId ? [position.creditor.entityId, position.debtor.entityId] : [position.debtor.entityId, position.creditor.entityId];
        const key = `${a}|${b}|${position.amount.currency}|${position.flowKind}`;
        const group = groups.get(key) ?? { parties: [a, b], first: position, members: [] };
        group.members.push(position);
        groups.set(key, group);
    }
    return [...groups.values()].map(({ parties, first, members }) => {
        const [a, b] = parties;
        const currency = first.amount.currency;
        const owedTo = (party) => members.filter((position) => position.creditor.entityId === party).reduce((sum, position) => sum + Money.units(position.amount), 0n);
        const issues = pairIssues(members, permissions, `${a}↔${b}:${currency}:${first.flowKind}`);
        return {
            parties,
            currency,
            flowKind: first.flowKind,
            gross: [Money.make(owedTo(a), currency), Money.make(owedTo(b), currency)],
            net: Money.make(owedTo(a) - owedTo(b), currency),
            status: issues.length === 0 ? 'proposed' : 'held',
            issues,
        };
    });
};
//# sourceMappingURL=Netting.js.map