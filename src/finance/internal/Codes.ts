/**
 * Internal helpers shared by finance modules (not exported from the package).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import type { Money } from '../../core/Money.ts';
import { units } from '../../core/Money.ts';
import type { ValidationIssue } from '../../core/Issue.ts';

/**
 * `x-` extension codes that adopters may add to any open code list.
 *
 * @since 0.1.0
 * @category schemas
 */
export const XExtension = Schema.String.check(Schema.isPattern(/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/));

/**
 * An open code list: the standard literals plus `x-` extensions (wire tier stays open).
 *
 * @since 0.1.0
 * @category constructors
 */
export const extensible = <const L extends ReadonlyArray<string>>(literals: L) => Schema.Union([Schema.Literals(literals), XExtension]);

/**
 * Turn the first error issue from a validator into a schema filter message.
 *
 * @since 0.1.0
 * @category checks
 */
export const firstError = (issues: ReadonlyArray<ValidationIssue>): string | undefined => {
  const found = issues.find((entry) => entry.severity === 'error');
  return found === undefined ? undefined : `${found.code}: ${found.message}`;
};

/**
 * Decimal-place rendering of money in its minor units (e.g. `-1234.50`).
 *
 * @since 0.1.0
 * @category formatting
 */
export const formatMinor = (money: Money, digits: number): string => {
  const value = units(money);
  const negative = value < 0n;
  const magnitude = (negative ? -value : value).toString().padStart(digits + 1, '0');
  const whole = digits === 0 ? magnitude : magnitude.slice(0, magnitude.length - digits);
  const fraction = digits === 0 ? '' : `.${magnitude.slice(magnitude.length - digits)}`;
  return `${negative ? '-' : ''}${whole}${fraction}`;
};
