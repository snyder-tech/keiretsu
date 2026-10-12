/**
 * Validation issues and reports. Every invariant in the keiretsu standard has a
 * stable `code`; conformance vectors and JSON Schema annotations refer to it.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const Severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
/** @since 0.1.0 @category models */
export type Severity = typeof Severity.Type;
/**
 * One finding. `hold` blocks the dependent action until a human decision releases it.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ValidationIssue: Schema.Struct<{
    readonly code: Schema.String;
    readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
    readonly subject: Schema.NonEmptyString;
    readonly message: Schema.NonEmptyString;
    /** JSON Pointer (RFC 6901) into the subject record, when the issue concerns one member. */
    readonly path: Schema.optional<Schema.String>;
}>;
/** @since 0.1.0 @category models */
export type ValidationIssue = typeof ValidationIssue.Type;
/** @since 0.1.0 @category models */
export interface ValidationReport {
    readonly issues: ReadonlyArray<ValidationIssue>;
    readonly errorCount: number;
    readonly holdCount: number;
}
/** @since 0.1.0 @category constructors */
export declare const issue: (code: string, severity: Severity, subject: string, message: string) => ValidationIssue;
/** @since 0.1.0 @category constructors */
export declare const report: (issues: ReadonlyArray<ValidationIssue>) => ValidationReport;
//# sourceMappingURL=Issue.d.ts.map