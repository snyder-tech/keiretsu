import { Effect } from 'effect';
import type { AdmissionAuthorization, AdmissionCommand } from './AdmissionCommand.ts';
import type { AdmissionEntitlement, AdmissionRedemptionId } from './AdmissionEntitlement.ts';
import { AdmissionDenied, AdmissionRevisionConflict, UnsupportedAdmission } from './AdmissionError.ts';
export type AdmissionTransitionError = AdmissionDenied | AdmissionRevisionConflict | UnsupportedAdmission;
/** Pure proposal only. The host must apply it inside its atomic boundary, never after a detached read. */
export declare const transitionAdmission: (options: {
    readonly right: AdmissionEntitlement;
    readonly command: AdmissionCommand;
    readonly authority: AdmissionAuthorization;
    readonly redemptionId: AdmissionRedemptionId;
}) => Effect.Effect<{
    readonly id: string & import("effect/Brand").Brand<"keiretsu/AdmissionEntitlementId">;
    readonly event: {
        readonly _tag: "event";
        readonly id: string & import("effect/Brand").Brand<"keiretsu/AdmissionEventId">;
    };
    readonly status: {
        readonly _tag: "active";
    } | {
        readonly _tag: "revoked";
        readonly revokedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
        readonly reason: string;
    };
    readonly validTo: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly validFrom: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly evidence: readonly {
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[];
    readonly issuer: {
        readonly _tag: "entity";
        readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
    } | {
        readonly _tag: "counterparty";
        readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
    };
    readonly attendee: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
    readonly revision: number;
    readonly credentialGeneration: number;
    readonly credentialId: string & import("effect/Brand").Brand<"keiretsu/AdmissionCredentialId">;
    readonly presentationDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    readonly policy: {
        readonly _tag: "single-entry";
    } | {
        readonly _tag: "multi-entry";
        readonly maximumEntries: number;
    } | {
        readonly _tag: "reentry";
    };
    readonly consumption: {
        readonly _tag: "unused";
    } | {
        readonly _tag: "redeemed";
        readonly redemptionId: string & import("effect/Brand").Brand<"keiretsu/AdmissionRedemptionId">;
        readonly redeemedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    };
    readonly order?: {
        readonly _tag: "sale-order";
        readonly id: string & import("effect/Brand").Brand<"keiretsu/DocumentId">;
    } | undefined;
    readonly slot?: {
        readonly _tag: "event-slot";
        readonly id: string & import("effect/Brand").Brand<"keiretsu/AdmissionSlotId">;
    } | undefined;
    readonly offeringId?: (string & import("effect/Brand").Brand<"keiretsu/OfferingId">) | undefined;
    readonly buyer?: {
        readonly _tag: "entity";
        readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
    } | {
        readonly _tag: "counterparty";
        readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
    } | undefined;
}, AdmissionTransitionError, never>;
//# sourceMappingURL=AdmissionTransition.d.ts.map