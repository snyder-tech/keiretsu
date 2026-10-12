/**
 * Legal entities: the companies an adopter declares, with effective-dated
 * legal name, functional currency, fiscal year, accounting basis, books system
 * and lifecycle.
 *
 * Functional currency is a declaration (ASC 830-10-45, IAS 21.9–14); its
 * determination against the indicators belongs to the adopter. Fiscal years
 * include 52–53-week years (IRC §441(f)).
 *
 * @since 0.1.0
 * @module
 */
import { Situs } from '../core/Country.ts';
import { CurrencyCode } from '../core/Currency.ts';
import { EntityId } from '../core/Ids.ts';
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';
import { Identifier } from './Identifier.ts';
import { type Timeline } from './Timeline.ts';
/** @since 0.1.0 @category schemas */
export declare const Month: Schema.Number;
/**
 * Fiscal year rule: a month end, or a 52–53-week year ending on a weekday that is the
 * `last` in, or `nearest` to the end of, `month`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FiscalYear: Schema.TaggedUnion<{
    readonly "month-end": Schema.TaggedStruct<"month-end", {
        readonly endMonth: Schema.Number;
    }>;
    readonly "52-53-week": Schema.TaggedStruct<"52-53-week", {
        readonly endWeekday: Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>;
        readonly rule: Schema.Literals<readonly ["last", "nearest"]>;
        readonly month: Schema.Number;
    }>;
}>;
/** @since 0.1.0 @category models */
export type FiscalYear = typeof FiscalYear.Type;
/** @since 0.1.0 @category schemas */
export declare const AccountingBasis: Schema.Struct<{
    readonly framework: Schema.Literals<readonly ["us-gaap", "ifrs", "ind-as", "pk-ifrs", "tax-basis", "other"]>;
    readonly method: Schema.Literals<readonly ["accrual", "cash", "modified-cash"]>;
}>;
/** @since 0.1.0 @category models */
export type AccountingBasis = typeof AccountingBasis.Type;
/** @since 0.1.0 @category schemas */
export declare const Lifecycle: Schema.Literals<readonly ["forming", "active", "dormant", "dissolved"]>;
/** @since 0.1.0 @category models */
export type Lifecycle = typeof Lifecycle.Type;
/**
 * ISO 20275 Entity Legal Form code.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ElfCode: Schema.String;
/**
 * A legal entity as authored in config. Timeline fields accept a bare value that spans the lifecycle.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LegalEntityInput: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly formerKeys: Schema.optional<Schema.$Array<Schema.NonEmptyString>>;
    readonly legalName: Schema.Union<readonly [Schema.NonEmptyString, Schema.NonEmptyArray<Schema.Struct<{
        readonly value: Schema.NonEmptyString;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>]>;
    readonly legalForm: Schema.optional<Schema.String>;
    readonly jurisdiction: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly identifiers: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly scheme: Schema.String;
        readonly value: Schema.NonEmptyString;
    }>>>;
    readonly functionalCurrency: Schema.Union<readonly [Schema.brand<Schema.String, "keiretsu/CurrencyCode">, Schema.NonEmptyArray<Schema.Struct<{
        readonly value: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>]>;
    readonly reportingCurrency: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
    readonly fiscalYear: Schema.Union<readonly [Schema.TaggedUnion<{
        readonly "month-end": Schema.TaggedStruct<"month-end", {
            readonly endMonth: Schema.Number;
        }>;
        readonly "52-53-week": Schema.TaggedStruct<"52-53-week", {
            readonly endWeekday: Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>;
            readonly rule: Schema.Literals<readonly ["last", "nearest"]>;
            readonly month: Schema.Number;
        }>;
    }>, Schema.NonEmptyArray<Schema.Struct<{
        readonly value: Schema.TaggedUnion<{
            readonly "month-end": Schema.TaggedStruct<"month-end", {
                readonly endMonth: Schema.Number;
            }>;
            readonly "52-53-week": Schema.TaggedStruct<"52-53-week", {
                readonly endWeekday: Schema.Literals<readonly ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]>;
                readonly rule: Schema.Literals<readonly ["last", "nearest"]>;
                readonly month: Schema.Number;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>]>;
    readonly accountingBasis: Schema.Union<readonly [Schema.Struct<{
        readonly framework: Schema.Literals<readonly ["us-gaap", "ifrs", "ind-as", "pk-ifrs", "tax-basis", "other"]>;
        readonly method: Schema.Literals<readonly ["accrual", "cash", "modified-cash"]>;
    }>, Schema.NonEmptyArray<Schema.Struct<{
        readonly value: Schema.Struct<{
            readonly framework: Schema.Literals<readonly ["us-gaap", "ifrs", "ind-as", "pk-ifrs", "tax-basis", "other"]>;
            readonly method: Schema.Literals<readonly ["accrual", "cash", "modified-cash"]>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>]>;
    readonly booksSystem: Schema.optional<Schema.Union<readonly [Schema.NonEmptyString, Schema.NonEmptyArray<Schema.Struct<{
        readonly value: Schema.NonEmptyString;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>]>>;
    readonly lifecycle: Schema.NonEmptyArray<Schema.Struct<{
        readonly value: Schema.Literals<readonly ["forming", "active", "dormant", "dissolved"]>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>>;
    }>>;
    readonly workCalendar: Schema.optional<Schema.NonEmptyString>;
    readonly evidence: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>>;
}>;
/** @since 0.1.0 @category models */
export type LegalEntityInput = typeof LegalEntityInput.Encoded;
/**
 * A normalized legal entity.
 *
 * @since 0.1.0
 * @category models
 */
export interface LegalEntity {
    readonly key: string;
    readonly id: EntityId;
    readonly formerKeys: ReadonlyArray<string>;
    readonly legalName: Timeline<string>;
    readonly legalForm?: string | undefined;
    readonly jurisdiction: Situs;
    readonly identifiers: ReadonlyArray<Identifier>;
    readonly functionalCurrency: Timeline<CurrencyCode>;
    readonly reportingCurrency?: CurrencyCode | undefined;
    readonly fiscalYear: Timeline<FiscalYear>;
    readonly accountingBasis: Timeline<AccountingBasis>;
    readonly booksSystem?: Timeline<string> | undefined;
    readonly lifecycle: Timeline<Lifecycle>;
    readonly workCalendar?: string | undefined;
}
/**
 * The last day of the fiscal year that ends in calendar `year` under `rule`.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const fiscalYearEnd: (rule: FiscalYear, year: number) => IsoDate;
//# sourceMappingURL=LegalEntity.d.ts.map