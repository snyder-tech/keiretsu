/**
 * Per-entity configuration for the standard monthly close.
 *
 * The close itself is the same for every adopter (`work/MonthlyClose`). A
 * profile carries only what is the entity's own: its functional currency, its
 * country and its chart of accounts, as a `ChartMapping` from the standard
 * close roles to the entity's account codes. The roles are canonical, so close
 * receipts and journals exchanged between companies stay comparable while
 * each company keeps its own codes.
 *
 * @since 0.44.11
 * @module
 */
import { Option, Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { CountryCode } from "../core/Country.js";
import { CurrencyCode } from "../core/Currency.js";
import { issue } from "../core/Issue.js";
import { ChartMapping, resolve } from "./ChartMapping.js";
import { Roles } from "./Journal.js";
/**
 * Account roles the standard close books against, beyond those `Journal`
 * emits.
 *
 * @since 0.44.11
 * @category constants
 */
export const CloseRoles = {
    cash: 'cash',
    tradePayable: 'trade-payable',
    /** Labour cost of locked time not yet paid. */
    accruedLabour: 'accrued-labour',
    /** Unrealised FX gains and losses on period-end revaluation. */
    fxRevaluation: 'fx-revaluation',
};
/**
 * Every role a close profile must map. The list is the standard; it is the
 * same for every entity.
 *
 * @since 0.44.11
 * @category constants
 */
export const STANDARD_CLOSE_ROLES = [
    CloseRoles.cash,
    Roles.tradeReceivable,
    Roles.contractAsset,
    Roles.contractLiability,
    CloseRoles.tradePayable,
    CloseRoles.accruedLabour,
    Roles.revenue,
    Roles.icReceivable,
    Roles.icPayable,
    Roles.icServiceCost,
    CloseRoles.fxRevaluation,
];
/**
 * One entity's close profile.
 *
 * @since 0.44.11
 * @category schemas
 */
export const CloseProfile = Schema.Struct({
    entityId: EntityId,
    displayName: Schema.NonEmptyString,
    country: CountryCode,
    functionalCurrency: CurrencyCode,
    chart: ChartMapping,
}).check(Schema.makeFilter((profile) => (profile.chart.entityId === profile.entityId ? undefined : 'the chart belongs to the profile entity')));
const duplicateCodes = (profile) => {
    const roleByCode = new Map();
    const issues = [];
    for (const [role, account] of Object.entries(profile.chart.roles)) {
        if (account.code === undefined)
            continue;
        const other = roleByCode.get(account.code);
        if (other === undefined)
            roleByCode.set(account.code, role);
        else
            issues.push(issue('close-profile.shared-code', 'warning', account.code, `roles ${other} and ${role} share account ${account.code} in ${profile.chart.chart}`));
    }
    return issues;
};
/**
 * Check a profile against the standard: every standard role mapped, each to
 * an account with a code.
 *
 * Codes: `close-profile.unmapped-role` (error), `close-profile.missing-code`
 * (error), `close-profile.shared-code` (warning).
 *
 * @since 0.44.11
 * @category checks
 */
export const checkCloseProfile = (profile) => {
    const issues = [];
    for (const role of STANDARD_CLOSE_ROLES) {
        const account = resolve(profile.chart, role);
        if (Option.isNone(account))
            issues.push(issue('close-profile.unmapped-role', 'error', role, `role ${role} has no account in ${profile.chart.chart}`));
        else if (account.value.code === undefined)
            issues.push(issue('close-profile.missing-code', 'error', role, `role ${role} maps to ${account.value.account} without an account code`));
    }
    return [...issues, ...duplicateCodes(profile)];
};
/**
 * The entity's account code for a standard role, if mapped.
 *
 * @since 0.44.11
 * @category lookups
 */
export const accountCode = (profile, role) => Option.getOrUndefined(Option.flatMapNullishOr(resolve(profile.chart, role), (account) => account.code));
//# sourceMappingURL=CloseProfile.js.map