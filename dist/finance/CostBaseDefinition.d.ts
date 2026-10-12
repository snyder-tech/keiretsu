/**
 * The single, digested cost-base definition shared by costing and cost-plus pricing.
 *
 * A definition lists every cost component and how it is treated: marked up,
 * passed through at cost (OECD TPG 2.99–2.100, 7.34) or excluded. Costing
 * measures a period against a definition and cites its digest; every
 * cost-plus charge and true-up must cite the same digest. A component the
 * definition does not mention is held, never silently excluded.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { Sha256, type CanonicalJsonError } from '../core/CanonicalJson.ts';
import type { CurrencyTableShape, UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { Period } from '../core/Temporal.ts';
/**
 * Cost components. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostComponentKind: Schema.Union<readonly [Schema.Literals<readonly ["pay", "burden", "benefits", "overhead", "stock-compensation", "idle-time", "contractor", "cloud-ai", "tooling", "third-party-disbursement"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type CostComponentKind = typeof CostComponentKind.Type;
/**
 * How a component enters the base.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ComponentTreatment: Schema.Literals<readonly ["markup", "pass-through", "exclude"]>;
/** @since 0.1.0 @category models */
export type ComponentTreatment = typeof ComponentTreatment.Type;
/**
 * A versioned cost-base definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBaseDefinition: Schema.Struct<{
    readonly name: Schema.NonEmptyString;
    readonly components: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["pay", "burden", "benefits", "overhead", "stock-compensation", "idle-time", "contractor", "cloud-ai", "tooling", "third-party-disbursement"]>, Schema.String]>;
        readonly treatment: Schema.Literals<readonly ["markup", "pass-through", "exclude"]>;
    }>>;
    /** Which FX basis converts foreign-currency costs into the base currency (cites an FX policy). */
    readonly fxBasis: Schema.optional<Schema.NonEmptyString>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/RuleId">;
}>;
/** @since 0.1.0 @category models */
export type CostBaseDefinition = typeof CostBaseDefinition.Type;
/**
 * SHA-256 over the definition's canonical JSON.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const definitionDigest: (definition: CostBaseDefinition) => Effect.Effect<Sha256, CanonicalJsonError>;
/**
 * A component amount to be measured against a definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ComponentAmount: Schema.Struct<{
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["pay", "burden", "benefits", "overhead", "stock-compensation", "idle-time", "contractor", "cloud-ai", "tooling", "third-party-disbursement"]>, Schema.String]>;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type ComponentAmount = typeof ComponentAmount.Type;
/**
 * A period's cost base measured against one definition.
 *
 * `status: held` means at least one component could not be placed; amounts
 * then cover only the placed components and must not be billed.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostBaseMeasurement: Schema.Struct<{
    readonly definitionId: Schema.brand<Schema.String, "keiretsu/RuleId">;
    readonly definitionDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly basis: Schema.Literals<readonly ["actual", "standard"]>;
    readonly markupBase: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly passThrough: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly excluded: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly status: Schema.Literals<readonly ["complete", "held"]>;
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type CostBaseMeasurement = typeof CostBaseMeasurement.Type;
/**
 * Measure component amounts against a definition.
 *
 * Codes: `cost-base.unknown-component` (hold), `cost-base.currency` (error).
 *
 * @since 0.1.0
 * @category measurement
 */
export declare const measure: (options: {
    readonly definition: CostBaseDefinition;
    readonly period: Period;
    readonly basis: "actual" | "standard";
    readonly currency: Money.Money["currency"];
    readonly amounts: ReadonlyArray<ComponentAmount>;
}) => Effect.Effect<CostBaseMeasurement, CanonicalJsonError>;
/**
 * Cost-plus amount: `markupBase × (1 + markup) + passThrough`, rounded once.
 * A candidate for pricing; the markup's arm's-length support is a separate test.
 *
 * @since 0.1.0
 * @category math
 */
export declare const costPlusAmount: (options: {
    readonly measurement: CostBaseMeasurement;
    readonly markup: Decimal.Decimal;
    readonly table: CurrencyTableShape;
    readonly rounding: RoundingMode;
}) => Effect.Effect<Money.Money, UnknownCurrency>;
//# sourceMappingURL=CostBaseDefinition.d.ts.map