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
import { FxSeries, PublicationCalendar } from "./FxSeries.js";
/**
 * A versioned bundle of series and calendars.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SeriesPack = Schema.Struct({
    packId: Schema.NonEmptyString,
    version: Schema.String.check(Schema.isPattern(/^\d+\.\d+\.\d+$/)),
    series: Schema.Array(FxSeries),
    calendars: Schema.Array(PublicationCalendar),
});
const weekdaysOnly = (id, title, url) => ({
    id,
    closedWeekdays: ['sat', 'sun'],
    closures: [],
    verification: 'needs-verification',
    citation: { title, url },
});
const series = (fields) => ({
    id: fields.id,
    publisher: fields.publisher,
    measure: fields.measure,
    base: fields.base,
    quote: fields.quote,
    unit: 1,
    publishedDecimals: 4,
    calendar: fields.calendar,
    publicationLagDays: fields.lag,
    verification: 'needs-verification',
    citation: fields.citation,
});
/**
 * Definitions for FBIL USD/INR, SBP USD/PKR (weighted average), ECB EUR
 * reference, Federal Reserve H.10 and Bank of England spot series.
 *
 * @since 0.1.0
 * @category data
 */
export const SamplePack = Schema.decodeUnknownSync(SeriesPack)({
    packId: 'keiretsu-fx-sample',
    version: '0.1.0',
    calendars: [
        weekdaysOnly('fbil-mumbai', 'FBIL reference rate publication days (Mumbai)', 'https://www.fbil.org.in/'),
        weekdaysOnly('sbp-karachi', 'State Bank of Pakistan business days', 'https://www.sbp.org.pk/'),
        weekdaysOnly('ecb-target', 'ECB euro reference rate days (TARGET calendar)', 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'),
        weekdaysOnly('frb-new-york', 'Federal Reserve H.10 noon buying rate days (New York)', 'https://www.federalreserve.gov/releases/h10/'),
        weekdaysOnly('boe-london', 'Bank of England database publication days (London)', 'https://www.bankofengland.co.uk/boeapps/database/'),
    ],
    series: [
        series({
            id: 'fbil-reference-usd-inr',
            publisher: 'fbil',
            measure: 'reference',
            base: 'USD',
            quote: 'INR',
            calendar: 'fbil-mumbai',
            lag: 0,
            citation: { title: 'FBIL reference rate, USD/INR', url: 'https://www.fbil.org.in/' },
        }),
        series({
            id: 'sbp-weighted-average-usd-pkr',
            publisher: 'sbp',
            measure: 'weighted-average',
            base: 'USD',
            quote: 'PKR',
            calendar: 'sbp-karachi',
            lag: 1,
            citation: { title: 'SBP weighted average customer exchange rate, USD/PKR', url: 'https://www.sbp.org.pk/ecodata/index2.asp' },
        }),
        series({
            id: 'ecb-reference-eur-usd',
            publisher: 'ecb',
            measure: 'reference',
            base: 'EUR',
            quote: 'USD',
            calendar: 'ecb-target',
            lag: 0,
            citation: { title: 'ECB euro foreign exchange reference rate, USD per EUR', url: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html' },
        }),
        series({
            id: 'frb-h10-noon-buying-usd-inr',
            publisher: 'frb-h10',
            measure: 'noon-buying',
            base: 'USD',
            quote: 'INR',
            calendar: 'frb-new-york',
            lag: 7,
            citation: { title: 'Federal Reserve H.10, Indian rupee per US dollar', url: 'https://www.federalreserve.gov/releases/h10/' },
        }),
        series({
            id: 'frb-h10-noon-buying-eur-usd',
            publisher: 'frb-h10',
            measure: 'noon-buying',
            base: 'EUR',
            quote: 'USD',
            calendar: 'frb-new-york',
            lag: 7,
            citation: { title: 'Federal Reserve H.10, US dollar per euro', url: 'https://www.federalreserve.gov/releases/h10/' },
        }),
        series({
            id: 'boe-spot-gbp-usd',
            publisher: 'boe',
            measure: 'spot',
            base: 'GBP',
            quote: 'USD',
            calendar: 'boe-london',
            lag: 1,
            citation: { title: 'Bank of England spot exchange rate, US dollar into sterling', url: 'https://www.bankofengland.co.uk/boeapps/database/' },
        }),
    ],
});
//# sourceMappingURL=SamplePack.js.map