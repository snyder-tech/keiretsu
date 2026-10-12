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
export declare const SystemKind: Schema.Union<readonly [Schema.Literals<readonly ["qbo", "xero", "tally", "netsuite", "d365", "plain-text-ledger", "hris", "payroll", "psa", "other"]>, Schema.String]>;
/**
 * A system of record as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SystemInput: Schema.Struct<{
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["qbo", "xero", "tally", "netsuite", "d365", "plain-text-ledger", "hris", "payroll", "psa", "other"]>, Schema.String]>;
    readonly tenantRef: Schema.optional<Schema.NonEmptyString>;
    readonly authority: Schema.Literals<readonly ["system-of-record", "mirror", "export-only"]>;
}>;
/** @since 0.1.0 @category models */
export type SystemInput = typeof SystemInput.Encoded;
/** @since 0.1.0 @category models */
export type SystemOfRecord = typeof SystemInput.Type & {
    readonly key: string;
};
//# sourceMappingURL=SystemOfRecord.d.ts.map