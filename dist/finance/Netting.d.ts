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
import { CountryCode } from '../core/Country.ts';
import { type EntityId } from '../core/Ids.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
/**
 * Flow kinds. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FlowKind: Schema.Union<readonly [Schema.Literals<readonly ["services", "royalty", "interest", "loan-principal", "capital", "goods"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type FlowKind = typeof FlowKind.Type;
/**
 * Data-pack row: whether a jurisdiction permits netting a flow kind.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const NettingPermission: Schema.Struct<{
    readonly jurisdiction: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly flowKind: Schema.Union<readonly [Schema.Literals<readonly ["services", "royalty", "interest", "loan-principal", "capital", "goods"]>, Schema.String]>;
    readonly permitted: Schema.Literals<readonly ["yes", "no", "unknown"]>;
    readonly citation: Schema.NonEmptyString;
    readonly status: Schema.Literals<readonly ["needs-verification", "verified"]>;
}>;
/** @since 0.1.0 @category models */
export type NettingPermission = typeof NettingPermission.Type;
/**
 * An open receivable of `creditor` from `debtor`.
 *
 * @since 0.1.0
 * @category models
 */
export interface Position {
    readonly creditor: {
        readonly entityId: EntityId;
        readonly jurisdiction: CountryCode;
    };
    readonly debtor: {
        readonly entityId: EntityId;
        readonly jurisdiction: CountryCode;
    };
    readonly flowKind: FlowKind;
    readonly amount: Money.Money;
    readonly agreementPermitsNetting: boolean;
}
/**
 * A pair's netting proposal.
 *
 * @since 0.1.0
 * @category models
 */
export interface PairNetting {
    readonly parties: readonly [EntityId, EntityId];
    readonly currency: string;
    readonly flowKind: FlowKind;
    /** Owed to the first party by the second, and vice versa. */
    readonly gross: readonly [Money.Money, Money.Money];
    /** Positive: second party pays first; negative: first pays second. */
    readonly net: Money.Money;
    readonly status: 'proposed' | 'held';
    readonly issues: ReadonlyArray<ValidationIssue>;
}
/**
 * Propose nets per pair, currency and flow kind.
 *
 * Codes: `netting.jurisdiction-not-permitted` (hold), `netting.agreement-not-permitted` (hold).
 *
 * @since 0.1.0
 * @category netting
 */
export declare const proposeNetting: (positions: ReadonlyArray<Position>, permissions: ReadonlyArray<NettingPermission>) => ReadonlyArray<PairNetting>;
//# sourceMappingURL=Netting.d.ts.map