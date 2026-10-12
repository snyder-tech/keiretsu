/**
 * Ledger-agnostic journal entries.
 *
 * Lines carry **account roles** (`ic-receivable`, `labor-cogs`, `revenue`…),
 * never provider accounts; a per-entity {@link ChartMapping} resolves roles at
 * render time. Every entry balances per currency and cites the derivation
 * that produced it. Revenue roles are credited only by entries that cite a
 * revenue-recognition entry: invoices create receivables and contract
 * liabilities, never revenue.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
/**
 * Account role: lowercase words joined by `-` or `.` (open; adopters add their own).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AccountRole: Schema.brand<Schema.String, "keiretsu/AccountRole">;
/** @since 0.1.0 @category models */
export type AccountRole = typeof AccountRole.Type;
/**
 * Roles this package emits.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const Roles: {
    readonly revenue: "revenue";
    readonly revenueAgentNet: "revenue-agent-net";
    readonly revenueIntercompany: "revenue-intercompany";
    readonly tradeReceivable: "trade-receivable";
    readonly contractLiability: "contract-liability";
    readonly contractAsset: "contract-asset";
    readonly icReceivable: "ic-receivable";
    readonly icPayable: "ic-payable";
    readonly icServiceCost: "ic-service-cost";
    readonly icCapitalisedCost: "ic-capitalised-cost";
    readonly fxDifferenceElimination: "fx-difference-elimination";
};
/**
 * Roles that represent revenue. Crediting them requires a recognition reference.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const REVENUE_ROLES: ReadonlySet<string>;
/**
 * Optional analysis dimensions (XBRL GL `gl-bus` style).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Dimensions: Schema.Struct<{
    readonly costObjectId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    readonly counterpartyId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CounterpartyId">>;
    readonly counterpartyEntityId: Schema.optional<Schema.brand<Schema.String, "keiretsu/EntityId">>;
    readonly department: Schema.optional<Schema.NonEmptyString>;
    readonly location: Schema.optional<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type Dimensions = typeof Dimensions.Type;
/**
 * One journal line. `amount` is positive; `side` gives direction. `transactionAmount`
 * keeps the original-currency amount when the line is booked in functional currency.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const JournalLine: Schema.Struct<{
    readonly role: Schema.brand<Schema.String, "keiretsu/AccountRole">;
    readonly side: Schema.Literals<readonly ["debit", "credit"]>;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly transactionAmount: Schema.optional<Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>>;
    readonly dimensions: Schema.optional<Schema.Struct<{
        readonly costObjectId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
        readonly counterpartyId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CounterpartyId">>;
        readonly counterpartyEntityId: Schema.optional<Schema.brand<Schema.String, "keiretsu/EntityId">>;
        readonly department: Schema.optional<Schema.NonEmptyString>;
        readonly location: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly memo: Schema.optional<Schema.NonEmptyString>;
}>;
/** @since 0.1.0 @category models */
export type JournalLine = typeof JournalLine.Type;
/**
 * Where an entry came from. Open list of kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const JournalSource: Schema.Struct<{
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["recognition-entry", "invoice", "cost-allocation", "true-up", "intercompany-mirror", "elimination", "loan-accrual", "adjustment"]>, Schema.String]>;
    readonly derivationId: Schema.brand<Schema.String, "keiretsu/DerivationId">;
    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type JournalSource = typeof JournalSource.Type;
/**
 * Entry invariants.
 *
 * Codes: `journal.amount-positive`, `journal.unbalanced`, `journal.period-date`, `journal.revenue-from-recognition`.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const validateEntry: (entry: {
    readonly date: string;
    readonly period: string;
    readonly lines: ReadonlyArray<JournalLine>;
    readonly recognitionRef?: {
        readonly derivationId: string;
    } | undefined;
}) => ReadonlyArray<ValidationIssue>;
/**
 * A journal entry for one entity.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const JournalEntry: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/JournalEntryId">;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly memo: Schema.NonEmptyString;
    readonly lines: Schema.NonEmptyArray<Schema.Struct<{
        readonly role: Schema.brand<Schema.String, "keiretsu/AccountRole">;
        readonly side: Schema.Literals<readonly ["debit", "credit"]>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly transactionAmount: Schema.optional<Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>>;
        readonly dimensions: Schema.optional<Schema.Struct<{
            readonly costObjectId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
            readonly counterpartyId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CounterpartyId">>;
            readonly counterpartyEntityId: Schema.optional<Schema.brand<Schema.String, "keiretsu/EntityId">>;
            readonly department: Schema.optional<Schema.NonEmptyString>;
            readonly location: Schema.optional<Schema.NonEmptyString>;
        }>>;
        readonly memo: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly source: Schema.Struct<{
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["recognition-entry", "invoice", "cost-allocation", "true-up", "intercompany-mirror", "elimination", "loan-accrual", "adjustment"]>, Schema.String]>;
        readonly derivationId: Schema.brand<Schema.String, "keiretsu/DerivationId">;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    /** The revenue-recognition derivation supporting any revenue credit in this entry. */
    readonly recognitionRef: Schema.optional<Schema.Struct<{
        readonly derivationId: Schema.brand<Schema.String, "keiretsu/DerivationId">;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly reversalOf: Schema.optional<Schema.brand<Schema.String, "keiretsu/JournalEntryId">>;
}>;
/** @since 0.1.0 @category models */
export type JournalEntry = typeof JournalEntry.Type;
declare const InvalidEntry_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidEntry";
} & Readonly<A>;
/**
 * An entry failed its invariants.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class InvalidEntry extends InvalidEntry_base<{
    readonly issues: ReadonlyArray<ValidationIssue>;
}> {
}
/**
 * Entry fields with lines as a plain array (checked for at least two lines).
 *
 * @since 0.1.0
 * @category models
 */
export type EntryInput = Omit<JournalEntry, 'lines'> & {
    readonly lines: ReadonlyArray<JournalLine>;
};
/**
 * Build an entry, failing with every invariant it breaks (code `journal.min-lines` when fewer than two lines).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const makeEntry: (input: EntryInput) => Effect.Effect<JournalEntry, InvalidEntry>;
/**
 * Signed net per currency (debit positive). Zero for every currency in a valid entry.
 *
 * @since 0.1.0
 * @category math
 */
export declare const netByCurrency: (lines: ReadonlyArray<JournalLine>) => ReadonlyMap<string, bigint>;
/**
 * A line that moves `amount` to the side its sign indicates (zero amounts produce no line).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const signedLine: (role: AccountRole, signedAmount: Money.Money, extra?: Omit<JournalLine, "role" | "side" | "amount">) => ReadonlyArray<JournalLine>;
/**
 * Decode a role literal.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const role: (value: string) => AccountRole;
export {};
//# sourceMappingURL=Journal.d.ts.map