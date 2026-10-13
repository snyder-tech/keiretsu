import { Schema } from 'effect';
import { brand } from '../core/Id.ts';
import { OfferingId, PersonId } from '../core/Ids.ts';
import { EvidenceRef } from '../core/Envelope.ts';
import { PartyRef } from '../core/PartyRef.ts';
import { Instant, compareInstants } from '../core/Temporal.ts';
import { AdmissionScopeRef } from './AdmissionScopeRef.ts';
import { Sha256 } from '../core/CanonicalJson.ts';

export const AdmissionEntitlementId = brand('keiretsu/AdmissionEntitlementId');
export type AdmissionEntitlementId = typeof AdmissionEntitlementId.Type;
export const AdmissionCredentialId = brand('keiretsu/AdmissionCredentialId');
export type AdmissionCredentialId = typeof AdmissionCredentialId.Type;
export const AdmissionRedemptionId = brand('keiretsu/AdmissionRedemptionId');
export type AdmissionRedemptionId = typeof AdmissionRedemptionId.Type;
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
export type AdmissionEntitlement = typeof AdmissionEntitlement.Type;
export type AdmissionEntitlementEncoded = typeof AdmissionEntitlement.Encoded;
