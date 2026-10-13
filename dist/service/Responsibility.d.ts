/** Facts for bilateral work responsibility; hosts own authorization and atomic persistence. */
import { Context, Effect, Schema } from 'effect';
import { Sha256 } from '../core/CanonicalJson.ts';
export declare const ResponsibilityOfferId: Schema.brand<Schema.String, "keiretsu/ResponsibilityOfferId">;
export type ResponsibilityOfferId = typeof ResponsibilityOfferId.Type;
export declare const WorkRevisionRef: Schema.Struct<{
    readonly work: Schema.Struct<{
        readonly system: Schema.String;
        readonly owner: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
        readonly recordId: Schema.NonEmptyString;
        readonly label: Schema.optional<Schema.NonEmptyString>;
    }>;
    readonly revision: Schema.Int;
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type WorkRevisionRef = typeof WorkRevisionRef.Type;
export declare const ResponsibilityOffer: Schema.Struct<{
    readonly decidedBy: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly id: Schema.brand<Schema.String, "keiretsu/ResponsibilityOfferId">;
    readonly mode: Schema.Literals<readonly ["copy", "delegation", "handoff"]>;
    readonly work: Schema.Struct<{
        readonly work: Schema.Struct<{
            readonly system: Schema.String;
            readonly owner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
            readonly recordId: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>;
        readonly revision: Schema.Int;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
    readonly from: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly to: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly responsibility: Schema.NonEmptyString;
    readonly expiresAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
export type ResponsibilityOffer = typeof ResponsibilityOffer.Type;
export declare const ResponsibilityAcceptance: Schema.Struct<{
    readonly decidedBy: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly offerId: Schema.brand<Schema.String, "keiretsu/ResponsibilityOfferId">;
    readonly offerDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly work: Schema.Struct<{
        readonly work: Schema.Struct<{
            readonly system: Schema.String;
            readonly owner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
            readonly recordId: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>;
        readonly revision: Schema.Int;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
}>;
export type ResponsibilityAcceptance = typeof ResponsibilityAcceptance.Type;
export declare const ResponsibilityRelease: Schema.Struct<{
    readonly decidedBy: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly decidedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly offerId: Schema.brand<Schema.String, "keiretsu/ResponsibilityOfferId">;
    readonly offerDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly acceptanceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly work: Schema.Struct<{
        readonly work: Schema.Struct<{
            readonly system: Schema.String;
            readonly owner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
            readonly recordId: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>;
        readonly revision: Schema.Int;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
}>;
export type ResponsibilityRelease = typeof ResponsibilityRelease.Type;
declare const ResponsibilityDenied_base: Schema.Class<ResponsibilityDenied, Schema.TaggedStruct<"ResponsibilityDenied", {
    readonly action: Schema.Literals<readonly ["offer", "accept", "release"]>;
}>, import("effect/Cause").YieldableError>;
export declare class ResponsibilityDenied extends ResponsibilityDenied_base {
}
export declare const ResponsibilityAuthorityRequest: Schema.Struct<{
    readonly action: Schema.Literals<readonly ["offer", "accept", "release"]>;
    readonly party: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly work: Schema.Struct<{
        readonly work: Schema.Struct<{
            readonly system: Schema.String;
            readonly owner: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
            readonly recordId: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>;
        readonly revision: Schema.Int;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
    readonly offerId: Schema.brand<Schema.String, "keiretsu/ResponsibilityOfferId">;
    readonly offerDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly decisionDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly actor: Schema.TaggedStruct<"human", {
        readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
        readonly actingFor: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type ResponsibilityAuthorityRequest = typeof ResponsibilityAuthorityRequest.Type;
declare const ResponsibilityAuthority_base: Context.ServiceClass<ResponsibilityAuthority, "keiretsu/service/ResponsibilityAuthority", {
    readonly authorize: (request: ResponsibilityAuthorityRequest) => Effect.Effect<void, ResponsibilityDenied>;
    /** Verify an existing authorized decision by exact digest; does not authenticate its historical actor as the current caller. */
    readonly verifyPriorDecision: (request: ResponsibilityAuthorityRequest) => Effect.Effect<void, ResponsibilityDenied>;
}>;
/** Host compares authenticated principal and current delegated authority to this exact request. */
export declare class ResponsibilityAuthority extends ResponsibilityAuthority_base {
}
declare const ResponsibilityConflict_base: Schema.Class<ResponsibilityConflict, Schema.TaggedStruct<"ResponsibilityConflict", {
    readonly reason: Schema.Literals<readonly ["party", "expired", "work-revision", "offer", "acceptance", "copy-has-no-transfer"]>;
}>, import("effect/Cause").YieldableError>;
export declare class ResponsibilityConflict extends ResponsibilityConflict_base {
}
export declare const offerResponsibility: (offer: {
    readonly decidedBy: {
        readonly _tag: "human";
        readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        readonly actingFor: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
    };
    readonly decidedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
    readonly id: string & import("effect/Brand").Brand<"keiretsu/ResponsibilityOfferId">;
    readonly mode: "copy" | "delegation" | "handoff";
    readonly work: {
        readonly work: {
            readonly kind: string;
            readonly system: string;
            readonly owner: {
                readonly _tag: "entity";
                readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
            } | {
                readonly _tag: "counterparty";
                readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
            };
            readonly recordId: string;
            readonly label?: string | undefined;
        };
        readonly revision: number;
        readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    };
    readonly from: {
        readonly _tag: "entity";
        readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
    } | {
        readonly _tag: "counterparty";
        readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
    };
    readonly to: {
        readonly _tag: "entity";
        readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
    } | {
        readonly _tag: "counterparty";
        readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
    };
    readonly responsibility: string;
    readonly expiresAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
}) => Effect.Effect<{
    readonly decidedBy: {
        readonly _tag: "human";
        readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        readonly actingFor: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
    };
    readonly decidedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
    readonly id: string & import("effect/Brand").Brand<"keiretsu/ResponsibilityOfferId">;
    readonly mode: "copy" | "delegation" | "handoff";
    readonly work: {
        readonly work: {
            readonly kind: string;
            readonly system: string;
            readonly owner: {
                readonly _tag: "entity";
                readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
            } | {
                readonly _tag: "counterparty";
                readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
            };
            readonly recordId: string;
            readonly label?: string | undefined;
        };
        readonly revision: number;
        readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    };
    readonly from: {
        readonly _tag: "entity";
        readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
    } | {
        readonly _tag: "counterparty";
        readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
    };
    readonly to: {
        readonly _tag: "entity";
        readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
    } | {
        readonly _tag: "counterparty";
        readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
    };
    readonly responsibility: string;
    readonly expiresAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
}, import("../core/CanonicalJson.ts").CanonicalJsonError | ResponsibilityDenied, ResponsibilityAuthority>;
export declare const acceptResponsibility: (input: {
    readonly offer: ResponsibilityOffer;
    readonly offerDigest: Sha256;
    readonly acceptance: ResponsibilityAcceptance;
}) => Effect.Effect<{
    readonly decidedBy: {
        readonly _tag: "human";
        readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        readonly actingFor: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
    };
    readonly decidedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
    readonly offerId: string & import("effect/Brand").Brand<"keiretsu/ResponsibilityOfferId">;
    readonly offerDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    readonly work: {
        readonly work: {
            readonly kind: string;
            readonly system: string;
            readonly owner: {
                readonly _tag: "entity";
                readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
            } | {
                readonly _tag: "counterparty";
                readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
            };
            readonly recordId: string;
            readonly label?: string | undefined;
        };
        readonly revision: number;
        readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    };
}, import("../core/CanonicalJson.ts").CanonicalJsonError | ResponsibilityDenied | ResponsibilityConflict, ResponsibilityAuthority>;
export declare const releaseResponsibility: (input: {
    readonly offer: ResponsibilityOffer;
    readonly offerDigest: Sha256;
    readonly acceptance: ResponsibilityAcceptance;
    readonly acceptanceDigest: Sha256;
    readonly release: ResponsibilityRelease;
}) => Effect.Effect<{
    readonly decidedBy: {
        readonly _tag: "human";
        readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        readonly actingFor: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
    };
    readonly decidedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
    readonly offerId: string & import("effect/Brand").Brand<"keiretsu/ResponsibilityOfferId">;
    readonly offerDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    readonly acceptanceDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    readonly work: {
        readonly work: {
            readonly kind: string;
            readonly system: string;
            readonly owner: {
                readonly _tag: "entity";
                readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
            } | {
                readonly _tag: "counterparty";
                readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
            };
            readonly recordId: string;
            readonly label?: string | undefined;
        };
        readonly revision: number;
        readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    };
}, import("../core/CanonicalJson.ts").CanonicalJsonError | ResponsibilityDenied | ResponsibilityConflict, ResponsibilityAuthority>;
export {};
//# sourceMappingURL=Responsibility.d.ts.map