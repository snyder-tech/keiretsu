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
import { type ValidationReport } from '../core/Issue.ts';
import { Effect } from 'effect';
import { type Envelope } from './Bundle.ts';
import { type ControlGroup } from './Party.ts';
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
/**
 * Verify an opened bundle. Uses {@link KeyResolver} when it is in context.
 *
 * @since 0.1.0
 * @category verification
 */
export declare const verifyBundle: (subject: VerifySubject, policy: BundlePolicy) => Effect.Effect<ValidationReport>;
//# sourceMappingURL=Verify.d.ts.map