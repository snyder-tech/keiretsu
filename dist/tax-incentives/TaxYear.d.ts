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
export declare const TaxYearLabel: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
/** @since 0.1.0 @category models */
export type TaxYearLabel = typeof TaxYearLabel.Type;
/**
 * Fiscal-year-end month, 1–12.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const FiscalYearEndMonth: Schema.Number;
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
/**
 * The taxable year with the given label for a fiscal-year-end month.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const byLabel: (fiscalYearEndMonth: number, label: TaxYearLabel | string) => TaxYear;
/**
 * The taxable year containing `date` for a fiscal-year-end month.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const containing: (fiscalYearEndMonth: number, date: IsoDate | string) => TaxYear;
/**
 * Whether a date or an accounting period (`YYYY-MM`) lies inside the taxable year.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const includes: (taxYear: TaxYear, dateOrPeriod: string) => boolean;
/**
 * Calendar quarter label `YYYY-Qn` of a date.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const calendarQuarter: (date: IsoDate | string) => string;
//# sourceMappingURL=TaxYear.d.ts.map