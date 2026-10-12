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
import { EvidenceRef } from '../core/Envelope.ts';
import { EntityId } from '../core/Ids.ts';
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

import { Identifier } from './Identifier.ts';
import { Segment, TimelineInput, type Timeline } from './Timeline.ts';
import { addDays, Weekday, weekdayOf, WEEKDAYS } from './WorkCalendar.ts';

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
/** @since 0.1.0 @category models */
export type FiscalYear = typeof FiscalYear.Type;

/** @since 0.1.0 @category schemas */
export const AccountingBasis = Schema.Struct({
  framework: Schema.Literals(['us-gaap', 'ifrs', 'ind-as', 'pk-ifrs', 'tax-basis', 'other']),
  method: Schema.Literals(['accrual', 'cash', 'modified-cash']),
});
/** @since 0.1.0 @category models */
export type AccountingBasis = typeof AccountingBasis.Type;

/** @since 0.1.0 @category schemas */
export const Lifecycle = Schema.Literals(['forming', 'active', 'dormant', 'dissolved']);
/** @since 0.1.0 @category models */
export type Lifecycle = typeof Lifecycle.Type;

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

const lastDayOfMonth = (year: number, month: number): IsoDate =>
  Schema.decodeSync(IsoDate)(new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10));

const weekdayDistance = (from: Weekday, to: Weekday): number => (WEEKDAYS.indexOf(from) - WEEKDAYS.indexOf(to) + 7) % 7;

/**
 * The last day of the fiscal year that ends in calendar `year` under `rule`.
 *
 * @since 0.1.0
 * @category accessors
 */
export const fiscalYearEnd = (rule: FiscalYear, year: number): IsoDate =>
  FiscalYear.match(rule, {
    'month-end': (monthEnd) => lastDayOfMonth(year, monthEnd.endMonth),
    '52-53-week': (week) => {
      const monthEnd = lastDayOfMonth(year, week.month);
      const back = weekdayDistance(weekdayOf(monthEnd), week.endWeekday);
      if (week.rule === 'last' || back <= 3) return addDays(monthEnd, -back);
      return addDays(monthEnd, 7 - back);
    },
  });
