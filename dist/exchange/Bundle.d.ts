import { type JsonValue, Sha256 } from '../core/CanonicalJson.ts';
import { Effect, Schema } from 'effect';
import { type JsonObject } from './internal/Json.ts';
import { type Binding, type SigningKey } from './Jws.ts';
import { type Negotiation } from './SpecVersion.ts';
/**
 * Top-level members excluded from the content digest.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const DIGEST_EXCLUDED: ReadonlyArray<string>;
/**
 * Extension member names: `x-` followed by a reverse-DNS-ish token.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const EXTENSION_PATTERN: RegExp;
/**
 * One record on the wire, opaque until classified against a profile.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RecordEntry: Schema.Struct<{
    readonly kind: Schema.NonEmptyString;
    readonly schema: Schema.optional<Schema.NonEmptyString>;
    readonly record: Schema.Unknown;
}>;
/** @since 0.1.0 @category models */
export type RecordEntry = typeof RecordEntry.Type;
/**
 * Envelope header a producer supplies (everything except records, digest and signature).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Header: Schema.Struct<{
    readonly specVersion: Schema.brand<Schema.String, "keiretsu/SpecVersion">;
    readonly bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    /** Monotonic per (issuer, audience), from 1. */
    readonly seq: Schema.Number;
    readonly prevBundleDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly issuedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly disclosure: Schema.Literals<readonly ["identified", "pseudonymous", "aggregate"]>;
}>;
/** @since 0.1.0 @category models */
export type Header = typeof Header.Type;
/**
 * The received envelope with opaque records (the decoding schema).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Envelope: Schema.Struct<{
    readonly records: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly schema: Schema.optional<Schema.NonEmptyString>;
        readonly record: Schema.Unknown;
    }>>;
    readonly contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly signature: Schema.optional<Schema.String>;
    readonly specVersion: Schema.brand<Schema.String, "keiretsu/SpecVersion">;
    readonly bundleId: Schema.brand<Schema.String, "keiretsu/BundleId">;
    readonly issuer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly audience: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    /** Monotonic per (issuer, audience), from 1. */
    readonly seq: Schema.Number;
    readonly prevBundleDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly period: Schema.brand<Schema.String, "keiretsu/Period">;
    readonly issuedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly disclosure: Schema.Literals<readonly ["identified", "pseudonymous", "aggregate"]>;
}>;
/** @since 0.1.0 @category models */
export type Envelope = typeof Envelope.Type;
/**
 * Record schemas by kind, exported by domain packages.
 *
 * @since 0.1.0
 * @category models
 */
export type Profile = {
    readonly [kind: string]: Schema.ConstraintCodec<unknown, unknown, never, never>;
};
/**
 * A typed record entry of a profile.
 *
 * @since 0.1.0
 * @category models
 */
export type RecordOf<P extends Profile> = {
    readonly [K in keyof P & string]: {
        readonly kind: K;
        readonly schema?: string;
        readonly record: P[K]['Type'];
    };
}[keyof P & string];
/**
 * Codec for bundles over one profile.
 *
 * @since 0.1.0
 * @category models
 */
export interface BundleCodec<P extends Profile> {
    readonly profile: P;
    readonly kinds: ReadonlySet<string>;
    readonly Envelope: typeof Envelope;
    readonly Header: typeof Header;
}
/**
 * Build a bundle codec over a record profile.
 *
 * @example
 * ```ts
 * const codec = makeBundleSchema({ 'kwx.time': TimeRecord, 'kwx.charge': ChargeLine })
 * ```
 * @since 0.1.0
 * @category constructors
 */
export declare const makeBundleSchema: <const P extends Profile>(profile: P) => BundleCodec<P>;
/**
 * A producer's bundle before sealing.
 *
 * @since 0.1.0
 * @category models
 */
export type UnsealedBundle<P extends Profile> = Header & {
    readonly records: ReadonlyArray<RecordOf<P>>;
    /** Top-level extension members; names must match {@link EXTENSION_PATTERN}. */
    readonly extensions?: Readonly<Record<string, JsonValue>>;
};
/**
 * Sealed wire text and its content digest.
 *
 * @since 0.1.0
 * @category models
 */
export interface Sealed {
    readonly text: string;
    readonly contentDigest: Sha256;
}
declare const SealError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "SealError";
} & Readonly<A>;
/**
 * A bundle could not be sealed or signed.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class SealError extends SealError_base<{
    readonly reason: string;
}> {
}
declare const BundleDecodeError_base: Schema.Class<BundleDecodeError, Schema.TaggedStruct<"BundleDecodeError", {
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Received text is not a decodable bundle envelope.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class BundleDecodeError extends BundleDecodeError_base {
}
declare const UnsupportedMajor_base: Schema.Class<UnsupportedMajor, Schema.TaggedStruct<"UnsupportedMajor", {
    readonly version: Schema.String;
    readonly supportedMajors: Schema.$Array<Schema.Number>;
}>, import("effect/Cause").YieldableError>;
/**
 * The bundle's major version is not supported; the bundle is rejected unread.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class UnsupportedMajor extends UnsupportedMajor_base {
}
/**
 * Seal a bundle: encode the header and every record with its kind's schema,
 * canonicalise, digest through the receiver's path and render canonical text.
 * The result is decoded once more as a self-check.
 *
 * @since 0.1.0
 * @category producing
 */
export declare const seal: <P extends Profile>(codec: BundleCodec<P>, bundle: UnsealedBundle<P>) => Effect.Effect<Sealed, SealError>;
/**
 * Claims a bundle signature binds.
 *
 * @since 0.1.0
 * @category signing
 */
export declare const bindingOf: (envelope: Pick<Envelope, "issuer" | "audience" | "bundleId" | "seq" | "specVersion">) => Binding;
/**
 * Add a detached JWS over `contentDigest` to sealed text. The digest does not
 * change: `signature` is excluded from it.
 *
 * @since 0.1.0
 * @category producing
 */
export declare const signBundle: (options: {
    readonly text: string;
    readonly key: SigningKey;
}) => Effect.Effect<string, SealError>;
/**
 * Classification of one received record.
 *
 * @since 0.1.0
 * @category models
 */
export type EntryOutcome<P extends Profile> = {
    readonly _tag: 'known';
    readonly index: number;
    readonly kind: string;
    readonly recordDigest: Sha256;
    readonly raw: unknown;
    readonly entry: RecordOf<P>;
} | {
    readonly _tag: 'unknown-kind';
    readonly index: number;
    readonly kind: string;
    readonly recordDigest: Sha256;
    readonly raw: unknown;
} | {
    readonly _tag: 'invalid';
    readonly index: number;
    readonly kind: string;
    readonly recordDigest: Sha256;
    readonly raw: unknown;
    readonly reason: string;
};
/**
 * A received bundle: the exact text, the strictly parsed JSON, the decoded
 * envelope, the digest computed from the text and the classified records.
 *
 * @since 0.1.0
 * @category models
 */
export interface Opened<P extends Profile> {
    readonly text: string;
    readonly raw: JsonObject;
    readonly envelope: Envelope;
    readonly digest: Sha256;
    readonly negotiation: Negotiation;
    /** Top-level `x-` members, preserved verbatim. */
    readonly extensions: Readonly<Record<string, JsonValue>>;
    /** Top-level members this version does not define and that are not `x-` (preserved in `raw`). */
    readonly unknownMembers: ReadonlyArray<string>;
    readonly entries: ReadonlyArray<EntryOutcome<P>>;
}
/**
 * Open received text: strict parse (no duplicate members, no lone
 * surrogates), negotiate the version, digest the text, decode the envelope
 * and classify each record against the profile.
 *
 * @since 0.1.0
 * @category receiving
 */
export declare const open: <P extends Profile>(codec: BundleCodec<P>, text: string, options?: {
    readonly supported?: ReadonlyArray<string>;
}) => Effect.Effect<Opened<P>, BundleDecodeError | UnsupportedMajor>;
export {};
//# sourceMappingURL=Bundle.d.ts.map