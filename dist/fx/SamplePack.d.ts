/**
 * Sample data pack: series and calendar **definitions** for common publishers.
 *
 * Every entry is `needs-verification`: confirm measure, quotation direction,
 * decimals, publication time and lag against the publisher's primary material
 * before relying on it. Calendars ship with closed weekdays only and no dated
 * holiday closures; production use needs a maintained calendar with
 * `maintainedThrough` set. The pack contains no rate values.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * A versioned bundle of series and calendars.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SeriesPack: Schema.Struct<{
    readonly packId: Schema.NonEmptyString;
    readonly version: Schema.String;
    readonly series: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/FxSeriesId">;
        readonly publisher: Schema.String;
        readonly measure: Schema.String;
        readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly unit: Schema.Number;
        readonly publishedDecimals: Schema.Number;
        readonly calendar: Schema.brand<Schema.String, "keiretsu/FxCalendarId">;
        readonly publicationLagDays: Schema.Number;
        readonly verification: Schema.Literals<readonly ["needs-verification", "verified"]>;
        readonly citation: Schema.Struct<{
            readonly title: Schema.NonEmptyString;
            readonly url: Schema.optional<Schema.String>;
        }>;
    }>>;
    readonly calendars: Schema.$Array<Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/FxCalendarId">;
        readonly closedWeekdays: Schema.$Array<Schema.Literals<readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>>;
        readonly closures: Schema.$Array<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly maintainedThrough: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly verification: Schema.Literals<readonly ["needs-verification", "verified"]>;
        readonly citation: Schema.Struct<{
            readonly title: Schema.NonEmptyString;
            readonly url: Schema.optional<Schema.String>;
        }>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type SeriesPack = typeof SeriesPack.Type;
/**
 * Definitions for FBIL USD/INR, SBP USD/PKR (weighted average), ECB EUR
 * reference, Federal Reserve H.10 and Bank of England spot series.
 *
 * @since 0.1.0
 * @category data
 */
export declare const SamplePack: SeriesPack;
//# sourceMappingURL=SamplePack.d.ts.map