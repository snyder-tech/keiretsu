/**
 * Intercompany mirrors and eliminations.
 *
 * One intercompany fact projects to the issuer's receivable/income entry and
 * the recipient's payable/cost entry; both cite the fact's digest, so the two
 * books agree by construction. {@link eliminate} removes intercompany income
 * and cost in the presentation currency. Each side is translated from its own
 * functional amount; the difference is real FX and appears on an explicit
 * `fx-difference-elimination` line — it is never absorbed into another line.
 * Markup that the payer capitalised is unrealised profit: it is flagged as a
 * candidate, not booked.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { Sha256, type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import { DerivationId, EntityId, type JournalEntryId } from '../core/Ids.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { IsoDate } from '../core/Temporal.ts';
import { type InvalidEntry, type JournalEntry } from './Journal.ts';
/** @since 0.1.0 @category schemas */
export declare const IntercompanyFactId: Schema.brand<Schema.String, "keiretsu/IntercompanyFactId">;
/**
 * A single intercompany fact: what the issuer charged the recipient, in the
 * transaction currency and in each party's functional currency as booked.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IntercompanyFact: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/IntercompanyFactId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly recipient: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly flow: Schema.Literals<readonly ["services", "royalty"]>;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly issuerFunctional: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly recipientFunctional: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly chargeIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
    readonly documentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
    /** Revenue-recognition derivation supporting the issuer's income. */
    readonly recognitionRef: Schema.Struct<{
        readonly derivationId: Schema.brand<Schema.String, "keiretsu/DerivationId">;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    /** Portion the recipient capitalised (in its functional currency) and the markup it carries. */
    readonly payerCapitalisation: Schema.optional<Schema.Struct<{
        readonly capitalised: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly markup: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type IntercompanyFact = typeof IntercompanyFact.Type;
/**
 * The fact plus both projected entries, sharing the fact digest.
 *
 * @since 0.1.0
 * @category models
 */
export interface IntercompanyMirror {
    readonly fact: IntercompanyFact;
    readonly factDigest: Sha256;
    readonly issuerEntry: JournalEntry;
    readonly recipientEntry: JournalEntry;
}
/**
 * Project a fact into both books.
 *
 * @since 0.1.0
 * @category mirrors
 */
export declare const mirror: (options: {
    readonly fact: IntercompanyFact;
    readonly derivationId: typeof DerivationId.Type;
    readonly ids: {
        readonly issuerEntryId: typeof JournalEntryId.Type;
        readonly recipientEntryId: typeof JournalEntryId.Type;
    };
}) => Effect.Effect<IntercompanyMirror, CanonicalJsonError | InvalidEntry>;
/**
 * Presentation-currency rates from an FX snapshot (supplied by the FX package):
 * presentation units per one unit of `from`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PresentationFx: Schema.Struct<{
    readonly presentationCurrency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly snapshots: Schema.$Array<Schema.Struct<{
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly clauseDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly purpose: Schema.NonEmptyString;
        readonly requestedDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly pivot: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
        readonly legs: Schema.NonEmptyArray<Schema.Struct<{
            readonly source: Schema.Literals<readonly ["observation", "period-average", "fixed"]>;
            readonly series: Schema.optional<Schema.brand<Schema.String, "keiretsu/FxSeriesId">>;
            readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly unit: Schema.Number;
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly orientation: Schema.Literals<readonly ["multiply", "divide"]>;
            readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly status: Schema.Literals<readonly ["final", "provisional"]>;
            readonly revisions: Schema.$Array<Schema.Number>;
            readonly observationDigests: Schema.$Array<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly status: Schema.Literals<readonly ["final", "provisional"]>;
        readonly fallbackApplied: Schema.Boolean;
        readonly fallbackReason: Schema.optional<Schema.Literals<readonly ["non-publication-day", "not-observed", "outside-calendar"]>>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly observationSetDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type PresentationFx = typeof PresentationFx.Type;
/**
 * Per-fact elimination amounts in the presentation currency.
 *
 * @since 0.1.0
 * @category models
 */
export interface EliminationDifference {
    readonly factId: IntercompanyFact['id'];
    readonly incomeSide: Money.Money;
    readonly costSide: Money.Money;
    /** `incomeSide − costSide`. Shown on its own line; never absorbed. */
    readonly fxDifference: Money.Money;
}
/**
 * Elimination output.
 *
 * @since 0.1.0
 * @category models
 */
export interface EliminationResult {
    readonly entries: ReadonlyArray<JournalEntry>;
    readonly differences: ReadonlyArray<EliminationDifference>;
    /** Candidate unrealised profit in the payer's capitalised cost (recipient functional currency). Not booked. */
    readonly unrealisedProfit: ReadonlyArray<{
        readonly factId: IntercompanyFact['id'];
        readonly candidate: Money.Money;
    }>;
    readonly issues: ReadonlyArray<ValidationIssue>;
}
declare const RateMissing_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "RateMissing";
} & Readonly<A>;
/**
 * Translation needed a rate the snapshot does not have.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class RateMissing extends RateMissing_base<{
    readonly from: string;
}> {
}
/**
 * Eliminate intercompany income against cost for a consolidation entity.
 *
 * Codes: `elimination.fx-missing` (hold; that fact is left uneliminated), `elimination.unrealised-profit` (hold),
 * `elimination.fx-difference` (warning, whenever the difference is non-zero).
 *
 * @since 0.1.0
 * @category eliminations
 */
export declare const eliminate: (options: {
    readonly mirrors: ReadonlyArray<IntercompanyMirror>;
    readonly entryId: (fact: IntercompanyFact) => typeof JournalEntryId.Type;
    readonly presentationFx: PresentationFx;
    readonly consolidation: {
        readonly entityId: typeof EntityId.Type;
        readonly date: IsoDate;
        readonly derivationId: typeof DerivationId.Type;
    };
    readonly money: {
        readonly table: CurrencyTableShape;
        readonly rounding: RoundingMode;
    };
}) => Effect.Effect<EliminationResult, UnknownCurrency | InvalidEntry | CanonicalJsonError>;
export {};
//# sourceMappingURL=IntercompanyMirror.d.ts.map