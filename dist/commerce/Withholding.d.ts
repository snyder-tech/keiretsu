/**
 * Withholding certificates.
 *
 * Withholding (India TDS, Pakistan s.153, US §1446 …) is recorded as its own
 * record, never on the invoice amount: it reduces the **cash expected**, not
 * revenue or the invoice payable. The amount becomes a tax asset or foreign
 * tax paid in the finance package. The regime and income character are
 * determined by people; this package records them. Decision support;
 * professional review required.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { type Money as MoneyType } from '../core/Money.ts';
import { PartyRef } from './Party.ts';
interface CertificateShape {
    readonly deductor: PartyRef;
    readonly deductee: PartyRef;
    readonly base: MoneyType;
    readonly amount: MoneyType;
}
/**
 * Certificate invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export declare const withholdingRules: {
    readonly parties: import("./Invariant.ts").Rule<CertificateShape>;
    readonly currency: import("./Invariant.ts").Rule<CertificateShape>;
    readonly bounds: import("./Invariant.ts").Rule<CertificateShape>;
};
/**
 * A withholding certificate (or the expectation of one).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WithholdingCertificate: Schema.Struct<{
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    /** Open regime code, e.g. `in-tds-194j`, `pk-ito-153`, `us-1446`. */
    readonly regime: Schema.String;
    /** Income character as determined by a person (`fts`, `royalty`, `business-profits` …). */
    readonly character: Schema.String;
    readonly deductor: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly deductee: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly documentIds: Schema.NonEmptyArray<Schema.brand<Schema.String, "keiretsu/DocumentId">>;
    readonly base: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly rate: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly amount: Schema.Struct<{
        readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
        readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
    }>;
    readonly form: Schema.optional<Schema.String>;
    readonly certificateNumber: Schema.optional<Schema.NonEmptyString>;
    readonly status: Schema.Literals<readonly ["expected", "received", "reconciled", "disputed"]>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/DocumentId">;
}>;
/** @since 0.1.0 @category models */
export type WithholdingCertificate = typeof WithholdingCertificate.Type;
/**
 * Cash expected for a document: its payable less withholding certificates that cite it.
 * The document's payable (and revenue) is unchanged.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const expectedCash: (document: {
    readonly id: string;
    readonly payable: MoneyType;
}, certificates: ReadonlyArray<WithholdingCertificate>) => MoneyType;
export {};
//# sourceMappingURL=Withholding.d.ts.map