import { Effect, Schema } from 'effect';
import { type CurrencyCode, type CurrencyTableShape } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import * as Money from '../core/Money.ts';
import { type BillingModeTag, type CostBaseRef } from './BillingMode.ts';
import type { LeadTimeClass } from './CapacityTerms.ts';
import type { FxSnapshotRef } from './FxPort.ts';
import type { ResolvedRate } from './RateCard.ts';
import type { TransferLeg } from './TransferRoute.ts';
/**
 * Charge quantity units.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ChargeUnit: Schema.Literals<readonly ["minute", "value-unit", "period", "amount"]>;
/** @since 0.1.0 @category models */
export type ChargeUnit = typeof ChargeUnit.Type;
declare const ChargeComputationError_base: Schema.Class<ChargeComputationError, Schema.TaggedStruct<"ChargeComputationError", {
    readonly legId: Schema.String;
    readonly code: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Missing or inconsistent inputs. `code` is a stable issue code.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ChargeComputationError extends ChargeComputationError_base {
}
/**
 * Port: a cost measurement against a cost-base definition (finance package).
 *
 * @since 0.1.0
 * @category models
 */
export interface CostMeasurement {
    readonly definitionId: string;
    readonly definitionDigest: string;
    readonly markupBase: Money.Money;
    readonly passThrough: Money.Money;
}
/**
 * Facts a leg's charge is computed from. Supply what the leg's mode needs.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeBasis {
    /** Human minutes allocated to the route for the period (non-negative integer). */
    readonly minutes: number;
    /** Cost of the cost base, for cost-reimbursement and cost-plus. */
    readonly cost?: CostMeasurement;
    /** Role rate resolved from the leg's rate card (time-and-materials, retainer overage). */
    readonly rate?: ResolvedRate;
    /** Accepted value units (unit-price, value-based). */
    readonly units?: Decimal.Decimal;
    /** Revenue earned on the revenue-share source for the period. */
    readonly revenue?: Money.Money;
    /** Disbursed amount re-billed at cost (pass-through). */
    readonly disbursement?: Money.Money;
    /** FX snapshot used when the priced currency differs from the invoice currency. */
    readonly fx?: FxSnapshotRef;
    /**
     * The agreement's lead-time class for this charge (resolve with `classFor`;
     * `validateChargeLines` checks the line's claim). Its discount applies to
     * the priced amount; at-cost modes take no discount.
     */
    readonly leadTimeClass?: LeadTimeClass;
}
/**
 * Whether the result may accrue or must hold for a human decision.
 *
 * @since 0.1.0
 * @category models
 */
export type Disposition = {
    readonly _tag: 'accrue';
} | {
    readonly _tag: 'hold';
    readonly reasonCode: string;
    readonly message: string;
};
/**
 * One leg's computed charge.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeComputation {
    readonly legId: string;
    readonly billingModeTag: BillingModeTag;
    readonly quantity: Decimal.Decimal;
    readonly unit: ChargeUnit;
    /** Unrounded amount in the priced currency. */
    readonly priced: {
        readonly amount: Decimal.Decimal;
        readonly currency: CurrencyCode;
    };
    readonly providerAmount: Money.Money;
    readonly amount: Money.Money;
    readonly fx?: FxSnapshotRef;
    readonly costBase?: CostBaseRef;
    /** The lead-time discount applied in step 1, if any. */
    readonly leadTimeDiscount?: {
        readonly classKey: string;
        readonly discountBps: number;
    };
    readonly disposition: Disposition;
}
/**
 * Input to {@link computeCharge}. `table` defaults to the bundled ISO 4217 edition.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeInput {
    readonly leg: TransferLeg;
    readonly basis: ChargeBasis;
    readonly table?: CurrencyTableShape;
}
/**
 * Compute one leg's charge. Pure: no services, no clock, no FX resolution.
 *
 * @since 0.1.0
 * @category computation
 */
export declare const computeCharge: (input: ChargeInput) => Effect.Effect<ChargeComputation, ChargeComputationError>;
export {};
//# sourceMappingURL=Charge.d.ts.map