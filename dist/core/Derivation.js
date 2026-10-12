/**
 * Derivation receipts: how an output was computed, so any number can be replayed
 * (`explain`) by an auditor, transfer-pricing examiner or tax adviser.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Actor } from "./Actor.js";
import { Sha256 } from "./CanonicalJson.js";
import { SubjectRef } from "./Hold.js";
import { DerivationId } from "./Ids.js";
import { Instant } from "./Temporal.js";
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
//# sourceMappingURL=Derivation.js.map