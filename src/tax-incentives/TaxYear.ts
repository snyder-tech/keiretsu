/**
 * Taxable years. A claimant's taxable year is derived from its fiscal-year-end
 * month; regimes that test "taxable years beginning after X" resolve against
 * the claimant's year, never against the work date alone.
 *
 * The label is the calendar year in which the taxable year **ends** (`2026`
 * for an April 2025 – March 2026 year).
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { IsoDate } from '../core/Temporal.ts';

/**
 * Taxable-year label: the four-digit year in which the taxable year ends.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TaxYearLabel = Schema.String.check(Schema.isPattern(/^\d{4}$/)).pipe(Schema.brand('keiretsu/TaxYearLabel'));
/** @since 0.1.0 @category models */
export type TaxYearLabel = typeof TaxYearLabel.Type;

/**
 * Fiscal-year-end month, 1–12.
 *
 * @since 0.1.0
 * @category schemas
 */
export const FiscalYearEndMonth = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 12 }));

/**
 * A resolved taxable year: half-open `[start, end)`.
 *
 * @since 0.1.0
 * @category models
 */
export interface TaxYear {
  readonly label: TaxYearLabel;
  readonly start: IsoDate;
  readonly end: IsoDate;
}

const decodeDate = Schema.decodeSync(IsoDate);
const decodeLabel = Schema.decodeSync(TaxYearLabel);
const pad = (value: number): string => String(value).padStart(2, '0');
const firstOfMonth = (year: number, month: number): IsoDate => (month > 12 ? decodeDate(`${year + 1}-01-01`) : decodeDate(`${year}-${pad(month)}-01`));

/**
 * The taxable year with the given label for a fiscal-year-end month.
 *
 * @since 0.1.0
 * @category constructors
 */
export const byLabel = (fiscalYearEndMonth: number, label: TaxYearLabel | string): TaxYear => {
  const endYear = Number(label);
  return {
    label: decodeLabel(String(endYear)),
    start: firstOfMonth(fiscalYearEndMonth === 12 ? endYear : endYear - 1, fiscalYearEndMonth === 12 ? 1 : fiscalYearEndMonth + 1),
    end: firstOfMonth(endYear, fiscalYearEndMonth + 1),
  };
};

/**
 * The taxable year containing `date` for a fiscal-year-end month.
 *
 * @since 0.1.0
 * @category constructors
 */
export const containing = (fiscalYearEndMonth: number, date: IsoDate | string): TaxYear => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return byLabel(fiscalYearEndMonth, String(month <= fiscalYearEndMonth ? year : year + 1));
};

/**
 * Whether a date or an accounting period (`YYYY-MM`) lies inside the taxable year.
 *
 * @since 0.1.0
 * @category predicates
 */
export const includes = (taxYear: TaxYear, dateOrPeriod: string): boolean => {
  const date = dateOrPeriod.length === 7 ? `${dateOrPeriod}-01` : dateOrPeriod;
  return date >= taxYear.start && date < taxYear.end;
};

/**
 * Calendar quarter label `YYYY-Qn` of a date.
 *
 * @since 0.1.0
 * @category constructors
 */
export const calendarQuarter = (date: IsoDate | string): string => `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}`;
