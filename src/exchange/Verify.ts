/**
 * Bundle-level verification: content digest, signature policy and version
 * hygiene. Record-level checks (unknown kinds, invalid records, disclosure)
 * are per-record outcomes handled by the receiver.
 *
 * Signatures fail closed:
 * - a signed bundle with no {@link KeyResolver} in context is an error
 *   (`bundle.signature-unverifiable`), never silently trusted;
 * - an unsigned bundle whose audience is outside the issuer's control group
 *   is an error (`bundle.signature-required`); inside the group digest-only
 *   bundles are accepted unless the policy requires signatures there too.
 *
 * @since 0.1.0
 * @module
 */
import { issue, report, type ValidationIssue, type ValidationReport } from '../core/Issue.ts';
import { Effect, Option } from 'effect';

import { bindingOf, type Envelope } from './Bundle.ts';
import { BUNDLE_TYP, verify } from './Jws.ts';
import { KeyResolver } from './KeyResolver.ts';
import { type ControlGroup, crossesGroup } from './Party.ts';
import type { Negotiation } from './SpecVersion.ts';

/**
 * Receiver policy for bundle admission.
 *
 * @since 0.1.0
 * @category models
 */
export interface BundlePolicy {
  /** The issuer's control group, supplied by the adopter (entity package). */
  readonly controlGroup: ControlGroup;
  /** Require signatures inside the control group too (default false). */
  readonly requireSignatureInGroup?: boolean;
}

/**
 * The parts of an opened bundle verification reads.
 *
 * @since 0.1.0
 * @category models
 */
export interface VerifySubject {
  readonly envelope: Envelope;
  readonly digest: string;
  readonly negotiation: Negotiation;
  readonly unknownMembers: ReadonlyArray<string>;
}

const digestIssues = (subject: VerifySubject): ReadonlyArray<ValidationIssue> =>
  subject.digest === subject.envelope.contentDigest
    ? []
    : [issue('bundle.digest-mismatch', 'error', subject.envelope.bundleId, `contentDigest ${subject.envelope.contentDigest} does not match the received envelope (${subject.digest})`)];

const memberIssues = (subject: VerifySubject): ReadonlyArray<ValidationIssue> =>
  subject.negotiation._tag === 'exact'
    ? subject.unknownMembers.map((member) => issue('bundle.unknown-member', 'warning', subject.envelope.bundleId, `member ${member} is not defined in ${subject.negotiation.version}; preserved and ignored`))
    : [];

const signatureIssues = (subject: VerifySubject, policy: BundlePolicy): Effect.Effect<ReadonlyArray<ValidationIssue>> =>
  Effect.gen(function* () {
    const { envelope } = subject;
    if (envelope.signature === undefined) {
      const required = crossesGroup(envelope, policy.controlGroup) || policy.requireSignatureInGroup === true;
      return required ? [issue('bundle.signature-required', 'error', envelope.bundleId, 'bundles leaving the control group must be signed')] : [];
    }
    const resolver = yield* Effect.serviceOption(KeyResolver);
    if (Option.isNone(resolver)) return [issue('bundle.signature-unverifiable', 'error', envelope.bundleId, 'the bundle is signed but no key resolver is configured; refusing to trust it unchecked')];
    return yield* verify(envelope.signature, {
      signer: envelope.issuer,
      typ: BUNDLE_TYP,
      binding: bindingOf(envelope),
      payload: envelope.contentDigest,
      subject: envelope.bundleId,
    }).pipe(Effect.provideService(KeyResolver, resolver.value));
  });

/**
 * Verify an opened bundle. Uses {@link KeyResolver} when it is in context.
 *
 * @since 0.1.0
 * @category verification
 */
export const verifyBundle = (subject: VerifySubject, policy: BundlePolicy): Effect.Effect<ValidationReport> =>
  Effect.map(signatureIssues(subject, policy), (signature) => report([...digestIssues(subject), ...signature, ...memberIssues(subject)]));
