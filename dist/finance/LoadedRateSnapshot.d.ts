/**
 * Loaded hourly rates and the content-addressed snapshot a costing run uses.
 *
 * A loaded rate splits into pay, burden, benefits and (optionally) overhead.
 * The pay component carries a `wageKind` tag so a tax package can select
 * statutory wages (for example wages under IRC §3401 for the US research
 * credit) instead of loaded cost. Rates are effective-dated; versions for the
 * same subject never overlap, and a lookup with no rate in effect fails rather
 * than falling back.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type CanonicalJsonError, type Sha256 } from '../core/CanonicalJson.ts';
import { type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { type Money } from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { IsoDate } from '../core/Temporal.ts';
/**
 * Kind of wage the pay component represents.
 *
 * - `irc3401`: US wages for income-tax withholding (the §41 wage QRE basis)
 * - `contractor`: payments to non-employees
 * - `foreign-local-payroll`: wages under a non-US payroll
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WageKind: Schema.Union<readonly [Schema.Literals<readonly ["irc3401", "contractor", "foreign-local-payroll"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type WageKind = typeof WageKind.Type;
/**
 * Per-hour amounts by component, in the rate's currency (major units).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateComponents: Schema.Struct<{
    readonly pay: Schema.Struct<{
        readonly perHour: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly wageKind: Schema.Union<readonly [Schema.Literals<readonly ["irc3401", "contractor", "foreign-local-payroll"]>, Schema.String]>;
    }>;
    readonly burden: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly benefits: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly overhead: Schema.optional<Schema.brand<Schema.String, "keiretsu/Decimal">>;
}>;
/** @since 0.1.0 @category models */
export type RateComponents = typeof RateComponents.Type;
/**
 * Whom a rate applies to: a person or a role.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateSubject: Schema.TaggedUnion<{
    readonly role: Schema.TaggedStruct<"role", {
        readonly roleCode: Schema.NonEmptyString;
    }>;
    readonly person: Schema.TaggedStruct<"person", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type RateSubject = typeof RateSubject.Type;
/**
 * An effective-dated loaded rate.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LoadedRate: Schema.Struct<{
    readonly subject: Schema.TaggedUnion<{
        readonly role: Schema.TaggedStruct<"role", {
            readonly roleCode: Schema.NonEmptyString;
        }>;
        readonly person: Schema.TaggedStruct<"person", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        }>;
    }>;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly components: Schema.Struct<{
        readonly pay: Schema.Struct<{
            readonly perHour: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly wageKind: Schema.Union<readonly [Schema.Literals<readonly ["irc3401", "contractor", "foreign-local-payroll"]>, Schema.String]>;
        }>;
        readonly burden: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly benefits: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly overhead: Schema.optional<Schema.brand<Schema.String, "keiretsu/Decimal">>;
    }>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type LoadedRate = typeof LoadedRate.Type;
/**
 * Stable key of a rate subject.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const subjectKey: (subject: RateSubject) => string;
/**
 * Invariants of a rate set: one entity and currency, valid intervals, no overlapping versions per subject.
 *
 * Codes: `rate.interval`, `rate.single-entity`, `rate.single-currency`, `rate.overlap`.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const validateRates: (rates: ReadonlyArray<LoadedRate>) => ReadonlyArray<ValidationIssue>;
/**
 * A frozen set of loaded rates used by a costing run. Cost lines cite it by `{ id, digest }`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LoadedRateSnapshot: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/SnapshotId">;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly rates: Schema.NonEmptyArray<Schema.Struct<{
        readonly subject: Schema.TaggedUnion<{
            readonly role: Schema.TaggedStruct<"role", {
                readonly roleCode: Schema.NonEmptyString;
            }>;
            readonly person: Schema.TaggedStruct<"person", {
                readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            }>;
        }>;
        readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly components: Schema.Struct<{
            readonly pay: Schema.Struct<{
                readonly perHour: Schema.brand<Schema.String, "keiretsu/Decimal">;
                readonly wageKind: Schema.Union<readonly [Schema.Literals<readonly ["irc3401", "contractor", "foreign-local-payroll"]>, Schema.String]>;
            }>;
            readonly burden: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly benefits: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly overhead: Schema.optional<Schema.brand<Schema.String, "keiretsu/Decimal">>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    }>>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type LoadedRateSnapshot = typeof LoadedRateSnapshot.Type;
/**
 * SHA-256 over the RFC 8785 form of a snapshot.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const snapshotDigest: (snapshot: LoadedRateSnapshot) => Effect.Effect<Sha256, CanonicalJsonError>;
declare const NoRateInEffect_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "NoRateInEffect";
} & Readonly<A>;
/**
 * No rate version is in effect for the subject on the date.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NoRateInEffect extends NoRateInEffect_base<{
    readonly subject: string;
    readonly date: string;
}> {
}
/**
 * The single rate version in effect for a subject on a date.
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const resolveRate: (options: {
    readonly snapshot: LoadedRateSnapshot;
    readonly subject: RateSubject;
    readonly date: IsoDate;
}) => Effect.Effect<LoadedRate, NoRateInEffect>;
/**
 * Cost of minutes at a rate, by component. Each component is rounded once to minor units.
 *
 * @since 0.1.0
 * @category math
 */
export declare const componentCosts: (options: {
    readonly rate: LoadedRate;
    readonly minutes: number;
    readonly table: CurrencyTableShape;
    readonly rounding: RoundingMode;
}) => Effect.Effect<{
    readonly pay: Money;
    readonly burden: Money;
    readonly benefits: Money;
    readonly overhead: Money;
}, UnknownCurrency>;
export {};
//# sourceMappingURL=LoadedRateSnapshot.d.ts.map