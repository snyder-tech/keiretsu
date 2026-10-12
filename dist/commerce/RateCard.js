/**
 * Rate cards: hourly (or daily) rates keyed by role, never by person, in one currency.
 *
 * Person-level pay never appears here; a rate card is a price, not a cost.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { CurrencyCode } from "../core/Currency.js";
import { Decimal } from "../core/Decimal.js";
import { revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { EntityId } from "../core/Ids.js";
import { contains, Instant, IsoDate } from "../core/Temporal.js";
import { isNegativeDecimal, OpenCode } from "./Code.js";
import { RateCardId } from "./CommerceIds.js";
import { rule, toCheck } from "./Invariant.js";
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
/**
 * Rate card invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const rateCardRules = {
    uniqueRoles: rule('rate-card.duplicate-role', (card) => new Set(card.lines.map((line) => `${line.roleKey}|${line.unit}`)).size === card.lines.length ? undefined : 'one rate per role and unit'),
    nonNegative: rule('rate-card.negative-rate', (card) => card.lines.some((line) => isNegativeDecimal(line.rate)) ? 'rates are non-negative' : undefined),
};
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
/**
 * The hourly rate for a role on a date, or `undefined` (the caller holds; it never guesses).
 *
 * @since 0.1.0
 * @category lookups
 */
export const hourlyRate = (card, options) => {
    if (!contains(card, options.date))
        return undefined;
    const line = card.lines.find((entry) => entry.roleKey === options.roleKey && entry.unit === 'HUR');
    return line === undefined ? undefined : { rateCardId: card.id, rate: line.rate, currency: card.currency };
};
//# sourceMappingURL=RateCard.js.map