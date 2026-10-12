/**
 * Spec versions and negotiation.
 *
 * `specVersion` is `major.minor`. Before 1.0, each version is a distinct
 * wire contract and receivers accept only explicitly supported versions.
 * From 1.0, minors are additive only (new optional
 * fields, new record kinds, new code values); anything else is a new major.
 * A receiver therefore accepts any minor of a major it supports, preserving
 * fields it does not know, and rejects an unknown major outright.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/**
 * `major.minor` without leading zeros.
 *
 * @since 0.1.0
 * @category patterns
 */
export declare const SPEC_VERSION_PATTERN: RegExp;
/**
 * Wire spec version (open pattern, never a closed literal).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const SpecVersion: Schema.brand<Schema.String, "keiretsu/SpecVersion">;
/** @since 0.1.0 @category models */
export type SpecVersion = typeof SpecVersion.Type;
/**
 * The spec version this package implements.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const CURRENT: SpecVersion;
/**
 * A parsed version.
 *
 * @since 0.1.0
 * @category models
 */
export interface Parsed {
    readonly major: number;
    readonly minor: number;
}
/**
 * Parse a version string; `undefined` when it is not `major.minor`.
 *
 * @since 0.1.0
 * @category parsing
 */
export declare const parse: (version: string) => Parsed | undefined;
/**
 * Outcome of negotiating a received version against the versions a receiver supports.
 *
 * - `exact`: a supported version.
 * - `newer-minor`: same major, newer minor; unknown members are preserved and ignored.
 * - `older-minor`: same major, older minor; fields added later are simply absent.
 * - `unsupported-major` / `malformed`: reject the bundle.
 *
 * @since 0.1.0
 * @category models
 */
export type Negotiation = {
    readonly _tag: 'exact';
    readonly version: string;
} | {
    readonly _tag: 'newer-minor';
    readonly version: string;
    readonly understood: string;
} | {
    readonly _tag: 'older-minor';
    readonly version: string;
    readonly understood: string;
} | {
    readonly _tag: 'unsupported-major';
    readonly version: string;
    readonly supportedMajors: ReadonlyArray<number>;
} | {
    readonly _tag: 'unsupported-version';
    readonly version: string;
    readonly supportedVersions: ReadonlyArray<string>;
} | {
    readonly _tag: 'malformed';
    readonly version: string;
};
/**
 * Whether a negotiation lets the receiver process the bundle.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isAccepted: (negotiation: Negotiation) => boolean;
/**
 * Negotiate `received` against the `supported` versions (each `major.minor`).
 *
 * @since 0.1.0
 * @category negotiation
 */
export declare const negotiate: (received: string, supported: ReadonlyArray<string>) => Negotiation;
//# sourceMappingURL=SpecVersion.d.ts.map