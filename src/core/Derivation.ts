/**
 * Derivation receipts: how an output was computed, so any number can be replayed
 * (`explain`) by an auditor, transfer-pricing examiner or tax adviser.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Actor } from './Actor.ts';
import { Sha256 } from './CanonicalJson.ts';
import { SubjectRef } from './Hold.ts';
import { DerivationId } from './Ids.ts';
import { Instant } from './Temporal.ts';

/**
 * Output, the exact inputs and rules (by digest), the function and its version.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Derivation = Schema.Struct({
  id: DerivationId,
  output: SubjectRef,
  outputDigest: Sha256,
  inputs: Schema.Array(SubjectRef),
  rules: Schema.Array(SubjectRef),
  /** Fully qualified function, e.g. `@snyder-tech/keiretsu/commerce/Charge#compute`. */
  function: Schema.NonEmptyString,
  functionVersion: Schema.NonEmptyString,
  specVersion: Schema.String.check(Schema.isPattern(/^\d+\.\d+$/)),
  computedBy: Actor,
  computedAt: Instant,
}).check(Schema.makeFilter((derivation) => (derivation.inputs.every((input) => input.digest !== undefined) ? undefined : 'every derivation input is pinned by digest')));
/** @since 0.1.0 @category models */
export type Derivation = typeof Derivation.Type;

const PinnedSubjectRef = Schema.Struct({ ...SubjectRef.fields, digest: Sha256 });

/**
 * Digest-pinned computation profile. Historical Derivation remains the legacy
 * read codec: its rules may omit digests. New computation receipts use this
 * profile and name every computational rule and configuration snapshot.
 * @since 0.44.12 @category schemas
 */
export const ComputationalDerivation = Schema.Struct({
  ...Derivation.fields,
  profile: Schema.Literal('exact-computation/1'),
  inputs: Schema.Array(PinnedSubjectRef),
  rules: Schema.Array(PinnedSubjectRef),
  configurations: Schema.Array(PinnedSubjectRef),
});
/** @since 0.44.12 @category models */
export type ComputationalDerivation = typeof ComputationalDerivation.Type;
