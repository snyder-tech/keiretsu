/**
 * Claimant attributions: for one slice, one regime and one taxable year, the
 * legal entity proposed as candidate claimant and the basis for it.
 *
 * Uniqueness key: `(eventId, eventDigest, sliceId, regimeId)` across **all**
 * claimants, including those in received bundles, so the performer's wage claim
 * and the payer's contract-research claim on the same minutes collide.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { AttributionId, EventId, RegimeId } from "../core/Ids.js";
import { Instant } from "../core/Temporal.js";
import { TaxYearLabel } from "./TaxYear.js";
/**
 * Basis of a claimant attribution.
 *
 * @since 0.1.0
 * @category schemas
 */
export const AttributionBasis = Schema.Literals(['wage-payer', 'cost-bearer', 'risk-bearer', 'rights-holder']);
/**
 * A claimant attribution. Its status is always `candidate`; acceptance lives
 * in an adopter's decision record, never here.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ClaimantAttribution = Schema.Struct({
    id: AttributionId,
    sliceId: AttributionId,
    eventId: EventId,
    eventDigest: Sha256,
    regimeId: RegimeId,
    taxYear: TaxYearLabel,
    claimant: EntityId,
    basis: AttributionBasis,
    controlledGroupRef: Schema.optional(AttributionId),
    fundingAssessmentId: Schema.optional(AttributionId),
    passThroughToOwners: Schema.Boolean,
    status: Schema.Literal('candidate'),
    recordedAt: Instant,
});
/**
 * The uniqueness key.
 *
 * @since 0.1.0
 * @category accessors
 */
export const uniquenessKey = (attribution) => `${attribution.eventId}|${attribution.eventDigest}|${attribution.sliceId}|${attribution.regimeId}`;
//# sourceMappingURL=ClaimantAttribution.js.map