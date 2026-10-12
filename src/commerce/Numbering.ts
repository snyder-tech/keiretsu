/**
 * Document numbering per (entity, series, fiscal year).
 *
 * Allocation is a pure step over an immutable {@link NumberLedger}: the next
 * number is always last + 1, so sequences are monotonic and gapless, and a
 * cancelled number is retained, never reused. Formats are templates with
 * `{SERIES}`, `{FY}` and `{SEQ:n}` tokens and an optional maximum length
 * (India CGST Rule 46(b): at most 16 characters, unique per fiscal year).
 * {@link InvoiceNumberAllocator} is the service port for a persistent store.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Ref, Schema } from 'effect';

import type { ValidationIssue } from '../core/Issue.ts';

import { OpenCode } from './Code.ts';
import { fault } from './Invariant.ts';

/**
 * An allocated document number.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DocumentNumber = Schema.Struct({
  series: OpenCode,
  fiscalYear: Schema.String.check(Schema.isPattern(/^\d{4}(?:-\d{2})?$/)),
  sequence: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
  text: Schema.NonEmptyString.check(Schema.isMaxLength(64)),
});
/** @since 0.1.0 @category models */
export type DocumentNumber = typeof DocumentNumber.Type;

/**
 * A numbering series declared by the issuing entity.
 *
 * @since 0.1.0
 * @category models
 */
export interface NumberingSeries {
  readonly entityId: string;
  readonly series: string;
  /** Month (1–12) in which the entity's fiscal year ends. */
  readonly fiscalYearEndMonth: number;
  readonly template: string;
  readonly maxLength?: number;
}

/**
 * Last allocated sequence per `entity|series|fiscalYear`.
 *
 * @since 0.1.0
 * @category models
 */
export interface NumberLedger {
  readonly last: ReadonlyMap<string, number>;
}

/**
 * A ledger with nothing allocated.
 *
 * @since 0.1.0
 * @category constructors
 */
export const emptyLedger: NumberLedger = { last: new Map() };

/**
 * A number could not be allocated.
 *
 * @since 0.1.0
 * @category errors
 */
export class NumberingError extends Schema.TaggedError<NumberingError>()('NumberingError', {
  code: Schema.String,
  reason: Schema.String,
}) {}

/**
 * Fiscal-year label of a date: `2026` for calendar years, else `2026-27` (start year, end year's last two digits).
 *
 * @since 0.1.0
 * @category accessors
 */
export const fiscalYearLabel = (options: { readonly date: string; readonly fiscalYearEndMonth: number }): string => {
  const year = Number(options.date.slice(0, 4));
  const month = Number(options.date.slice(5, 7));
  if (options.fiscalYearEndMonth === 12) return String(year);
  const start = month > options.fiscalYearEndMonth ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
};

/**
 * Render a template.
 *
 * @since 0.1.0
 * @category formatting
 */
export const formatNumber = (template: string, parts: { readonly series: string; readonly fiscalYear: string; readonly sequence: number }): string =>
  template
    .replaceAll('{SERIES}', parts.series.toUpperCase())
    .replaceAll('{FY}', parts.fiscalYear)
    .replace(/\{SEQ:(\d)\}/g, (_match, width: string) => String(parts.sequence).padStart(Number(width), '0'));

const ledgerKey = (series: NumberingSeries, fiscalYear: string): string => `${series.entityId}|${series.series}|${fiscalYear}`;

/**
 * Allocate the next number. Pure: returns the number and the new ledger.
 *
 * @since 0.1.0
 * @category allocation
 */
export const allocateNumber = (
  ledger: NumberLedger,
  request: { readonly series: NumberingSeries; readonly issueDate: string },
): Effect.Effect<{ readonly number: DocumentNumber; readonly ledger: NumberLedger }, NumberingError> => {
  const { series } = request;
  if (!Number.isInteger(series.fiscalYearEndMonth) || series.fiscalYearEndMonth < 1 || series.fiscalYearEndMonth > 12)
    return Effect.fail(new NumberingError({ code: 'numbering.fiscal-year-end', reason: 'fiscalYearEndMonth is 1–12' }));
  if (!/\{SEQ:\d\}/.test(series.template)) return Effect.fail(new NumberingError({ code: 'numbering.template-without-sequence', reason: 'templates contain {SEQ:n}' }));
  const fiscalYear = fiscalYearLabel({ date: request.issueDate, fiscalYearEndMonth: series.fiscalYearEndMonth });
  const key = ledgerKey(series, fiscalYear);
  const sequence = (ledger.last.get(key) ?? 0) + 1;
  const text = formatNumber(series.template, { series: series.series, fiscalYear, sequence });
  if (series.maxLength !== undefined && text.length > series.maxLength)
    return Effect.fail(new NumberingError({ code: 'numbering.too-long', reason: `${text} exceeds ${series.maxLength} characters` }));
  const number = Schema.decodeUnknownSync(DocumentNumber)({ series: series.series, fiscalYear, sequence, text });
  return Effect.succeed({ number, ledger: { last: new Map([...ledger.last, [key, sequence]]) } });
};

/**
 * Check issued numbers: unique text per issuer and, per (issuer, series, fiscal year), sequences 1..n without gaps.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateNumbering = (documents: ReadonlyArray<{ readonly id: string; readonly issuerKey: string; readonly number: DocumentNumber }>): ReadonlyArray<ValidationIssue> => {
  const texts = new Map<string, string>();
  const sequences = new Map<string, Array<number>>();
  const issues: Array<ValidationIssue> = [];
  for (const document of documents) {
    const textKey = `${document.issuerKey}|${document.number.text}`;
    const prior = texts.get(textKey);
    if (prior !== undefined && prior !== document.id) issues.push(fault('numbering.duplicate', document.id, `${document.number.text} is also used by ${prior}`));
    texts.set(textKey, document.id);
    const key = `${document.issuerKey}|${document.number.series}|${document.number.fiscalYear}`;
    sequences.set(key, [...(sequences.get(key) ?? []), document.number.sequence]);
  }
  for (const [key, list] of sequences) {
    const sorted = [...new Set(list)].sort((left, right) => left - right);
    const gap = sorted.findIndex((value, index) => value !== index + 1);
    if (gap >= 0) issues.push(fault('numbering.gap', key, `sequence ${gap + 1} is missing`));
  }
  return issues;
};

/**
 * Service port for number allocation backed by a persistent store.
 *
 * @since 0.1.0
 * @category services
 */
export class InvoiceNumberAllocator extends Context.Service<
  InvoiceNumberAllocator,
  { readonly allocate: (request: { readonly series: NumberingSeries; readonly issueDate: string }) => Effect.Effect<DocumentNumber, NumberingError> }
>()('@snyder-tech/keiretsu/commerce/InvoiceNumberAllocator') {
  /** An in-memory allocator for tests and dry runs. */
  static readonly inMemory: Layer.Layer<InvoiceNumberAllocator> = Layer.effect(InvoiceNumberAllocator)(
    Effect.map(Ref.make(emptyLedger), (ref) => ({
      allocate: (request: { readonly series: NumberingSeries; readonly issueDate: string }) =>
        Effect.flatMap(Ref.get(ref), (ledger) =>
          Effect.flatMap(allocateNumber(ledger, request), (result) => Effect.as(Ref.set(ref, result.ledger), result.number)),
        ),
    })),
  );
}
