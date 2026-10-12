/**
 * Minimal revenue recognition (ASC 606 / IFRS 15): performance obligations,
 * recognition entries, contract assets and liabilities, principal/agent.
 *
 * Revenue is recognised, not billed. Over-time obligations recognise the
 * cumulative share of the allocated price by an input or output measure
 * (cumulative catch-up, rounded once); point-in-time obligations recognise in
 * full at transfer of control. Invoices create receivables and contract
 * liabilities. Principal/agent is a human determination; an undetermined role
 * holds recognition. Transaction-price estimation, variable consideration and
 * SSP allocation are on the roadmap: the allocated price is an input here.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import type { Sha256 } from '../core/CanonicalJson.ts';
import type { CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import { EvidenceRef } from '../core/Envelope.ts';
import { type JournalEntryId } from '../core/Ids.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { IsoDate } from '../core/Temporal.ts';
import { type AccountRole, type JournalEntry, type InvalidEntry } from './Journal.ts';
/** @since 0.1.0 @category schemas */
export declare const PerformanceObligationId: Schema.brand<Schema.String, "keiretsu/PerformanceObligationId">;
/**
 * A performance obligation with its allocated transaction price.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PerformanceObligation: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/PerformanceObligationId">;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
    readonly customer: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
    readonly description: Schema.NonEmptyString;
    readonly allocatedPrice: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly pattern: Schema.TaggedUnion<{
        readonly "over-time": Schema.TaggedStruct<"over-time", {
            readonly measure: Schema.Literals<readonly ["input", "output"]>;
            readonly unit: Schema.NonEmptyString;
        }>;
        readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {}>;
    }>;
    readonly role: Schema.Literals<readonly ["principal", "agent", "undetermined"]>;
    readonly roleDecidedBy: Schema.optional<Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type PerformanceObligation = typeof PerformanceObligation.Type;
/**
 * A recognition entry: revenue recognised for an obligation on a date.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RecognitionEntry: Schema.Struct<{
    readonly derivationId: Schema.brand<Schema.String, "keiretsu/DerivationId">;
    readonly obligationId: Schema.brand<Schema.String, "keiretsu/PerformanceObligationId">;
    readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly cumulative: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly progress: Schema.optional<Schema.Struct<{
        readonly measured: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly expectedTotal: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type RecognitionEntry = typeof RecognitionEntry.Type;
/**
 * Candidate recognition, or a hold.
 *
 * @since 0.1.0
 * @category models
 */
export type RecognitionOutcome = {
    readonly _tag: 'entry';
    readonly entry: RecognitionEntry;
} | {
    readonly _tag: 'held';
    readonly issue: ValidationIssue;
};
/**
 * Recognise revenue to date for an obligation.
 *
 * Codes: `revenue.role-undetermined` (hold), `revenue.progress-invalid` (hold), `revenue.not-transferred` (hold).
 *
 * @since 0.1.0
 * @category recognition
 */
export declare const recognise: (options: {
    readonly obligation: PerformanceObligation;
    readonly derivationId: RecognitionEntry["derivationId"];
    readonly date: IsoDate;
    readonly recognisedToDate: Money.Money;
    /** Over time: measured and expected total. Point in time: whether control has transferred. */
    readonly progress: {
        readonly measured: Decimal.Decimal;
        readonly expectedTotal: Decimal.Decimal;
    } | {
        readonly transferred: boolean;
    };
    readonly evidence: ReadonlyArray<EvidenceRef>;
    readonly money: {
        readonly table: CurrencyTableShape;
        readonly rounding: RoundingMode;
    };
}) => Effect.Effect<RecognitionOutcome, UnknownCurrency>;
/**
 * The revenue role for an obligation: gross revenue for a principal, net for an agent.
 *
 * @since 0.1.0
 * @category presentation
 */
export declare const revenueRole: (obligation: PerformanceObligation) => AccountRole | undefined;
/**
 * Contract position from cumulative invoicing and recognition (one contract, one currency).
 * Recognised beyond invoiced is a contract asset; invoiced beyond recognised is a contract liability.
 *
 * @since 0.1.0
 * @category presentation
 */
export declare const contractPosition: (options: {
    readonly invoicedToDate: Money.Money;
    readonly recognisedToDate: Money.Money;
}) => Effect.Effect<{
    readonly contractAsset: Money.Money;
    readonly contractLiability: Money.Money;
}, Money.CurrencyMismatch>;
/**
 * Journal for a recognition entry: debit contract liability (netted against invoicing), credit revenue.
 *
 * Invoice journals debit `trade-receivable` and credit `contract-liability`, so the
 * contract-liability balance is the net contract position.
 *
 * @since 0.1.0
 * @category journals
 */
export declare const recognitionJournal: (options: {
    readonly id: typeof JournalEntryId.Type;
    readonly obligation: PerformanceObligation;
    readonly entry: RecognitionEntry;
    readonly entryDigest: Sha256;
}) => Effect.Effect<JournalEntry, InvalidEntry>;
//# sourceMappingURL=Revenue.d.ts.map