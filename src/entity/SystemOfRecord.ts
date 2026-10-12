/**
 * Systems of record: references to the books, HR and work systems an adopter
 * uses. Only references are kept; `tenantRef` names where a tenant id or
 * secret lives (for example a vault secret name), never the secret itself.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

/**
 * System kinds; `x-` extensions are accepted.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SystemKind = Schema.Union([
  Schema.Literals(['qbo', 'xero', 'tally', 'netsuite', 'd365', 'plain-text-ledger', 'hris', 'payroll', 'psa', 'other']),
  Schema.String.check(Schema.isPattern(/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/)),
]);

/**
 * A system of record as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SystemInput = Schema.Struct({
  kind: SystemKind,
  tenantRef: Schema.optional(Schema.NonEmptyString),
  authority: Schema.Literals(['system-of-record', 'mirror', 'export-only']),
});
/** @since 0.1.0 @category models */
export type SystemInput = typeof SystemInput.Encoded;
/** @since 0.1.0 @category models */
export type SystemOfRecord = typeof SystemInput.Type & { readonly key: string };
