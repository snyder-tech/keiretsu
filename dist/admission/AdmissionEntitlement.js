import { Schema } from 'effect';
import { brand } from "../core/Id.js";
import { OfferingId, PersonId } from "../core/Ids.js";
import { EvidenceRef } from "../core/Envelope.js";
import { PartyRef } from "../core/PartyRef.js";
import { Instant, compareInstants } from "../core/Temporal.js";
import { AdmissionScopeRef } from "./AdmissionScopeRef.js";
import { Sha256 } from "../core/CanonicalJson.js";
export const AdmissionEntitlementId = brand('keiretsu/AdmissionEntitlementId');
export const AdmissionCredentialId = brand('keiretsu/AdmissionCredentialId');
export const AdmissionRedemptionId = brand('keiretsu/AdmissionRedemptionId');
export const AdmissionRevision = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1));
/** Unsupported policies remain representable so consumers can explicitly hold them. */
export const AdmissionPolicy = Schema.TaggedUnion({
    'single-entry': {},
    'multi-entry': { maximumEntries: AdmissionRevision },
    reentry: {},
});
export const AdmissionConsumption = Schema.TaggedUnion({
    unused: {},
    redeemed: { redemptionId: AdmissionRedemptionId, redeemedAt: Instant },
});
/** An issuer-owned right. An offer, order, refund or payment observation cannot issue it. */
export const AdmissionEntitlement = Schema.Struct({
    id: AdmissionEntitlementId,
    issuer: PartyRef,
    event: AdmissionScopeRef.cases.event,
    slot: Schema.optional(AdmissionScopeRef.cases['event-slot']),
    offeringId: Schema.optional(OfferingId),
    order: Schema.optional(AdmissionScopeRef.cases['sale-order']),
    buyer: Schema.optional(PartyRef),
    attendee: PersonId,
    revision: AdmissionRevision,
    credentialGeneration: AdmissionRevision,
    credentialId: AdmissionCredentialId,
    presentationDigest: Sha256,
    policy: AdmissionPolicy,
    status: Schema.TaggedUnion({ active: {}, revoked: { revokedAt: Instant, reason: Schema.NonEmptyString } }),
    consumption: AdmissionConsumption,
    validFrom: Instant,
    validTo: Instant,
    evidence: Schema.Array(EvidenceRef),
}).check(Schema.makeFilter((right) => (compareInstants(right.validFrom, right.validTo) < 0 ? undefined : 'admission validity must be a real, nonempty instant interval')));
//# sourceMappingURL=AdmissionEntitlement.js.map