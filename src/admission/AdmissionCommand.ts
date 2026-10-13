import { Schema } from 'effect';
import { AdmissionEntitlementId, AdmissionRevision, AdmissionRedemptionId } from './AdmissionEntitlement.ts';
import { AdmissionCredential } from './AdmissionCredential.ts';
import { ScanObservation, ScanObservationId } from './ScanObservation.ts';
import { PartyRef } from '../core/PartyRef.ts';
import { Instant } from '../core/Temporal.ts';
import { Actor } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';

const Common = {
  entitlementId: AdmissionEntitlementId,
  expectedRevision: AdmissionRevision,
  idempotencyKey: Schema.NonEmptyString,
};
export const AdmissionCommand = Schema.TaggedUnion({
  redeem: { ...Common, credential: AdmissionCredential, scan: ScanObservation },
  'replace-credential': { ...Common, replacement: AdmissionCredential },
  revoke: { ...Common, reason: Schema.NonEmptyString },
});
export type AdmissionCommand = typeof AdmissionCommand.Type;
export type AdmissionCommandEncoded = typeof AdmissionCommand.Encoded;

/** Created only by the host's authority port from authenticated policy context. */
export const AdmissionAuthorization = Schema.Struct({
  issuer: PartyRef,
  requestDigest: Sha256,
  authorizedBy: Actor,
  authorizedAt: Instant,
});
export type AdmissionAuthorization = typeof AdmissionAuthorization.Type;

/** Declared implementation capability: unsupported policies must be held or refused. */
export const AdmissionCapabilities = Schema.Struct({
  onlineSingleEntry: Schema.Literal(true),
  multiEntry: Schema.Literal(false),
  reentry: Schema.Literal(false),
  offline: Schema.Literal(false),
});
export const admissionCapabilities: typeof AdmissionCapabilities.Type = {
  onlineSingleEntry: true,
  multiEntry: false,
  reentry: false,
  offline: false,
};

export const AdmissionReceipt = Schema.Struct({
  entitlementId: AdmissionEntitlementId,
  revision: AdmissionRevision,
  operation: Schema.Literals(['redeem', 'replace-credential', 'revoke']),
  requestDigest: Sha256,
  idempotencyKey: Schema.NonEmptyString,
  authorizedBy: Actor,
  committedAt: Instant,
  redemptionId: Schema.optional(AdmissionRedemptionId),
  scanId: Schema.optional(ScanObservationId),
}).check(
  Schema.makeFilter((receipt) =>
    receipt.operation === 'redeem'
      ? receipt.redemptionId !== undefined && receipt.scanId !== undefined
        ? undefined
        : 'redemption receipts require both redemption and scan IDs'
      : receipt.redemptionId === undefined && receipt.scanId === undefined
        ? undefined
        : 'non-redemption receipts carry no redemption or scan IDs',
  ),
);
export type AdmissionReceipt = typeof AdmissionReceipt.Type;
