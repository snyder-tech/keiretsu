import { Context, Effect, Schema } from 'effect';
import { type CanonicalJsonError, type Sha256 } from '../core/CanonicalJson.ts';
import { AdmissionCommand, AdmissionReceipt, AdmissionAuthorization } from './AdmissionCommand.ts';
import { AdmissionDenied, AdmissionHostFailure, type AdmissionError } from './AdmissionError.ts';
export interface AdmissionAuthorityShape {
    /** Resolve authenticated context; authorize issuer, event/slot, gate/device and operation.
     * Never trust a caller's actor claim or a source-system state as authority. */
    readonly authorize: (command: AdmissionCommand, requestDigest: Sha256) => Effect.Effect<AdmissionAuthorization, AdmissionDenied>;
}
declare const AdmissionAuthority_base: Context.ServiceClass<AdmissionAuthority, "@snyder-tech/keiretsu/admission/AdmissionAuthority", AdmissionAuthorityShape>;
export declare class AdmissionAuthority extends AdmissionAuthority_base {
}
export interface AdmissionHostShape {
    /** One durable transaction must revalidate grant/revocation/time, compare current revision,
     * credential generation/digest, consume the right, and persist the receipt + idempotency binding.
     * Keys are issuer-scoped. Same key+digest replays the original receipt; a different digest fails.
     * Replay still requires current authenticated authority. Replacement/revocation use the same CAS.
     * No success may escape before all writes commit. Hosts own IDs, Clock and durable storage.
     */
    readonly commitAtomic: (command: AdmissionCommand, authorization: AdmissionAuthorization) => Effect.Effect<AdmissionReceipt, AdmissionError>;
}
declare const AdmissionHost_base: Context.ServiceClass<AdmissionHost, "@snyder-tech/keiretsu/admission/AdmissionHost", AdmissionHostShape>;
export declare class AdmissionHost extends AdmissionHost_base {
}
/** The only ingress accepts commands, never a caller-supplied authorization grant. */
export declare const executeAdmission: (input: unknown) => Effect.Effect<{
    readonly operation: "redeem" | "replace-credential" | "revoke";
    readonly revision: number;
    readonly entitlementId: string & import("effect/Brand").Brand<"keiretsu/AdmissionEntitlementId">;
    readonly idempotencyKey: string;
    readonly requestDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    readonly authorizedBy: {
        readonly _tag: "human";
        readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        readonly actingFor: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
    } | {
        readonly _tag: "agent";
        readonly agentId: string;
        readonly operatorPersonId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        readonly model?: string | undefined;
        readonly sessionId?: string | undefined;
    } | {
        readonly _tag: "system";
        readonly systemId: string;
    };
    readonly committedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly redemptionId?: (string & import("effect/Brand").Brand<"keiretsu/AdmissionRedemptionId">) | undefined;
    readonly scanId?: (string & import("effect/Brand").Brand<"keiretsu/ScanObservationId">) | undefined;
}, Schema.SchemaError | CanonicalJsonError | AdmissionDenied | import("./AdmissionError.ts").UnsupportedAdmission | import("./AdmissionError.ts").AdmissionRevisionConflict | import("./AdmissionError.ts").AdmissionIdempotencyConflict | import("./AdmissionError.ts").AdmissionNotFound | AdmissionHostFailure, AdmissionAuthority | AdmissionHost>;
export {};
//# sourceMappingURL=AdmissionHost.d.ts.map