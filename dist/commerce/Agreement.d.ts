/**
 * Agreements: masters and their bilateral schedules, for customer and
 * intercompany trade alike.
 *
 * Commerce owns the commercial terms (parties, kind, invoice currency, rate
 * clause reference, settlement terms, execution evidence). Transfer-pricing
 * methods, benchmarks and cost-base definitions belong to
 * `@snyder-tech/keiretsu/finance` and are referenced by id and digest.
 *
 * A schedule counts as **executed** only when its status is `executed` and it
 * carries signed evidence pinned by digest; a status alone proves nothing.
 *
 * Capacity terms (`holdRights`, `leadTimeClasses`, see `CapacityTerms`) are
 * optional: a capacity hold is valid only under a hold right of an executed
 * agreement, and a lead-time class claimed by a hold or charge is checked
 * against the agreement's classes.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { type EvidenceRef } from '../core/Envelope.ts';
import type { ValidationIssue } from '../core/Issue.ts';
import { HoldRight, LeadTimeClass } from './CapacityTerms.ts';
import { PartyRef } from './Party.ts';
/**
 * Normative agreement kinds (open with `x-` extensions).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AgreementKind: Schema.Union<readonly [Schema.Literals<readonly ["services", "ip-license", "cost-contribution", "resale", "referral"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type AgreementKind = typeof AgreementKind.Type;
/**
 * Evidence kind that proves execution: a signed copy pinned by digest.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const SIGNED_EVIDENCE_KIND = "signed-copy";
/**
 * Master (common terms) or schedule (bilateral terms under a master).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AgreementLevel: Schema.TaggedUnion<{
    readonly schedule: Schema.TaggedStruct<"schedule", {
        readonly masterId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
        readonly scheduleRef: Schema.NonEmptyString;
    }>;
    readonly master: Schema.TaggedStruct<"master", {}>;
}>;
/** @since 0.1.0 @category models */
export type AgreementLevel = typeof AgreementLevel.Type;
/**
 * When and how invoices are settled.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SettlementTerms: Schema.Struct<{
    readonly cycle: Schema.Union<readonly [Schema.Literals<readonly ["per-invoice", "weekly", "monthly", "quarterly"]>, Schema.String]>;
    readonly netDays: Schema.Number;
    /** Whether set-off against reciprocal balances is permitted by the agreement (law may still forbid it). */
    readonly nettingPermitted: Schema.Boolean;
}>;
/** @since 0.1.0 @category models */
export type SettlementTerms = typeof SettlementTerms.Type;
interface AgreementShape {
    readonly level: AgreementLevel;
    readonly parties: ReadonlyArray<PartyRef>;
    readonly invoiceCurrency?: string | undefined;
    readonly status: string;
    readonly evidence: ReadonlyArray<EvidenceRef>;
    readonly holdRights?: ReadonlyArray<HoldRight> | undefined;
    readonly leadTimeClasses?: ReadonlyArray<LeadTimeClass> | undefined;
}
/**
 * Agreement invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const agreementRules: {
    readonly distinctParties: import("./Invariant.ts").Rule<AgreementShape>;
    readonly scheduleBilateral: import("./Invariant.ts").Rule<AgreementShape>;
    readonly scheduleCurrency: import("./Invariant.ts").Rule<AgreementShape>;
    readonly executedSigned: import("./Invariant.ts").Rule<AgreementShape>;
    readonly uniqueHoldRights: import("./Invariant.ts").Rule<AgreementShape>;
    readonly holdRightParties: import("./Invariant.ts").Rule<AgreementShape>;
    readonly leadTimeClasses: import("./Invariant.ts").Rule<AgreementShape>;
};
/**
 * A master agreement or schedule.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Agreement: Schema.Struct<{
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly level: Schema.TaggedUnion<{
        readonly schedule: Schema.TaggedStruct<"schedule", {
            readonly masterId: Schema.brand<Schema.String, "keiretsu/AgreementId">;
            readonly scheduleRef: Schema.NonEmptyString;
        }>;
        readonly master: Schema.TaggedStruct<"master", {}>;
    }>;
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["services", "ip-license", "cost-contribution", "resale", "referral"]>, Schema.String]>;
    readonly title: Schema.NonEmptyString;
    readonly parties: Schema.$Array<Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly invoiceCurrency: Schema.optional<Schema.brand<Schema.String, "keiretsu/CurrencyCode">>;
    readonly rateClause: Schema.optional<Schema.Struct<{
        readonly seriesId: Schema.String;
        readonly dateRule: Schema.NonEmptyString;
        readonly purpose: Schema.String;
        readonly clauseDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly settlement: Schema.Struct<{
        readonly cycle: Schema.Union<readonly [Schema.Literals<readonly ["per-invoice", "weekly", "monthly", "quarterly"]>, Schema.String]>;
        readonly netDays: Schema.Number;
        /** Whether set-off against reciprocal balances is permitted by the agreement (law may still forbid it). */
        readonly nettingPermitted: Schema.Boolean;
    }>;
    readonly status: Schema.Union<readonly [Schema.Literals<readonly ["proposed", "executed", "terminated"]>, Schema.String]>;
    /** Rights to reserve another party's capacity (capacity holds). */
    readonly holdRights: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly key: Schema.String;
        readonly holder: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly provider: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly roleKeys: Schema.optional<Schema.NonEmptyArray<Schema.String>>;
        readonly maxOutstandingMinutes: Schema.Number;
        readonly minLeadDays: Schema.Number;
        readonly expiryBusinessDays: Schema.Number;
        readonly releaseNoticeBusinessDays: Schema.Number;
        readonly calendarRef: Schema.optional<Schema.String>;
        readonly agentHoldBelowMinutes: Schema.optional<Schema.Number>;
    }>>>;
    /** Lead-time price classes for capacity booked under this agreement. */
    readonly leadTimeClasses: Schema.optional<Schema.$Array<Schema.Struct<{
        readonly key: Schema.String;
        readonly minLeadDays: Schema.Number;
        readonly maxLeadDays: Schema.optional<Schema.Number>;
        readonly discountBps: Schema.Number;
    }>>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/AgreementId">;
}>;
/** @since 0.1.0 @category models */
export type Agreement = typeof Agreement.Type;
/**
 * Whether the agreement is executed (status plus signed, digested evidence) and in force on `date`.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isExecutedOn: (agreement: Agreement, date: string) => boolean;
/**
 * Cross-record checks: a schedule's master exists, is a master, and covers the schedule's parties.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateAgreements: (agreements: ReadonlyArray<Agreement>) => ReadonlyArray<ValidationIssue>;
export {};
//# sourceMappingURL=Agreement.d.ts.map