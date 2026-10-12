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
import { Data, Effect, Schema } from 'effect';

import { Actor, type HumanActor } from '../core/Actor.ts';
import { digestValue, Sha256, type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { SubjectRef } from '../core/Hold.ts';
import { CostObjectId, EntityId, SnapshotId } from '../core/Ids.ts';
import { ValidationIssue } from '../core/Issue.ts';
import { Money } from '../core/Money.ts';
import { Instant, Period } from '../core/Temporal.ts';

import { CostPoolId } from './CostPool.ts';

/**
 * Lifecycle of a cost period.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostPeriod = Schema.Struct({ entityId: EntityId, period: Period, state: Schema.Literals(['open', 'soft-closed', 'frozen']) });
/** @since 0.1.0 @category models */
export type CostPeriod = typeof CostPeriod.Type;

/**
 * One cost line in a period.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostLine = Schema.Struct({
  kind: Schema.Literals(['direct', 'allocated', 'unallocated', 'correction']),
  poolId: CostPoolId,
  costObjectId: Schema.optional(CostObjectId),
  amount: Money,
  sources: Schema.Array(SubjectRef),
  corrects: Schema.optional(Schema.Struct({ snapshotId: SnapshotId, linesDigest: Sha256 })),
}).check(
  Schema.makeFilter((line) => ((line.kind === 'correction') === (line.corrects !== undefined) ? undefined : 'cost-line.correction: corrections, and only corrections, cite a snapshot')),
  Schema.makeFilter((line) => ((line.kind === 'unallocated') === (line.costObjectId === undefined) ? undefined : 'cost-line.target: only unallocated lines lack a cost object')),
);
/** @since 0.1.0 @category models */
export type CostLine = typeof CostLine.Type;

/**
 * A frozen period snapshot.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostSnapshot = Schema.Struct({
  id: SnapshotId,
  entityId: EntityId,
  period: Period,
  lines: Schema.Array(CostLine),
  linesDigest: Sha256,
  rateSnapshot: Schema.Struct({ id: SnapshotId, digest: Sha256 }),
  issues: Schema.Array(ValidationIssue),
  frozenBy: Actor,
  frozenAt: Instant,
}).check(Schema.makeFilter((snapshot) => (snapshot.frozenBy._tag === 'human' ? undefined : 'cost-snapshot.human-freeze: only a human freezes a period')));
/** @since 0.1.0 @category models */
export type CostSnapshot = typeof CostSnapshot.Type;

/**
 * A freeze was refused.
 *
 * @since 0.1.0
 * @category errors
 */
export class FreezeRefused extends Data.TaggedError('FreezeRefused')<{ readonly code: string; readonly reason: string }> {}

/**
 * Digest of a line set.
 *
 * @since 0.1.0
 * @category digests
 */
export const linesDigest = (lines: ReadonlyArray<CostLine>): Effect.Effect<Sha256, CanonicalJsonError> => digestValue(lines);

/**
 * Freeze a period. Refused while the period is not soft-closed or any issue is an error.
 * Holds are carried into the snapshot so they stay visible.
 *
 * Codes: `cost-snapshot.period-state`, `cost-snapshot.entity`, `cost-snapshot.errors`.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export const freeze = (options: {
  readonly id: typeof SnapshotId.Type;
  readonly period: CostPeriod;
  readonly lines: ReadonlyArray<CostLine>;
  readonly rateSnapshot: { readonly id: typeof SnapshotId.Type; readonly digest: Sha256 };
  readonly issues: ReadonlyArray<ValidationIssue>;
  readonly frozenBy: HumanActor;
  readonly frozenAt: Instant;
}): Effect.Effect<CostSnapshot, FreezeRefused | CanonicalJsonError> => {
  if (options.period.state !== 'soft-closed') return Effect.fail(new FreezeRefused({ code: 'cost-snapshot.period-state', reason: `period is ${options.period.state}` }));
  if (options.issues.some((entry) => entry.severity === 'error')) return Effect.fail(new FreezeRefused({ code: 'cost-snapshot.errors', reason: 'resolve error issues before freezing' }));
  return Effect.map(linesDigest(options.lines), (digest) => ({
    id: options.id,
    entityId: options.period.entityId,
    period: options.period.period,
    lines: [...options.lines],
    linesDigest: digest,
    rateSnapshot: options.rateSnapshot,
    issues: [...options.issues],
    frozenBy: options.frozenBy,
    frozenAt: options.frozenAt,
  }));
};

/**
 * Recompute a snapshot's digest and compare.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export const verify = (snapshot: CostSnapshot): Effect.Effect<boolean, CanonicalJsonError> => Effect.map(linesDigest(snapshot.lines), (digest) => digest === snapshot.linesDigest);

/**
 * No open period on or after the requested one.
 *
 * @since 0.1.0
 * @category errors
 */
export class NoOpenPeriod extends Data.TaggedError('NoOpenPeriod')<{ readonly entityId: string; readonly from: string }> {}

/**
 * The first open period of the snapshot's entity at or after `from` — where corrections land.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export const correctionPeriod = (periods: ReadonlyArray<CostPeriod>, snapshot: CostSnapshot): Effect.Effect<CostPeriod, NoOpenPeriod> => {
  const found = periods
    .filter((entry) => entry.entityId === snapshot.entityId && entry.state === 'open' && entry.period > snapshot.period)
    .sort((left, right) => (left.period < right.period ? -1 : 1))[0];
  return found === undefined ? Effect.fail(new NoOpenPeriod({ entityId: snapshot.entityId, from: snapshot.period })) : Effect.succeed(found);
};

/**
 * A correction line for a frozen snapshot, to be placed in {@link correctionPeriod}.
 *
 * @since 0.1.0
 * @category lifecycle
 */
export const correction = (snapshot: CostSnapshot, line: Omit<CostLine, 'kind' | 'corrects'>): CostLine => ({
  ...line,
  kind: 'correction',
  corrects: { snapshotId: snapshot.id, linesDigest: snapshot.linesDigest },
});
