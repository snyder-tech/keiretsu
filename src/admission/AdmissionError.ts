import { Schema } from 'effect';
import { AdmissionEntitlementId, AdmissionRevision } from './AdmissionEntitlement.ts';

export class AdmissionDenied extends Schema.TaggedError<AdmissionDenied>()('AdmissionDenied', {
  reason: Schema.Literals(['unauthorized', 'revoked', 'consumed', 'credential-mismatch', 'scope-mismatch', 'outside-validity', 'grant-mismatch', 'revision-exhausted']),
}) {}
export class UnsupportedAdmission extends Schema.TaggedError<UnsupportedAdmission>()('UnsupportedAdmission', {
  capability: Schema.Literals(['multi-entry', 'reentry', 'offline']),
}) {}
export class AdmissionRevisionConflict extends Schema.TaggedError<AdmissionRevisionConflict>()('AdmissionRevisionConflict', {
  expected: AdmissionRevision,
  actual: AdmissionRevision,
}) {}
export class AdmissionIdempotencyConflict extends Schema.TaggedError<AdmissionIdempotencyConflict>()('AdmissionIdempotencyConflict', {
  key: Schema.NonEmptyString,
}) {}
export class AdmissionNotFound extends Schema.TaggedError<AdmissionNotFound>()('AdmissionNotFound', {
  entitlementId: AdmissionEntitlementId,
}) {}
export class AdmissionHostFailure extends Schema.TaggedError<AdmissionHostFailure>()('AdmissionHostFailure', {
  operation: Schema.Literals(['redeem', 'replace-credential', 'revoke']),
}) {}
export const AdmissionError = Schema.Union([AdmissionDenied, UnsupportedAdmission, AdmissionRevisionConflict, AdmissionIdempotencyConflict, AdmissionNotFound, AdmissionHostFailure]);
export type AdmissionError = typeof AdmissionError.Type;
