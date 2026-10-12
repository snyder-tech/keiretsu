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
/**
 * Basis of a claimant attribution.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AttributionBasis: Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder"]>;
/** @since 0.1.0 @category models */
export type AttributionBasis = typeof AttributionBasis.Type;
/**
 * A claimant attribution. Its status is always `candidate`; acceptance lives
 * in an adopter's decision record, never here.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ClaimantAttribution: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/AttributionId">;
    readonly sliceId: Schema.brand<Schema.String, "keiretsu/AttributionId">;
    readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
    readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly regimeId: Schema.brand<Schema.String, "keiretsu/RegimeId">;
    readonly taxYear: Schema.brand<Schema.String, "keiretsu/TaxYearLabel">;
    readonly claimant: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly basis: Schema.Literals<readonly ["wage-payer", "cost-bearer", "risk-bearer", "rights-holder"]>;
    readonly controlledGroupRef: Schema.optional<Schema.brand<Schema.String, "keiretsu/AttributionId">>;
    readonly fundingAssessmentId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AttributionId">>;
    readonly passThroughToOwners: Schema.Boolean;
    readonly status: Schema.Literal<"candidate">;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type ClaimantAttribution = typeof ClaimantAttribution.Type;
/**
 * The uniqueness key.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const uniquenessKey: (attribution: Pick<ClaimantAttribution, "eventId" | "eventDigest" | "sliceId" | "regimeId">) => string;
//# sourceMappingURL=ClaimantAttribution.d.ts.map