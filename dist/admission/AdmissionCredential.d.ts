import { Schema } from 'effect';
/** Presentation material references a right and its generation; it does not carry authority. */
export declare const AdmissionCredential: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/AdmissionCredentialId">;
    readonly entitlementId: Schema.brand<Schema.String, "keiretsu/AdmissionEntitlementId">;
    readonly generation: Schema.Number;
    readonly presentationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type AdmissionCredential = typeof AdmissionCredential.Type;
export type AdmissionCredentialEncoded = typeof AdmissionCredential.Encoded;
//# sourceMappingURL=AdmissionCredential.d.ts.map