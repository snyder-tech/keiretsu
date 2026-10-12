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
export const SPEC_VERSION_PATTERN: RegExp = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,4})$/;

/**
 * Wire spec version (open pattern, never a closed literal).
 *
 * @since 0.1.0
 * @category schemas
 */
export const SpecVersion = Schema.String.check(Schema.isPattern(SPEC_VERSION_PATTERN)).pipe(Schema.brand('keiretsu/SpecVersion'));
/** @since 0.1.0 @category models */
export type SpecVersion = typeof SpecVersion.Type;

/**
 * The spec version this package implements.
 *
 * @since 0.1.0
 * @category constants
 */
export const CURRENT: SpecVersion = Schema.decodeSync(SpecVersion)('0.2');

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
export const parse = (version: string): Parsed | undefined => {
  const match = SPEC_VERSION_PATTERN.exec(version);
  if (match === null) return undefined;
  return { major: Number(match[1]), minor: Number(match[2]) };
};

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
export type Negotiation =
  | { readonly _tag: 'exact'; readonly version: string }
  | { readonly _tag: 'newer-minor'; readonly version: string; readonly understood: string }
  | { readonly _tag: 'older-minor'; readonly version: string; readonly understood: string }
  | { readonly _tag: 'unsupported-major'; readonly version: string; readonly supportedMajors: ReadonlyArray<number> }
  | { readonly _tag: 'unsupported-version'; readonly version: string; readonly supportedVersions: ReadonlyArray<string> }
  | { readonly _tag: 'malformed'; readonly version: string };

/**
 * Whether a negotiation lets the receiver process the bundle.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isAccepted = (negotiation: Negotiation): boolean => negotiation._tag === 'exact' || negotiation._tag === 'newer-minor' || negotiation._tag === 'older-minor';

/**
 * Negotiate `received` against the `supported` versions (each `major.minor`).
 *
 * @since 0.1.0
 * @category negotiation
 */
export const negotiate = (received: string, supported: ReadonlyArray<string>): Negotiation => {
  const parsed = parse(received);
  if (parsed === undefined) return { _tag: 'malformed', version: received };
  const known = supported.map(parse).filter((entry): entry is Parsed => entry !== undefined);
  const sameMajor = known.filter((entry) => entry.major === parsed.major);
  if (sameMajor.length === 0) return { _tag: 'unsupported-major', version: received, supportedMajors: [...new Set(known.map((entry) => entry.major))] };
  if (sameMajor.some((entry) => entry.minor === parsed.minor)) return { _tag: 'exact', version: received };
  if (parsed.major === 0) return { _tag: 'unsupported-version', version: received, supportedVersions: supported };
  const highest = sameMajor.reduce((best, entry) => (entry.minor > best.minor ? entry : best));
  const understood = `${highest.major}.${highest.minor}`;
  return parsed.minor > highest.minor ? { _tag: 'newer-minor', version: received, understood } : { _tag: 'older-minor', version: received, understood };
};
