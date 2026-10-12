/**
 * Invariants keyed by issue code.
 *
 * Every rule in this package has a stable code (`route.legs-not-chained`,
 * `charge.credit-without-target` …). The same rule backs a decode-time Schema
 * check (message prefixed with the code) and a validator that returns
 * {@link ValidationIssue}s, so conformance vectors and JSON Schema annotations
 * can cite one catalogue.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { issue, type Severity, type ValidationIssue } from '../core/Issue.ts';

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
export const rule = <T>(code: string, test: (value: T) => string | undefined): Rule<T> => ({ code, test });

/**
 * A Schema check for a rule. The failure message starts with the rule code.
 *
 * @since 0.1.0
 * @category checks
 */
export const toCheck = <T>(invariant: Rule<T>) =>
  Schema.makeFilter<T>((value) => {
    const message = invariant.test(value);
    return message === undefined ? undefined : `${invariant.code}: ${message}`;
  });

/**
 * Run rules over a value and report violations as issues about `subject`.
 *
 * @since 0.1.0
 * @category validators
 */
export const runRules = <T>(options: {
  readonly rules: ReadonlyArray<Rule<T>>;
  readonly value: T;
  readonly subject: string;
  readonly severity?: Severity;
}): ReadonlyArray<ValidationIssue> =>
  options.rules.flatMap((invariant) => {
    const message = invariant.test(options.value);
    return message === undefined ? [] : [issue(invariant.code, options.severity ?? 'error', options.subject, message)];
  });

/**
 * A finding about `subject` (argument order: code, subject, message, severity).
 *
 * @since 0.1.0
 * @category constructors
 */
export const fault = (code: string, subject: string, message: string, severity: Severity = 'error'): ValidationIssue => issue(code, severity, subject, message);
