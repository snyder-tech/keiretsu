/**
 * Period cost snapshots: a human freezes a period's cost lines under a digest.
 *
 * A frozen snapshot never changes. Re-running the same inputs reproduces the
 * same `linesDigest`. Corrections are new lines in the first open period that
 * cite the snapshot they correct; closed periods are never reopened.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { type HumanActor } from '../core/Actor.ts';
import { Sha256, type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { SnapshotId } from '../core/Ids.ts';
import { ValidationIssue } from '../core/Issue.ts';
import { Instant } from '../core/Temporal.ts';
/**
 * Lifecycle of a cost period.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostPeriod: Schema.Struct<{
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly state: Schema.Literals<readonly ["open", "soft-closed", "frozen"]>;
}>;
/** @since 0.1.0 @category models */
export type CostPeriod = typeof CostPeriod.Type;
/**
 * One cost line in a period.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostLine: Schema.Struct<{
    readonly kind: Schema.Literals<readonly ["direct", "allocated", "unallocated", "correction"]>;
    readonly poolId: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
    readonly costObjectId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly sources: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly id: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly corrects: Schema.optional<Schema.Struct<{
        readonly snapshotId: Schema.brand<Schema.String, "keiretsu/SnapshotId">;
        readonly linesDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type CostLine = typeof CostLine.Type;
/**
 * A frozen period snapshot.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CostSnapshot: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/SnapshotId">;
    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly lines: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.Literals<readonly ["direct", "allocated", "unallocated", "correction"]>;
        readonly poolId: Schema.brand<Schema.String, "keiretsu/CostPoolId">;
        readonly costObjectId: Schema.optional<Schema.brand<Schema.String, "keiretsu/CostObjectId">>;
        readonly amount: Schema.Struct<{
            readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
            readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        }>;
        readonly sources: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly id: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly corrects: Schema.optional<Schema.Struct<{
            readonly snapshotId: Schema.brand<Schema.String, "keiretsu/SnapshotId">;
            readonly linesDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>>;
    }>>;
    readonly linesDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly rateSnapshot: Schema.Struct<{
        readonly id: Schema.brand<Schema.String, "keiretsu/SnapshotId">;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
    readonly frozenBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly frozenAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type CostSnapshot = typeof CostSnapshot.Type;
declare const FreezeRefused_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "FreezeRefused";
} & Readonly<A>;
/**
 * A freeze was refused.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class FreezeRefused extends FreezeRefused_base<{
    readonly code: string;
    readonly reason: string;
}> {
}
/**
 * Digest of a line set.
 *
 * @since 0.1.0
 * @category digests
 */
export declare const linesDigest: (lines: ReadonlyArray<CostLine>) => Effect.Effect<Sha256, CanonicalJsonError>;
/**
 * Freeze a period. Refused while the period is not soft-closed or any issue is an error.
 * Holds are carried into the snapshot so they stay visible.
 *
 * Codes: `cost-snapshot.period-state`, `cost-snapshot.entity`, `cost-snapshot.errors`.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export declare const freeze: (options: {
    readonly id: typeof SnapshotId.Type;
    readonly period: CostPeriod;
    readonly lines: ReadonlyArray<CostLine>;
    readonly rateSnapshot: {
        readonly id: typeof SnapshotId.Type;
        readonly digest: Sha256;
    };
    readonly issues: ReadonlyArray<ValidationIssue>;
    readonly frozenBy: HumanActor;
    readonly frozenAt: Instant;
}) => Effect.Effect<CostSnapshot, FreezeRefused | CanonicalJsonError>;
/**
 * Recompute a snapshot's digest and compare.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export declare const verify: (snapshot: CostSnapshot) => Effect.Effect<boolean, CanonicalJsonError>;
declare const NoOpenPeriod_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "NoOpenPeriod";
} & Readonly<A>;
/**
 * No open period on or after the requested one.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NoOpenPeriod extends NoOpenPeriod_base<{
    readonly entityId: string;
    readonly from: string;
}> {
}
/**
 * The first open period of the snapshot's entity at or after `from` — where corrections land.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export declare const correctionPeriod: (periods: ReadonlyArray<CostPeriod>, snapshot: CostSnapshot) => Effect.Effect<CostPeriod, NoOpenPeriod>;
/**
 * A correction line for a frozen snapshot, to be placed in {@link correctionPeriod}.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export declare const correction: (snapshot: CostSnapshot, line: Omit<CostLine, "kind" | "corrects">) => CostLine;
export {};
//# sourceMappingURL=CostSnapshot.d.ts.map