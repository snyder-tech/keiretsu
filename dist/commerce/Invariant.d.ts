import { type Severity, type ValidationIssue } from '../core/Issue.ts';
/**
 * A named invariant over values of type `T`. `test` returns a message when violated.
 *
 * @since 0.1.0
 * @category models
 */
export interface Rule<T> {
    readonly code: string;
    readonly test: (value: T) => string | undefined;
}
/**
 * Declare a rule.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const rule: <T>(code: string, test: (value: T) => string | undefined) => Rule<T>;
/**
 * A Schema check for a rule. The failure message starts with the rule code.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const toCheck: <T>(invariant: Rule<T>) => import("effect/SchemaAST").Filter<T>;
/**
 * Run rules over a value and report violations as issues about `subject`.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const runRules: <T>(options: {
    readonly rules: ReadonlyArray<Rule<T>>;
    readonly value: T;
    readonly subject: string;
    readonly severity?: Severity;
}) => ReadonlyArray<ValidationIssue>;
/**
 * A finding about `subject` (argument order: code, subject, message, severity).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const fault: (code: string, subject: string, message: string, severity?: Severity) => ValidationIssue;
//# sourceMappingURL=Invariant.d.ts.map