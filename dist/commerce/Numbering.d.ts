/**
 * Document numbering per (entity, series, fiscal year).
 *
 * Allocation is a pure step over an immutable {@link NumberLedger}: the next
 * number is always last + 1, so sequences are monotonic and gapless, and a
 * cancelled number is retained, never reused. Formats are templates with
 * `{SERIES}`, `{FY}` and `{SEQ:n}` tokens and an optional maximum length
 * (India CGST Rule 46(b): at most 16 characters, unique per fiscal year).
 * {@link InvoiceNumberAllocator} is the service port for a persistent store.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Schema } from 'effect';
import type { ValidationIssue } from '../core/Issue.ts';
/**
 * An allocated document number.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DocumentNumber: Schema.Struct<{
    readonly series: Schema.String;
    readonly fiscalYear: Schema.String;
    readonly sequence: Schema.Number;
    readonly text: Schema.NonEmptyString;
}>;
/** @since 0.1.0 @category models */
export type DocumentNumber = typeof DocumentNumber.Type;
/**
 * A numbering series declared by the issuing entity.
 *
 * @since 0.1.0
 * @category models
 */
export interface NumberingSeries {
    readonly entityId: string;
    readonly series: string;
    /** Month (1–12) in which the entity's fiscal year ends. */
    readonly fiscalYearEndMonth: number;
    readonly template: string;
    readonly maxLength?: number;
}
/**
 * Last allocated sequence per `entity|series|fiscalYear`.
 *
 * @since 0.1.0
 * @category models
 */
export interface NumberLedger {
    readonly last: ReadonlyMap<string, number>;
}
/**
 * A ledger with nothing allocated.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const emptyLedger: NumberLedger;
declare const NumberingError_base: Schema.Class<NumberingError, Schema.TaggedStruct<"NumberingError", {
    readonly code: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A number could not be allocated.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NumberingError extends NumberingError_base {
}
/**
 * Fiscal-year label of a date: `2026` for calendar years, else `2026-27` (start year, end year's last two digits).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const fiscalYearLabel: (options: {
    readonly date: string;
    readonly fiscalYearEndMonth: number;
}) => string;
/**
 * Render a template.
 *
 * @since 0.1.0
 * @category formatting
 */
export declare const formatNumber: (template: string, parts: {
    readonly series: string;
    readonly fiscalYear: string;
    readonly sequence: number;
}) => string;
/**
 * Allocate the next number. Pure: returns the number and the new ledger.
 *
 * @since 0.1.0
 * @category allocation
 */
export declare const allocateNumber: (ledger: NumberLedger, request: {
    readonly series: NumberingSeries;
    readonly issueDate: string;
}) => Effect.Effect<{
    readonly number: DocumentNumber;
    readonly ledger: NumberLedger;
}, NumberingError>;
/**
 * Check issued numbers: unique text per issuer and, per (issuer, series, fiscal year), sequences 1..n without gaps.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateNumbering: (documents: ReadonlyArray<{
    readonly id: string;
    readonly issuerKey: string;
    readonly number: DocumentNumber;
}>) => ReadonlyArray<ValidationIssue>;
declare const InvoiceNumberAllocator_base: Context.ServiceClass<InvoiceNumberAllocator, "@snyder-tech/keiretsu/commerce/InvoiceNumberAllocator", {
    readonly allocate: (request: {
        readonly series: NumberingSeries;
        readonly issueDate: string;
    }) => Effect.Effect<DocumentNumber, NumberingError>;
}>;
/**
 * Service port for number allocation backed by a persistent store.
 *
 * @since 0.1.0
 * @category services
 */
export declare class InvoiceNumberAllocator extends InvoiceNumberAllocator_base {
    /**
     * An in-memory allocator for tests and dry runs. Read, allocate and write run under the ref's
     * lock, so concurrent fibers never receive the same number.
     */
    static readonly inMemory: Layer.Layer<InvoiceNumberAllocator>;
}
export {};
//# sourceMappingURL=Numbering.d.ts.map