/** Activity/time observations are source facts, not automatically labour. */
import { Effect, Schema } from 'effect';
export declare const WorkObservationId: Schema.brand<Schema.String, "keiretsu/WorkObservationId">;
export type WorkObservationId = typeof WorkObservationId.Type;
export declare const SourceQuantity: Schema.Struct<{
    readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly unit: Schema.NonEmptyString;
}>;
export type SourceQuantity = typeof SourceQuantity.Type;
export declare const SourceMinuteConversion: Schema.Struct<{
    readonly unit: Schema.NonEmptyString;
    readonly minutesPerUnit: Schema.brand<Schema.Struct<{
        readonly numerator: Schema.String;
        readonly denominator: Schema.String;
    }>, "keiretsu/ExactRatio">;
    readonly rounding: Schema.TaggedUnion<{
        readonly exact: Schema.TaggedStruct<"exact", {}>;
        readonly rounded: Schema.TaggedStruct<"rounded", {
            readonly mode: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
        }>;
    }>;
    readonly policyRef: Schema.NonEmptyString;
    readonly policyVersion: Schema.NonEmptyString;
    readonly policyDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type SourceMinuteConversion = typeof SourceMinuteConversion.Type;
declare const SourceConversionConflict_base: Schema.Class<SourceConversionConflict, Schema.TaggedStruct<"SourceConversionConflict", {
    readonly reason: Schema.Literals<readonly ["unit", "fractional-minutes"]>;
}>, import("effect/Cause").YieldableError>;
export declare class SourceConversionConflict extends SourceConversionConflict_base {
}
/** Exact source arithmetic; fractional minutes require the pinned policy's explicit rounding. */
export declare const sourceQuantityToMinutes: (quantity: {
    readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
    readonly unit: string;
}, policy: {
    readonly unit: string;
    readonly minutesPerUnit: {
        readonly numerator: string;
        readonly denominator: string;
    } & import("effect/Brand").Brand<"keiretsu/ExactRatio">;
    readonly rounding: {
        readonly _tag: "exact";
    } | {
        readonly _tag: "rounded";
        readonly mode: "floor" | "half-even" | "half-away-from-zero" | "half-toward-positive" | "toward-zero" | "away-from-zero" | "ceiling";
    };
    readonly policyRef: string;
    readonly policyVersion: string;
    readonly policyDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
    readonly evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
}) => Effect.Effect<bigint, import("../core/ExactRatio.ts").ExactRatioError | SourceConversionConflict, never>;
export declare const ObservedPerformer: Schema.TaggedUnion<{
    readonly unresolved: Schema.TaggedStruct<"unresolved", {
        readonly sourceSubject: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
    }>;
    readonly resolved: Schema.TaggedStruct<"resolved", {
        readonly sourceSubject: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly person: Schema.TaggedUnion<{
            readonly identified: Schema.TaggedStruct<"identified", {
                readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            }>;
            readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                readonly pseudonym: Schema.String;
                readonly epoch: Schema.Number;
            }>;
        }>;
        readonly mapping: Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly targets: Schema.NonEmptyArray<Schema.Struct<{
                readonly namespace: Schema.NonEmptyString;
                readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                readonly id: Schema.NonEmptyString;
            }>>;
            readonly mappingId: Schema.NonEmptyString;
            readonly mappingVersion: Schema.NonEmptyString;
            readonly mappingDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
            readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
            readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>;
    }>;
}>;
export declare const WorkObservation: Schema.Struct<{
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly workDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly performer: Schema.TaggedUnion<{
        readonly unresolved: Schema.TaggedStruct<"unresolved", {
            readonly sourceSubject: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
        }>;
        readonly resolved: Schema.TaggedStruct<"resolved", {
            readonly sourceSubject: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly person: Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>;
            readonly mapping: Schema.Struct<{
                readonly source: Schema.Struct<{
                    readonly installationId: Schema.NonEmptyString;
                    readonly model: Schema.NonEmptyString;
                    readonly recordKey: Schema.NonEmptyString;
                }>;
                readonly targets: Schema.NonEmptyArray<Schema.Struct<{
                    readonly namespace: Schema.NonEmptyString;
                    readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                    readonly id: Schema.NonEmptyString;
                }>>;
                readonly mappingId: Schema.NonEmptyString;
                readonly mappingVersion: Schema.NonEmptyString;
                readonly mappingDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
                readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
                readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>;
        }>;
    }>;
    readonly quantity: Schema.Struct<{
        readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly unit: Schema.NonEmptyString;
    }>;
    readonly work: Schema.$Array<Schema.Struct<{
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
    }>>;
    readonly activity: Schema.optional<Schema.NonEmptyString>;
    readonly narrative: Schema.optional<Schema.String>;
    readonly sourceState: Schema.optional<Schema.NonEmptyString>;
    readonly mappingIssues: Schema.$Array<Schema.NonEmptyString>;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    /** Only an independently admitted/attested event can be cited here. */
    readonly qualifiedEvent: Schema.optional<Schema.TaggedUnion<{
        readonly delivery: Schema.TaggedStruct<"delivery", {
            readonly provider: Schema.brand<Schema.String, "keiretsu/EntityId">;
            readonly receiver: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly deliveredOn: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly valueUnits: Schema.NonEmptyArray<Schema.Struct<{
                readonly valueUnit: Schema.String;
                readonly units: Schema.brand<Schema.String, "keiretsu/Decimal">;
            }>>;
            readonly producedBy: Schema.$Array<Schema.brand<Schema.String, "keiretsu/EventId">>;
            readonly workOrderId: Schema.optional<Schema.brand<Schema.String, "keiretsu/WorkOrderId">>;
            readonly deliverableDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            readonly workObject: Schema.Struct<{
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
            readonly extensions: Schema.optional<Schema.$Record<Schema.String, Schema.Unknown>>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
            readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly revision: Schema.Number;
            readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            readonly id: Schema.brand<Schema.String, "keiretsu/EventId">;
        }>;
        readonly labour: Schema.TaggedStruct<"labour", {
            readonly person: Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>;
            readonly engagementId: Schema.brand<Schema.String, "keiretsu/EngagementId">;
            readonly employer: Schema.brand<Schema.String, "keiretsu/EntityId">;
            readonly relationship: Schema.Union<readonly [Schema.Literals<readonly ["employee", "independent-contractor", "eor-worker", "secondee"]>, Schema.String]>;
            readonly situs: Schema.Struct<{
                readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
                readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
            }>;
            readonly locationEvidence: Schema.Union<readonly [Schema.Literals<readonly ["attested", "device-telemetry", "office-badge", "engagement-default"]>, Schema.String]>;
            readonly workDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly timeZone: Schema.brand<Schema.String, "keiretsu/IanaTimeZone">;
            readonly startedAt: Schema.optional<Schema.brand<Schema.String, "keiretsu/Instant">>;
            readonly minutes: Schema.Number;
            readonly assistedBy: Schema.$Array<Schema.brand<Schema.String, "keiretsu/EventId">>;
            readonly activity: Schema.String;
            readonly billableIntent: Schema.Union<readonly [Schema.Literals<readonly ["billable", "non-billable", "internal", "investment", "business-development"]>, Schema.String]>;
            readonly origin: Schema.TaggedUnion<{
                readonly human: Schema.TaggedStruct<"human", {}>;
                readonly "agent-proposal": Schema.TaggedStruct<"agent-proposal", {
                    readonly proposalId: Schema.brand<Schema.String, "keiretsu/TimeProposalId">;
                    readonly proposalDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
                    readonly promotedBy: Schema.TaggedUnion<{
                        readonly human: Schema.TaggedStruct<"human", {
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
                        readonly agent: Schema.TaggedStruct<"agent", {
                            readonly agentId: Schema.NonEmptyString;
                            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                            readonly model: Schema.optional<Schema.NonEmptyString>;
                            readonly sessionId: Schema.optional<Schema.String>;
                        }>;
                        readonly system: Schema.TaggedStruct<"system", {
                            readonly systemId: Schema.NonEmptyString;
                        }>;
                    }>;
                    readonly promotedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
                }>;
                readonly import: Schema.TaggedStruct<"import", {
                    readonly system: Schema.String;
                    readonly sourceRecordId: Schema.NonEmptyString;
                }>;
            }>;
            readonly attestedBy: Schema.TaggedUnion<{
                readonly human: Schema.TaggedStruct<"human", {
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
                readonly agent: Schema.TaggedStruct<"agent", {
                    readonly agentId: Schema.NonEmptyString;
                    readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                    readonly model: Schema.optional<Schema.NonEmptyString>;
                    readonly sessionId: Schema.optional<Schema.String>;
                }>;
                readonly system: Schema.TaggedStruct<"system", {
                    readonly systemId: Schema.NonEmptyString;
                }>;
            }>;
            readonly attestedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly evidenceDigests: Schema.$Array<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            readonly workOrderId: Schema.optional<Schema.brand<Schema.String, "keiretsu/WorkOrderId">>;
            readonly workObject: Schema.Struct<{
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
            readonly extensions: Schema.optional<Schema.$Record<Schema.String, Schema.Unknown>>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
            readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly revision: Schema.Number;
            readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            readonly id: Schema.brand<Schema.String, "keiretsu/EventId">;
        }>;
        readonly compute: Schema.TaggedStruct<"compute", {
            readonly operator: Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>;
            readonly agentId: Schema.NonEmptyString;
            readonly sessionId: Schema.optional<Schema.String>;
            readonly capability: Schema.optional<Schema.Struct<{
                readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
                readonly version: Schema.NonEmptyString;
            }>>;
            readonly model: Schema.NonEmptyString;
            readonly usageDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly usage: Schema.NonEmptyArray<Schema.Struct<{
                readonly unit: Schema.String;
                readonly count: Schema.Number;
            }>>;
            readonly cost: Schema.Struct<{
                readonly minor: Schema.brand<Schema.String, "keiretsu/MinorUnits">;
                readonly currency: Schema.brand<Schema.String, "keiretsu/CurrencyCode">;
            }>;
            readonly costBearer: Schema.brand<Schema.String, "keiretsu/EntityId">;
            readonly workObject: Schema.Struct<{
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
            readonly extensions: Schema.optional<Schema.$Record<Schema.String, Schema.Unknown>>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
            readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly revision: Schema.Number;
            readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            readonly id: Schema.brand<Schema.String, "keiretsu/EventId">;
        }>;
        readonly "licence-use": Schema.TaggedStruct<"licence-use", {
            readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
            readonly agreementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AgreementId">>;
            readonly licensor: Schema.brand<Schema.String, "keiretsu/EntityId">;
            readonly licensee: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly meter: Schema.String;
            readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly usageFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly usageTo: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly workObject: Schema.Struct<{
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
            readonly extensions: Schema.optional<Schema.$Record<Schema.String, Schema.Unknown>>;
            readonly evidence: Schema.$Array<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
            readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
            readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
            readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
            readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly revision: Schema.Number;
            readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            readonly id: Schema.brand<Schema.String, "keiretsu/EventId">;
        }>;
    }>>;
    readonly eventAdmission: Schema.optional<Schema.Struct<{
        readonly sourceFactsDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly admittedBy: Schema.TaggedStruct<"human", {
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
        readonly admittedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly policyRef: Schema.NonEmptyString;
        readonly policyVersion: Schema.NonEmptyString;
        readonly policyDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly mappingDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly conversion: Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
                readonly unit: Schema.NonEmptyString;
            }>;
            readonly minutes: Schema.Number;
            readonly policy: Schema.Struct<{
                readonly unit: Schema.NonEmptyString;
                readonly minutesPerUnit: Schema.brand<Schema.Struct<{
                    readonly numerator: Schema.String;
                    readonly denominator: Schema.String;
                }>, "keiretsu/ExactRatio">;
                readonly rounding: Schema.TaggedUnion<{
                    readonly exact: Schema.TaggedStruct<"exact", {}>;
                    readonly rounded: Schema.TaggedStruct<"rounded", {
                        readonly mode: Schema.Literals<readonly ["half-away-from-zero", "half-even", "half-toward-positive", "toward-zero", "away-from-zero", "floor", "ceiling"]>;
                    }>;
                }>;
                readonly policyRef: Schema.NonEmptyString;
                readonly policyVersion: Schema.NonEmptyString;
                readonly policyDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
                readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>;
        }>;
        readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/WorkObservationId">;
}>;
export type WorkObservation = typeof WorkObservation.Type;
/** Admission pins source/mapping facts independently of the event and admission itself. */
export declare const observationSourceFactsDigest: (row: WorkObservation) => Effect.Effect<string & import("effect/Brand").Brand<"keiretsu/Sha256">, import("../core/CanonicalJson.ts").CanonicalJsonError, never>;
export declare const WorkSourceCoverage: Schema.Struct<{
    readonly installationId: Schema.NonEmptyString;
    readonly from: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly toExclusive: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly state: Schema.Literals<readonly ["complete", "missing", "held", "unconfigured"]>;
    readonly unresolvedRows: Schema.Int;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type WorkSourceCoverage = typeof WorkSourceCoverage.Type;
export {};
//# sourceMappingURL=WorkObservation.d.ts.map