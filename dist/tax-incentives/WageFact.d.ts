/**
 * Port: a payroll-register wage fact. Supplied by the adopter's payroll source
 * through `@snyder-tech/keiretsu/finance`. Regime cost bases are built from
 * these facts, never from loaded cost rates.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * Known wage kinds. `loaded-rate` exists so that a loaded cost arriving by
 * mistake is named and excluded rather than silently summed.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const KnownWageKind: Schema.Literals<readonly ["us-3401-box1", "statutory", "bonus", "benefits", "employer-tax", "overhead", "contractor-payment", "foreign-local-payroll", "loaded-rate"]>;
/** @since 0.1.0 @category models */
export type KnownWageKind = typeof KnownWageKind.Type;
/**
 * Wage kind on the wire: a known kind or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WageKind: Schema.Union<readonly [Schema.Literals<readonly ["us-3401-box1", "statutory", "bonus", "benefits", "employer-tax", "overhead", "contractor-payment", "foreign-local-payroll", "loaded-rate"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type WageKind = typeof WageKind.Type;
/**
 * Wage fact port.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WageFact: Schema.Struct<{
    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    /** Legal payer of the wages (the employer of record for the period). */
    readonly payer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly wageKind: Schema.Union<readonly [Schema.Literals<readonly ["us-3401-box1", "statutory", "bonus", "benefits", "employer-tax", "overhead", "contractor-payment", "foreign-local-payroll", "loaded-rate"]>, Schema.String]>;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type WageFact = typeof WageFact.Type;
/**
 * Stable reference text for a wage fact (used in derivation inputs).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const refOf: (fact: WageFact) => string;
//# sourceMappingURL=WageFact.d.ts.map