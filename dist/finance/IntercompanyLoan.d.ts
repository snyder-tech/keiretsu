/**
 * Intercompany loans: daily interest accrual and safe-harbour flags.
 *
 * Interest accrues on the end-of-day balance at the rate in effect, using the
 * facility's day-count convention, summed exactly and rounded once. Floating
 * rates need a rate reset on or before each accrual day; without one the
 * accrual fails rather than guessing. Safe-harbour bands (e.g. 100–130% of
 * the US applicable federal rate, Treas. Reg. §1.482-2(a)(2)(iii)(B)) produce
 * flags only.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { IsoDate } from '../core/Temporal.ts';
/** @since 0.1.0 @category schemas */
export declare const LoanId: Schema.brand<Schema.String, "keiretsu/IntercompanyLoanId">;
/**
 * Day-count convention. `30/360` is the US (bond basis) variant.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DayCount: Schema.Literals<readonly ["act/365f", "act/360", "30/360"]>;
/** @since 0.1.0 @category models */
export type DayCount = typeof DayCount.Type;
/**
 * Loan facility.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const IntercompanyLoan: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/IntercompanyLoanId">;
    readonly lender: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly borrower: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly agreementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AgreementId">>;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly limit: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly rate: Schema.TaggedUnion<{
        readonly fixed: Schema.TaggedStruct<"fixed", {
            readonly annualRate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        }>;
        readonly floating: Schema.TaggedStruct<"floating", {
            readonly index: Schema.NonEmptyString;
            readonly spread: Schema.brand<Schema.String, "keiretsu/Decimal">;
        }>;
    }>;
    readonly dayCount: Schema.Literals<readonly ["act/365f", "act/360", "30/360"]>;
    readonly startDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly maturity: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly subordinated: Schema.Boolean;
}>;
/** @since 0.1.0 @category models */
export type IntercompanyLoan = typeof IntercompanyLoan.Type;
/**
 * Loan event. A floating-rate reset carries the index fixing; the spread is added.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LoanEvent: Schema.TaggedUnion<{
    readonly advance: Schema.TaggedStruct<"advance", {
        readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
    }>;
    readonly repayment: Schema.TaggedStruct<"repayment", {
        readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
    }>;
    readonly "rate-reset": Schema.TaggedStruct<"rate-reset", {
        readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly indexRate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type LoanEvent = typeof LoanEvent.Type;
declare const LoanRateMissing_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "LoanRateMissing";
} & Readonly<A>;
/**
 * No rate is in effect on an accrual day.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class LoanRateMissing extends LoanRateMissing_base<{
    readonly date: string;
}> {
}
/**
 * Days between two dates under a convention (`from` inclusive, `to` exclusive).
 *
 * @since 0.1.0
 * @category math
 */
export declare const daysBetween: (from: string, to: string, convention: DayCount) => number;
/**
 * One accrual segment (constant balance and rate).
 *
 * @since 0.1.0
 * @category models
 */
export interface AccrualSegment {
    readonly from: string;
    readonly to: string;
    readonly days: number;
    readonly balance: Money.Money;
    readonly annualRate: Decimal.Decimal;
}
/**
 * Accrual result.
 *
 * @since 0.1.0
 * @category models
 */
export interface Accrual {
    readonly interest: Money.Money;
    readonly segments: ReadonlyArray<AccrualSegment>;
    readonly issues: ReadonlyArray<ValidationIssue>;
}
/**
 * Accrue interest over `[from, to)`.
 *
 * Issue codes: `loan.over-limit` (warning), `loan.negative-balance` (error), `loan.event-currency` (error).
 *
 * @since 0.1.0
 * @category accrual
 */
export declare const accrueInterest: (options: {
    readonly loan: IntercompanyLoan;
    readonly events: ReadonlyArray<LoanEvent>;
    readonly period: {
        readonly from: IsoDate;
        readonly to: IsoDate;
    };
    readonly money: {
        readonly table: CurrencyTableShape;
        readonly rounding: RoundingMode;
    };
}) => Effect.Effect<Accrual, LoanRateMissing | UnknownCurrency>;
/**
 * A safe-harbour rate band from a cited, versioned data pack.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SafeHarbourBand: Schema.Struct<{
    readonly low: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly high: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly citation: Schema.NonEmptyString;
    readonly status: Schema.Literals<readonly ["needs-verification", "verified"]>;
}>;
/** @since 0.1.0 @category models */
export type SafeHarbourBand = typeof SafeHarbourBand.Type;
/**
 * The 100–130% of AFR band for a given AFR (status `needs-verification`).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const afrBand: (afr: Decimal.Decimal) => SafeHarbourBand;
/**
 * Flag a rate outside a band. Code: `loan.outside-safe-harbour` (warning).
 *
 * @since 0.1.0
 * @category checks
 */
export declare const safeHarbourCheck: (rate: Decimal.Decimal, band: SafeHarbourBand) => ReadonlyArray<ValidationIssue>;
export {};
//# sourceMappingURL=IntercompanyLoan.d.ts.map