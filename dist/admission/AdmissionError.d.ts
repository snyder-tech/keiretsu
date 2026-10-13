import { Schema } from 'effect';
declare const AdmissionDenied_base: Schema.Class<AdmissionDenied, Schema.TaggedStruct<"AdmissionDenied", {
    readonly reason: Schema.Literals<readonly ["unauthorized", "revoked", "consumed", "credential-mismatch", "scope-mismatch", "outside-validity", "grant-mismatch", "revision-exhausted"]>;
}>, import("effect/Cause").YieldableError>;
export declare class AdmissionDenied extends AdmissionDenied_base {
}
declare const UnsupportedAdmission_base: Schema.Class<UnsupportedAdmission, Schema.TaggedStruct<"UnsupportedAdmission", {
    readonly capability: Schema.Literals<readonly ["multi-entry", "reentry", "offline"]>;
}>, import("effect/Cause").YieldableError>;
export declare class UnsupportedAdmission extends UnsupportedAdmission_base {
}
declare const AdmissionRevisionConflict_base: Schema.Class<AdmissionRevisionConflict, Schema.TaggedStruct<"AdmissionRevisionConflict", {
    readonly expected: Schema.Number;
    readonly actual: Schema.Number;
}>, import("effect/Cause").YieldableError>;
export declare class AdmissionRevisionConflict extends AdmissionRevisionConflict_base {
}
declare const AdmissionIdempotencyConflict_base: Schema.Class<AdmissionIdempotencyConflict, Schema.TaggedStruct<"AdmissionIdempotencyConflict", {
    readonly key: Schema.NonEmptyString;
}>, import("effect/Cause").YieldableError>;
export declare class AdmissionIdempotencyConflict extends AdmissionIdempotencyConflict_base {
}
declare const AdmissionNotFound_base: Schema.Class<AdmissionNotFound, Schema.TaggedStruct<"AdmissionNotFound", {
    readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
}>, import("effect/Cause").YieldableError>;
export declare class AdmissionNotFound extends AdmissionNotFound_base {
}
declare const AdmissionHostFailure_base: Schema.Class<AdmissionHostFailure, Schema.TaggedStruct<"AdmissionHostFailure", {
    readonly operation: Schema.Literals<readonly ["redeem", "replace-credential", "revoke"]>;
}>, import("effect/Cause").YieldableError>;
export declare class AdmissionHostFailure extends AdmissionHostFailure_base {
}
export declare const AdmissionError: Schema.Union<readonly [typeof AdmissionDenied, typeof UnsupportedAdmission, typeof AdmissionRevisionConflict, typeof AdmissionIdempotencyConflict, typeof AdmissionNotFound, typeof AdmissionHostFailure]>;
export type AdmissionError = typeof AdmissionError.Type;
export {};
//# sourceMappingURL=AdmissionError.d.ts.map