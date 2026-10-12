/**
 * Port: FX clause references and FX snapshots, owned by `@snyder-tech/keiretsu/fx`.
 *
 * Commerce never resolves a rate. An agreement or leg names its clause (series
 * id and date rule); a charge line stores the snapshot actually used, pinned by
 * id and digest, so a closed period never re-resolves FX.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * The agreement's rate clause, by reference. `dateRule` is the fx package's
 * rule tag (e.g. `WeekEnding`, `PeriodEnd`); `purpose` separates book, tax and
 * contract clauses.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateClauseRef: Schema.Struct<{
    readonly seriesId: Schema.String;
    readonly dateRule: Schema.NonEmptyString;
    readonly purpose: Schema.String;
    readonly clauseDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type RateClauseRef = typeof RateClauseRef.Type;
/** Canonical FX snapshot, pinned by its content digest. @since 0.1.0 @category schemas */
export { FxSnapshot as FxSnapshotRef } from '../fx/FxSnapshot.ts';
//# sourceMappingURL=FxPort.d.ts.map