/**
 * Where observations come from.
 *
 * Accounting resolves against committed, append-only data. Layers here take
 * the data as values or strings (no I/O): an adopter reads its files and
 * passes the text in. Live publisher adapters belong in an ingest job that
 * appends to that data, not in the resolver's path.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer, Schema } from 'effect';
import { parseStrict } from "../core/CanonicalJson.js";
import { FxSourceError } from "./FxError.js";
import { FxObservation, fromObservations } from "./FxObservation.js";
const fromLog = (log) => ({
    observations: (series) => Effect.succeed(log.filter((entry) => entry.series === series)),
});
const CSV_COLUMNS = ['series', 'rateDate', 'rate', 'status', 'recordedAt', 'revision', 'supersedesDigest'];
const sourceError = (reason) => new FxSourceError({ reason });
const csvRow = (header, line, lineNumber) => {
    if (line.includes('"'))
        return Effect.fail(sourceError(`line ${lineNumber}: quoted CSV fields are not supported`));
    const cells = line.split(',');
    if (cells.length !== header.length)
        return Effect.fail(sourceError(`line ${lineNumber}: expected ${header.length} fields`));
    const record = Object.fromEntries(header.map((name, index) => [name, (cells[index] ?? '').trim()]));
    // A blank rate means "not published": the row is skipped, never read as zero.
    if (record['rate'] === '')
        return Effect.succeed(undefined);
    const supersedes = record['supersedesDigest'];
    return Schema.decodeUnknownEffect(FxObservation)({
        series: record['series'],
        rateDate: record['rateDate'],
        rate: record['rate'],
        status: record['status'],
        recordedAt: record['recordedAt'],
        revision: Number(record['revision']),
        ...(supersedes === undefined || supersedes === '' ? {} : { supersedesDigest: supersedes }),
        evidence: [],
        assurance: 'asserted',
    }).pipe(Effect.mapError((error) => sourceError(`line ${lineNumber}: ${error.message}`)));
};
/**
 * Parse CSV observations. Header must contain exactly
 * `series,rateDate,rate,status,recordedAt,revision,supersedesDigest` (any order).
 * Blank `rate` = unpublished. Rows are `asserted` with no evidence references.
 *
 * @since 0.1.0
 * @category parsing
 */
export const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    const header = (lines[0] ?? '').split(',').map((cell) => cell.trim());
    const missing = CSV_COLUMNS.filter((column) => !header.includes(column));
    if (missing.length > 0 || header.length !== CSV_COLUMNS.length)
        return Effect.fail(sourceError(`CSV header must be ${CSV_COLUMNS.join(',')}`));
    return Effect.map(Effect.forEach(lines.slice(1), (line, index) => csvRow(header, line, index + 2), { concurrency: 1 }), (rows) => rows.filter((row) => row !== undefined));
};
/**
 * Parse a strict JSON array of observations.
 *
 * @since 0.1.0
 * @category parsing
 */
export const parseJson = (text) => parseStrict(text).pipe(Effect.mapError((error) => sourceError(`${error.at}: ${error.reason}`)), Effect.flatMap((value) => Schema.decodeUnknownEffect(Schema.Array(FxObservation))(value)), Effect.mapError((error) => (error instanceof FxSourceError ? error : sourceError(error.message))));
/**
 * The rate source.
 *
 * @since 0.1.0
 * @category services
 */
export class FxRateSource extends Context.Service()('@snyder-tech/keiretsu/fx/FxRateSource') {
    /** A fixed table of observations (tests, contract-fixed rates). Fails if the revision chain is broken. */
    static fixed(observations) {
        return Layer.effect(FxRateSource, Effect.map(fromObservations(observations), fromLog));
    }
    /** Observations from strict JSON text (an array of `FxObservation`). */
    static fromJson(text) {
        return Layer.effect(FxRateSource, Effect.map(Effect.flatMap(parseJson(text), fromObservations), fromLog));
    }
    /** Observations from CSV text; see {@link parseCsv}. */
    static fromCsv(text) {
        return Layer.effect(FxRateSource, Effect.map(Effect.flatMap(parseCsv(text), fromObservations), fromLog));
    }
}
//# sourceMappingURL=FxRateSource.js.map