/**
 * Charge lines: the money on one leg for one period.
 *
 * `amount` is in the leg's invoice currency; `providerAmount` is the
 * pre-translation amount and, when its currency differs, the FX snapshot is
 * required. A **credit** is a line with a negative amount that cites the line
 * it corrects; it lands in `adjustmentPeriod` (after the corrected period) when
 * that period is closed. Status `credited` marks an original line that a
 * credit has reversed. Cost-plus and cost-reimbursement lines pin the
 * cost-base digest. A line for capacity priced by lead time states its
 * lead-time class with the booking and service-start dates, and is checked
 * against the agreement's classes.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import type { ValidationIssue } from '../core/Issue.ts';
import { Money } from '../core/Money.ts';
import { type Agreement } from './Agreement.ts';
import { CostBaseRef, type BillingModeTag } from './BillingMode.ts';
import { type ChargeComputation } from './Charge.ts';
import { FxSnapshotRef } from './FxPort.ts';
import { PartyRef } from './Party.ts';
import { type TransferAllocation } from './TransferAllocation.ts';
import { type TransferRoute } from './TransferRoute.ts';
/**
 * Charge lifecycle.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ChargeStatus: Schema.Literals<readonly ["estimated", "accrued", "held", "invoiced", "settled", "disputed", "credited"]>;
/** @since 0.1.0 @category models */
export type ChargeStatus = typeof ChargeStatus.Type;
/**
 * Statuses a line on an undetermined leg may carry.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const HELD_LEG_STATUSES: ReadonlySet<ChargeStatus>;
/**
 * A purchase-order reference.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PurchaseOrderRef: Schema.Struct<{
    readonly number: Schema.NonEmptyString;
    readonly documentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
}>;
/** @since 0.1.0 @category models */
export type PurchaseOrderRef = typeof PurchaseOrderRef.Type;
/**
 * The lead-time price class a line claims, with the dates it is judged by.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LeadTimeClaim: Schema.Struct<{
    readonly classKey: Schema.String;
    readonly bookedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly serviceStart: Schema.brand<Schema.String, "keiretsu/IsoDate">;
}>;
/** @since 0.1.0 @category models */
export type LeadTimeClaim = typeof LeadTimeClaim.Type;
interface LineShape {
    readonly status: ChargeStatus;
    readonly holdReasonCode?: string | undefined;
    readonly amount: Money;
    readonly providerAmount?: Money | undefined;
    readonly fx?: FxSnapshotRef | undefined;
    readonly correctsChargeId?: string | undefined;
    readonly period: string;
    readonly adjustmentPeriod?: string | undefined;
    readonly invoiceId?: string | undefined;
    readonly billingModeTag: BillingModeTag;
    readonly costBase?: CostBaseRef | undefined;
    readonly quantity: string;
    readonly provider: PartyRef;
    readonly recipient: PartyRef;
    readonly leadTime?: LeadTimeClaim | undefined;
}
/**
 * Single-record charge-line invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const chargeLineRules: {
    readonly heldReason: import("./Invariant.ts").Rule<LineShape>;
    readonly creditTarget: import("./Invariant.ts").Rule<LineShape>;
    readonly creditedStatus: import("./Invariant.ts").Rule<LineShape>;
    readonly providerSign: import("./Invariant.ts").Rule<LineShape>;
    readonly adjustmentOrder: import("./Invariant.ts").Rule<LineShape>;
    readonly invoicedDocument: import("./Invariant.ts").Rule<LineShape>;
    readonly fxRequired: import("./Invariant.ts").Rule<LineShape>;
    readonly fxPair: import("./Invariant.ts").Rule<LineShape>;
    readonly costBaseDigest: import("./Invariant.ts").Rule<LineShape>;
    readonly quantitySign: import("./Invariant.ts").Rule<LineShape>;
    readonly distinctParties: import("./Invariant.ts").Rule<LineShape>;
    readonly leadTimeOrder: import("./Invariant.ts").Rule<LineShape>;
};
/**
 * A charge line.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ChargeLine: Schema.Struct<{
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly adjustmentPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    readonly routeId: Schema.brand<Schema.String, "keiretsu/RouteId">;
    readonly legId: Schema.brand<Schema.String, "keiretsu/LegId">;
    readonly agreementId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
    readonly provider: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly recipient: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly billingModeTag: Schema.Literals<readonly ["cost-reimbursement", "cost-plus", "time-and-materials", "fixed-fee", "retainer", "unit-price", "value-based", "revenue-share", "pass-through-disbursement", "no-charge"]>;
    readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly unit: Schema.Literals<readonly ["minute", "value-unit", "period", "amount"]>;
    readonly providerAmount: Schema.optional<Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>>;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly fx: Schema.optional<Schema.Struct<{
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly clauseDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly purpose: Schema.NonEmptyString;
        readonly requestedDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
        readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly pivot: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
        readonly legs: Schema.NonEmptyArray<Schema.Struct<{
            readonly source: Schema.Literals<readonly ["observation", "period-average", "fixed"]>;
            readonly series: Schema.optional<Schema.brand<Schema.String, "keiretsu/FxSeriesId">>;
            readonly base: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly quote: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            readonly unit: Schema.Number;
            readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly orientation: Schema.Literals<readonly ["multiply", "divide"]>;
            readonly rateDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly status: Schema.Literals<readonly ["final", "provisional"]>;
            readonly revisions: Schema.$Array<Schema.Number>;
            readonly observationDigests: Schema.$Array<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly status: Schema.Literals<readonly ["final", "provisional"]>;
        readonly fallbackApplied: Schema.Boolean;
        readonly fallbackReason: Schema.optional<Schema.Literals<readonly ["non-publication-day", "not-observed", "outside-calendar"]>>;
        readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        readonly observationSetDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    readonly costBase: Schema.optional<Schema.Struct<{
        readonly definitionId: Schema.brand<Schema.String, "keiretsu/RuleId">;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>>;
    readonly rounding: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
    readonly allocationIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/AllocationId">>;
    /** Acceptance events (work package) that make outcome-priced lines billable. */
    readonly acceptanceIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/AcceptanceId">>;
    readonly purchaseOrder: Schema.optional<Schema.Struct<{
        readonly number: Schema.NonEmptyString;
        readonly documentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
    }>>;
    readonly status: Schema.Literals<readonly ["estimated", "accrued", "held", "invoiced", "settled", "disputed", "credited"]>;
    readonly holdReasonCode: Schema.optional<Schema.NonEmptyString>;
    readonly invoiceId: Schema.optional<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
    readonly correctsChargeId: Schema.optional<Schema.brand<Schema.String, "keiretsu/ChargeId">>;
    /** Lead-time price class claimed for capacity on this line. */
    readonly leadTime: Schema.optional<Schema.Struct<{
        readonly classKey: Schema.String;
        readonly bookedOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly serviceStart: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/ChargeId">;
}>;
/** @since 0.1.0 @category models */
export type ChargeLine = typeof ChargeLine.Type;
/**
 * Build a revision-1 charge line from a computation. A `hold` disposition yields status `held`.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const fromComputation: (options: {
    readonly id: string;
    readonly computation: ChargeComputation;
    readonly route: TransferRoute;
    readonly period: string;
    readonly allocationIds?: ReadonlyArray<string>;
    readonly acceptanceIds?: ReadonlyArray<string>;
    readonly purchaseOrder?: PurchaseOrderRef;
}) => ChargeLine;
/**
 * Keep the highest revision of each charge id.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const latestChargeLines: (lines: ReadonlyArray<ChargeLine>) => ReadonlyArray<ChargeLine>;
/**
 * The records charge lines are checked against. Agreements are optional; when
 * given, accruing on an agreement that is not executed raises a hold.
 *
 * @since 0.1.0
 * @category models
 */
export interface ChargeContext {
    readonly routes: ReadonlyArray<TransferRoute>;
    readonly allocations: ReadonlyArray<TransferAllocation>;
    readonly agreements?: ReadonlyArray<Agreement>;
}
/**
 * Cross-record checks over charge lines (latest revisions), with codes:
 * `charge.leg-unresolved`, `charge.parties-mismatch`, `charge.mode-mismatch`,
 * `charge.currency-mismatch`, `charge.not-held`, `charge.quantity-mismatch`,
 * `charge.outcome-not-accepted`, `charge.agreement-not-executed` (hold),
 * `charge.lead-time-classes-undeclared`, `charge.lead-time-class-unknown`,
 * `charge.lead-time-class-mismatch`, `charge.credit-target-*`, plus every
 * single-record rule.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateChargeLines: (lines: ReadonlyArray<ChargeLine>, context: ChargeContext) => ReadonlyArray<ValidationIssue>;
export {};
//# sourceMappingURL=ChargeLine.d.ts.map