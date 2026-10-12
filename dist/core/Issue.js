/**
 * Validation issues and reports. Every invariant in the keiretsu standard has a
 * stable `code`; conformance vectors and JSON Schema annotations refer to it.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export const Severity = Schema.Literals(['error', 'hold', 'warning']);
/**
 * One finding. `hold` blocks the dependent action until a human decision releases it.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ValidationIssue = Schema.Struct({
    code: Schema.String.check(Schema.isPattern(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)),
    severity: Severity,
    subject: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
    /** JSON Pointer (RFC 6901) into the subject record, when the issue concerns one member. */
    path: Schema.optional(Schema.String),
});
/** @since 0.1.0 @category constructors */
export const issue = (code, severity, subject, message) => ({ code, severity, subject, message });
/** @since 0.1.0 @category constructors */
export const report = (issues) => ({
    issues,
    errorCount: issues.filter((entry) => entry.severity === 'error').length,
    holdCount: issues.filter((entry) => entry.severity === 'hold').length,
});
//# sourceMappingURL=Issue.js.map