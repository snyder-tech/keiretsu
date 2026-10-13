import { ValidationIssue } from '../core/Issue.ts';
import { Effect, Schema } from 'effect';
import type { Envelope } from './Bundle.ts';
import { type SigningKey } from './Jws.ts';
/**
 * Coded reason for a rejection (issue codes from the invariant catalogue).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Reason: Schema.Struct<{
    readonly code: Schema.String;
    readonly message: Schema.NonEmptyString;
}>;
/** @since 0.1.0 @category models */
export type Reason = typeof Reason.Type;
/** @since 0.1.0 @category schemas */
export declare const RecordOutcome: Schema.Literals<readonly ["accepted", "accepted-in-period", "rejected"]>;
/** @since 0.1.0 @category models */
export type RecordOutcome = typeof RecordOutcome.Type;
/**
 * Outcome for one record of a bundle.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RecordReceipt: Schema.Struct<{
    readonly index: Schema.Number;
    readonly kind: Schema.NonEmptyString;
    readonly recordId: Schema.optional<Schema.NonEmptyString>;
    readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly outcome: Schema.Literals<readonly ["accepted", "accepted-in-period", "rejected"]>;
    readonly receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    readonly reasons: Schema.optional<Schema.NonEmptyArray<Schema.Struct<{
        readonly code: Schema.String;
        readonly message: Schema.NonEmptyString;
    }>>>;
}>;
/** @since 0.1.0 @category models */
export type RecordReceipt = typeof RecordReceipt.Type;
/** @since 0.1.0 @category schemas */
export declare const BundleOutcome: Schema.Literals<readonly ["accepted", "partial", "rejected", "duplicate"]>;
/** @since 0.1.0 @category models */
export type BundleOutcome = typeof BundleOutcome.Type;
/**
 * Receipt before sealing.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const UnsealedReceipt: Schema.Struct<{
    readonly specVersion: Schema.brand<Schema.String, "keiretsu/SpecVersion">;
    readonly bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly receiver: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly seq: Schema.Number;
    /** Digest the receiver computed over what it received. */
    readonly contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    readonly outcome: Schema.Literals<readonly ["accepted", "partial", "rejected", "duplicate"]>;
    readonly records: Schema.$Array<Schema.Struct<{
        readonly index: Schema.Number;
        readonly kind: Schema.NonEmptyString;
        readonly recordId: Schema.optional<Schema.NonEmptyString>;
        readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly outcome: Schema.Literals<readonly ["accepted", "accepted-in-period", "rejected"]>;
        readonly receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
        readonly reasons: Schema.optional<Schema.NonEmptyArray<Schema.Struct<{
            readonly code: Schema.String;
            readonly message: Schema.NonEmptyString;
        }>>>;
    }>>;
    /** Bundle-level findings (digest, signature, version). */
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
    /** For `duplicate`: the digest of the receipt first issued for this bundle. */
    readonly originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type UnsealedReceipt = typeof UnsealedReceipt.Type;
/**
 * Bundle-level receipt, signed by the receiver when policy requires.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BundleReceipt: Schema.Struct<{
    readonly receiptDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly signature: Schema.optional<Schema.String>;
    readonly specVersion: Schema.brand<Schema.String, "keiretsu/SpecVersion">;
    readonly bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly receiver: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly seq: Schema.Number;
    /** Digest the receiver computed over what it received. */
    readonly contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly receivedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
    readonly outcome: Schema.Literals<readonly ["accepted", "partial", "rejected", "duplicate"]>;
    readonly records: Schema.$Array<Schema.Struct<{
        readonly index: Schema.Number;
        readonly kind: Schema.NonEmptyString;
        readonly recordId: Schema.optional<Schema.NonEmptyString>;
        readonly recordDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly outcome: Schema.Literals<readonly ["accepted", "accepted-in-period", "rejected"]>;
        readonly receiverPeriod: Schema.optional<Schema.brand<Schema.String, "keiretsu/Period">>;
        readonly reasons: Schema.optional<Schema.NonEmptyArray<Schema.Struct<{
            readonly code: Schema.String;
            readonly message: Schema.NonEmptyString;
        }>>>;
    }>>;
    /** Bundle-level findings (digest, signature, version). */
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
    /** For `duplicate`: the digest of the receipt first issued for this bundle. */
    readonly originalReceiptDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type BundleReceipt = typeof BundleReceipt.Type;
/**
 * Members excluded from the receipt digest.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const RECEIPT_DIGEST_EXCLUDED: ReadonlyArray<string>;
declare const ReceiptError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "ReceiptError";
} & Readonly<A>;
/**
 * A receipt could not be sealed, signed or read.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ReceiptError extends ReceiptError_base<{
    readonly reason: string;
}> {
}
/**
 * Bundle outcome from record outcomes (an empty bundle is accepted).
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const outcomeOf: (records: ReadonlyArray<RecordReceipt>) => BundleOutcome;
/**
 * Seal a receipt: canonical text with `receiptDigest`.
 *
 * @since 0.1.0
 * @category producing
 */
export declare const sealReceipt: (receipt: UnsealedReceipt) => Effect.Effect<{
    readonly text: string;
    readonly receipt: BundleReceipt;
}, ReceiptError>;
/**
 * Strictly parse and decode receipt text.
 *
 * @since 0.1.0
 * @category parsing
 */
export declare const readReceipt: (text: string) => Effect.Effect<BundleReceipt, ReceiptError>;
/**
 * Sign sealed receipt text as the receiver (`typ` {@link RECEIPT_TYP}). The
 * receipt digest is recomputed from the text first, so stale or edited text is
 * refused rather than signed.
 *
 * @since 0.1.0
 * @category producing
 */
export declare const signReceipt: (options: {
    readonly text: string;
    readonly key: SigningKey;
}) => Effect.Effect<string, ReceiptError>;
/**
 * Original sent envelope context required to verify an acknowledgment.
 *
 * @since 0.1.0
 * @category models
 */
export type ReceiptExpectation = Pick<Envelope, 'issuer' | 'audience' | 'bundleId' | 'seq' | 'specVersion' | 'contentDigest'>;
/**
 * Check a receipt's raw-wire digest, original sent envelope context and signature
 * using the expected audience's key. The outcome still determines acceptance;
 * context and signature verification do not prove business application.
 *
 * @since 0.1.0
 * @category verification
 */
export declare const verifyReceipt: (options: {
    readonly text: string;
    readonly expected: ReceiptExpectation;
    readonly requireSignature: boolean;
}) => Effect.Effect<ReadonlyArray<ValidationIssue>, ReceiptError>;
export {};
//# sourceMappingURL=Receipt.d.ts.map