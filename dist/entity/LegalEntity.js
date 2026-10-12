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
import { Situs } from "../core/Country.js";
import { CurrencyCode } from "../core/Currency.js";
import { EvidenceRef } from "../core/Envelope.js";
import { EntityId } from "../core/Ids.js";
import { IsoDate } from "../core/Temporal.js";
import { Schema } from 'effect';
import { Identifier } from "./Identifier.js";
import { Segment, TimelineInput } from "./Timeline.js";
import { addDays, Weekday, weekdayOf, WEEKDAYS } from "./WorkCalendar.js";
/** @since 0.1.0 @category schemas */
export const Month = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 12 }));
/**
 * Fiscal year rule: a month end, or a 52–53-week year ending on a weekday that is the
 * `last` in, or `nearest` to the end of, `month`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FiscalYear = Schema.TaggedUnion({
    'month-end': { endMonth: Month },
    '52-53-week': { endWeekday: Weekday, rule: Schema.Literals(['last', 'nearest']), month: Month },
});
/** @since 0.1.0 @category schemas */
export const AccountingBasis = Schema.Struct({
    framework: Schema.Literals(['us-gaap', 'ifrs', 'ind-as', 'pk-ifrs', 'tax-basis', 'other']),
    method: Schema.Literals(['accrual', 'cash', 'modified-cash']),
});
/** @since 0.1.0 @category schemas */
export const Lifecycle = Schema.Literals(['forming', 'active', 'dormant', 'dissolved']);
/**
 * ISO 20275 Entity Legal Form code.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ElfCode = Schema.String.check(Schema.isPattern(/^[A-Z0-9]{4}$/));
/**
 * A legal entity as authored in config. Timeline fields accept a bare value that spans the lifecycle.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LegalEntityInput = Schema.Struct({
    id: EntityId,
    formerKeys: Schema.optional(Schema.Array(Schema.NonEmptyString)),
    legalName: TimelineInput(Schema.NonEmptyString),
    legalForm: Schema.optional(ElfCode),
    jurisdiction: Situs,
    identifiers: Schema.optional(Schema.Array(Identifier)),
    functionalCurrency: TimelineInput(CurrencyCode),
    reportingCurrency: Schema.optional(CurrencyCode),
    fiscalYear: TimelineInput(FiscalYear),
    accountingBasis: TimelineInput(AccountingBasis),
    booksSystem: Schema.optional(TimelineInput(Schema.NonEmptyString)),
    lifecycle: Schema.NonEmptyArray(Segment(Lifecycle)),
    workCalendar: Schema.optional(Schema.NonEmptyString),
    evidence: Schema.optional(Schema.Array(EvidenceRef)),
});
const lastDayOfMonth = (year, month) => Schema.decodeSync(IsoDate)(new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10));
const weekdayDistance = (from, to) => (WEEKDAYS.indexOf(from) - WEEKDAYS.indexOf(to) + 7) % 7;
/**
 * The last day of the fiscal year that ends in calendar `year` under `rule`.
 *
 * @since 0.1.0
 * @category accessors
 */
export const fiscalYearEnd = (rule, year) => FiscalYear.match(rule, {
    'month-end': (monthEnd) => lastDayOfMonth(year, monthEnd.endMonth),
    '52-53-week': (week) => {
        const monthEnd = lastDayOfMonth(year, week.month);
        const back = weekdayDistance(weekdayOf(monthEnd), week.endWeekday);
        if (week.rule === 'last' || back <= 3)
            return addDays(monthEnd, -back);
        return addDays(monthEnd, 7 - back);
    },
});
//# sourceMappingURL=LegalEntity.js.map