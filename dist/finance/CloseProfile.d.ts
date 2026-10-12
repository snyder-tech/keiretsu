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
import { Schema } from 'effect';
import { type ValidationIssue } from '../core/Issue.ts';
/**
 * Account roles the standard close books against, beyond those `Journal`
 * emits.
 *
 * @since 0.44.11
 * @category constants
 */
export declare const CloseRoles: {
    readonly cash: "cash";
    readonly tradePayable: "trade-payable";
    /** Labour cost of locked time not yet paid. */
    readonly accruedLabour: "accrued-labour";
    /** Unrealised FX gains and losses on period-end revaluation. */
    readonly fxRevaluation: "fx-revaluation";
};
/**
 * Every role a close profile must map. The list is the standard; it is the
 * same for every entity.
 *
 * @since 0.44.11
 * @category constants
 */
export declare const STANDARD_CLOSE_ROLES: ReadonlyArray<string>;
/**
 * One entity's close profile.
 *
 * @since 0.44.11
 * @category schemas
 */
export declare const CloseProfile: Schema.Struct<{
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly displayName: Schema.NonEmptyString;
    readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly functionalCurrency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly chart: Schema.Struct<{
        readonly chart: Schema.NonEmptyString;
        readonly roles: Schema.$Record<Schema.brand<Schema.String, "keiretsu/AccountRole">, Schema.Struct<{
            readonly account: Schema.NonEmptyString;
            readonly code: Schema.optional<Schema.NonEmptyString>;
        }>>;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    }>;
}>;
/** @since 0.44.11 @category models */
export type CloseProfile = typeof CloseProfile.Type;
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
export declare const checkCloseProfile: (profile: CloseProfile) => ReadonlyArray<ValidationIssue>;
/**
 * The entity's account code for a standard role, if mapped.
 *
 * @since 0.44.11
 * @category lookups
 */
export declare const accountCode: (profile: CloseProfile, role: string) => string | undefined;
//# sourceMappingURL=CloseProfile.d.ts.map