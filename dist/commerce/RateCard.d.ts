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
import { RateCardId } from './CommerceIds.ts';
/**
 * One role's rate. `unit` is `HUR` (hour) or `DAY`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateCardLine: Schema.Struct<{
    readonly roleKey: Schema.String;
    readonly unit: Schema.Literals<readonly ["HUR", "DAY"]>;
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
}>;
/** @since 0.1.0 @category models */
export type RateCardLine = typeof RateCardLine.Type;
/**
 * Rate card invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const rateCardRules: {
    readonly uniqueRoles: import("./Invariant.ts").Rule<{
        readonly lines: ReadonlyArray<RateCardLine>;
    }>;
    readonly nonNegative: import("./Invariant.ts").Rule<{
        readonly lines: ReadonlyArray<RateCardLine>;
    }>;
};
/**
 * A rate card.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RateCard: Schema.Struct<{
    readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    readonly lines: Schema.NonEmptyArray<Schema.Struct<{
        readonly roleKey: Schema.String;
        readonly unit: Schema.Literals<readonly ["HUR", "DAY"]>;
        readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/RateCardId">;
}>;
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
export declare const hourlyRate: (card: RateCard, options: {
    readonly roleKey: string;
    readonly date: string;
}) => ResolvedRate | undefined;
//# sourceMappingURL=RateCard.d.ts.map