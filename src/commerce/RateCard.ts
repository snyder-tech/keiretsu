/**
 * Rate cards: hourly (or daily) rates keyed by role, never by person, in one currency.
 *
 * Person-level pay never appears here; a rate card is a price, not a cost.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { CurrencyCode } from '../core/Currency.ts';
import { Decimal } from '../core/Decimal.ts';
import { revisionChain, RevisionFields, validInterval } from '../core/Envelope.ts';
import { EntityId } from '../core/Ids.ts';
import { contains, Instant, IsoDate } from '../core/Temporal.ts';

import { isNegativeDecimal, OpenCode } from './Code.ts';
import { RateCardId } from './CommerceIds.ts';
import { rule, toCheck } from './Invariant.ts';

/**
 * One role's rate. `unit` is `HUR` (hour) or `DAY`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateCardLine = Schema.Struct({
  roleKey: OpenCode,
  unit: Schema.Literals(['HUR', 'DAY']),
  rate: Decimal,
});
/** @since 0.1.0 @category models */
export type RateCardLine = typeof RateCardLine.Type;

/**
 * Rate card invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const rateCardRules = {
  uniqueRoles: rule<{ readonly lines: ReadonlyArray<RateCardLine> }>('rate-card.duplicate-role', (card) =>
    new Set(card.lines.map((line) => `${line.roleKey}|${line.unit}`)).size === card.lines.length ? undefined : 'one rate per role and unit',
  ),
  nonNegative: rule<{ readonly lines: ReadonlyArray<RateCardLine> }>('rate-card.negative-rate', (card) =>
    card.lines.some((line) => isNegativeDecimal(line.rate)) ? 'rates are non-negative' : undefined,
  ),
} as const;

/**
 * A rate card.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RateCard = Schema.Struct({
  id: RateCardId,
  ...RevisionFields,
  owner: EntityId,
  currency: CurrencyCode,
  lines: Schema.NonEmptyArray(RateCardLine),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  recordedAt: Instant,
}).check(revisionChain, validInterval, toCheck(rateCardRules.uniqueRoles), toCheck(rateCardRules.nonNegative));
/** @since 0.1.0 @category models */
export type RateCard = typeof RateCard.Type;

/**
 * A resolved hourly rate, as `computeCharge` consumes it.
 *
 * @since 0.1.0
 * @category models
 */
export interface ResolvedRate {
  readonly rateCardId: RateCardId;
  readonly rate: Decimal;
  readonly currency: CurrencyCode;
}

/**
 * The hourly rate for a role on a date, or `undefined` (the caller holds; it never guesses).
 *
 * @since 0.1.0
 * @category lookups
 */
export const hourlyRate = (card: RateCard, options: { readonly roleKey: string; readonly date: string }): ResolvedRate | undefined => {
  if (!contains(card, options.date)) return undefined;
  const line = card.lines.find((entry) => entry.roleKey === options.roleKey && entry.unit === 'HUR');
  return line === undefined ? undefined : { rateCardId: card.id, rate: line.rate, currency: card.currency };
};
