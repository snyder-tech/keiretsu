/**
 * Convert money through a snapshot: multiply exactly, round once.
 *
 * The amount in minor units is multiplied by the exact product of the
 * snapshot's legs and reduced to the target currency's minor units with the
 * snapshot's rounding mode. No rate, inverse or cross is rounded on the way.
 *
 * Round-trip bound: converting A→B→A differs from the original by at most
 * half a minor unit of A plus half a minor unit of B expressed in A. When B's
 * minor unit is worth no more than A's (USD→INR, USD→PKR), that is at most one
 * minor unit of A.
 *
 * @since 0.1.0
 * @module
 */
import { Effect } from 'effect';

import type { Sha256 } from '../core/CanonicalJson.ts';

import { minorUnits, type CurrencyCode, type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import { CurrencyMismatch, make, subtract, units, type Money } from '../core/Money.ts';
import { divide } from '../core/Rounding.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { SCALE_DIGITS, type Scaled } from '../core/Decimal.ts';

import { SnapshotMismatch } from './FxError.ts';
import type { FxSnapshot } from './FxSnapshot.ts';
import { inverse } from './internal/ExactRate.ts';
import { chainRatio } from './internal/SnapshotMath.ts';

/**
 * `forward` converts `base`→`quote`; `reverse` converts `quote`→`base` with the exact inverse.
 *
 * @since 0.1.0
 * @category models
 */
export type Direction = 'forward' | 'reverse';

/** Unrounded major-unit conversion through exact legs. @since 0.1.0 @category conversions */
export const convertScaled = (options: {
  readonly amount: Scaled;
  readonly currency: CurrencyCode;
  readonly snapshot: FxSnapshot;
  readonly table: CurrencyTableShape;
  readonly direction: Direction;
  readonly rounding: RoundingMode;
}): Effect.Effect<Money, CurrencyMismatch | UnknownCurrency> =>
  Effect.gen(function* () {
    const { snapshot } = options;
    const forward = options.direction === 'forward';
    const [from, to] = forward ? [snapshot.base, snapshot.quote] : [snapshot.quote, snapshot.base];
    if (options.currency !== from) return yield* Effect.fail(new CurrencyMismatch({ left: options.currency, right: from }));
    const digits = yield* minorUnits(options.table, to);
    const ratio = forward ? chainRatio(snapshot.legs) : inverse(chainRatio(snapshot.legs));
    return make(divide(options.amount * ratio.numerator * 10n ** BigInt(digits), ratio.denominator * 10n ** BigInt(SCALE_DIGITS), options.rounding), to);
  });

/**
 * Conversion options.
 *
 * @since 0.1.0
 * @category models
 */
export interface ConvertOptions {
  readonly amount: Money;
  readonly snapshot: FxSnapshot;
  readonly table: CurrencyTableShape;
  readonly direction?: Direction | undefined;
}

/**
 * Convert `amount` through `snapshot`, rounding once to the target's minor units.
 *
 * @since 0.1.0
 * @category conversions
 */
export const convert = (options: ConvertOptions): Effect.Effect<Money, CurrencyMismatch | UnknownCurrency> =>
  Effect.gen(function* () {
    const { amount, snapshot } = options;
    const forward = (options.direction ?? 'forward') === 'forward';
    const [from, to] = forward ? [snapshot.base, snapshot.quote] : [snapshot.quote, snapshot.base];
    if (amount.currency !== from) return yield* Effect.fail(new CurrencyMismatch({ left: amount.currency, right: from }));
    const fromDigits = yield* minorUnits(options.table, from);
    const toDigits = yield* minorUnits(options.table, to);
    const ratio = forward ? chainRatio(snapshot.legs) : inverse(chainRatio(snapshot.legs));
    const numerator = units(amount) * ratio.numerator * 10n ** BigInt(toDigits);
    const denominator = ratio.denominator * 10n ** BigInt(fromDigits);
    return make(divide(numerator, denominator, snapshot.rounding), to);
  });

/**
 * The snapshot (and direction) that converts `from` → `to`, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export const findSnapshot = (
  snapshots: ReadonlyArray<FxSnapshot>,
  pair: { readonly from: CurrencyCode; readonly to: CurrencyCode },
): { readonly snapshot: FxSnapshot; readonly direction: Direction } | undefined => {
  const forward = snapshots.find((entry) => entry.base === pair.from && entry.quote === pair.to);
  if (forward !== undefined) return { snapshot: forward, direction: 'forward' };
  const reverse = snapshots.find((entry) => entry.base === pair.to && entry.quote === pair.from);
  return reverse === undefined ? undefined : { snapshot: reverse, direction: 'reverse' };
};

/**
 * A converted amount and the digest of the snapshot used (absent when no conversion was needed).
 *
 * @since 0.1.0
 * @category models
 */
export interface Converted {
  readonly amount: Money;
  readonly snapshotDigest?: Sha256 | undefined;
}

/**
 * Convert to `to`, or return the amount unchanged when it is already in `to`.
 * `undefined` when no snapshot connects the currencies (the caller holds; it never guesses).
 *
 * @since 0.1.0
 * @category conversions
 */
export const convertTo = (options: {
  readonly amount: Money;
  readonly to: CurrencyCode;
  readonly snapshots: ReadonlyArray<FxSnapshot>;
  readonly table: CurrencyTableShape;
}): Effect.Effect<Converted | undefined, CurrencyMismatch | UnknownCurrency> => {
  if (options.amount.currency === options.to) return Effect.succeed({ amount: options.amount });
  const found = findSnapshot(options.snapshots, { from: options.amount.currency, to: options.to });
  if (found === undefined) return Effect.succeed(undefined);
  return Effect.map(convert({ amount: options.amount, snapshot: found.snapshot, table: options.table, direction: found.direction }), (amount) => ({
    amount,
    snapshotDigest: found.snapshot.digest,
  }));
};

/**
 * Difference a true-up posts: `amount` at the final snapshot minus `amount` at the provisional one.
 *
 * @since 0.1.0
 * @category conversions
 */
export const trueUpDifference = (options: {
  readonly amount: Money;
  readonly provisional: FxSnapshot;
  readonly final: FxSnapshot;
  readonly table: CurrencyTableShape;
}): Effect.Effect<Money, CurrencyMismatch | UnknownCurrency | SnapshotMismatch> =>
  Effect.gen(function* () {
    if (options.final.supersedesDigest !== options.provisional.digest) {
      return yield* Effect.fail(new SnapshotMismatch({ reason: 'final snapshot does not supersede the provisional snapshot' }));
    }
    const final = yield* convert({ amount: options.amount, snapshot: options.final, table: options.table });
    const provisional = yield* convert({ amount: options.amount, snapshot: options.provisional, table: options.table });
    return yield* subtract(final, provisional);
  });
