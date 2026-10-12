import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';
/**
 * Minutes in one civil day: an integer from 1 to 1,440.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const DayMinutes: Schema.Number;
/**
 * A non-negative safe integer count (tokens, requests, units). Never minutes.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Count: Schema.Number;
/**
 * A strictly positive canonical decimal.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const PositiveDecimal: Schema.brand<Schema.String, "keiretsu/Decimal">;
/**
 * Quantity of a declared value unit (e.g. `test-case`, `migration-object`).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ValueQuantity: Schema.Struct<{
    readonly valueUnit: Schema.String;
    readonly units: Schema.brand<Schema.String, "keiretsu/Decimal">;
}>;
/** @since 0.1.0 @category models */
export type ValueQuantity = typeof ValueQuantity.Type;
/**
 * Legal relationship between performer and employer. Declared, never defaulted.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Relationship: Schema.Union<readonly [Schema.Literals<readonly ["employee", "independent-contractor", "eor-worker", "secondee"]>, Schema.String]>;
/**
 * How the work location is known. A payroll or invoice address never proves it.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LocationEvidence: Schema.Union<readonly [Schema.Literals<readonly ["attested", "device-telemetry", "office-badge", "engagement-default"]>, Schema.String]>;
/**
 * Why the minutes are being recorded (a commercial intent, not a billing decision).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BillableIntent: Schema.Union<readonly [Schema.Literals<readonly ["billable", "non-billable", "internal", "investment", "business-development"]>, Schema.String]>;
/**
 * Lineage of attested minutes: typed by the person, promoted from an agent or
 * system proposal by its owner, or imported from a source system. Lineage is
 * immutable across revisions.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LabourOrigin: Schema.TaggedUnion<{
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
/** @since 0.1.0 @category models */
export type LabourOrigin = typeof LabourOrigin.Type;
/**
 * Fields every economic event carries.
 *
 * @since 0.1.0
 * @category fields
 */
export declare const EventFields: {
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
};
declare const EventUnion: Schema.TaggedUnion<{
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
}>;
type AnyEvent = typeof EventUnion.Type;
/**
 * The civil date on which an event happened (licence use: its first day).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const occurredOn: (event: AnyEvent) => IsoDate;
/**
 * An economic event: `labour`, `compute`, `delivery` or `licence-use`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const EconomicEvent: Schema.TaggedUnion<{
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
}>;
/** @since 0.1.0 @category models */
export type EconomicEvent = typeof EconomicEvent.Type;
/** @since 0.1.0 @category models */
export type LabourEvent = Extract<EconomicEvent, {
    readonly _tag: 'labour';
}>;
/** @since 0.1.0 @category models */
export type ComputeEvent = Extract<EconomicEvent, {
    readonly _tag: 'compute';
}>;
/** @since 0.1.0 @category models */
export type DeliveryEvent = Extract<EconomicEvent, {
    readonly _tag: 'delivery';
}>;
/** @since 0.1.0 @category models */
export type LicenceUseEvent = Extract<EconomicEvent, {
    readonly _tag: 'licence-use';
}>;
/**
 * The current revision of each event id (highest revision wins). Digest-chain
 * verification of `supersedesDigest` belongs to the exchange receiver.
 *
 * @since 0.1.0
 * @category queries
 */
export declare const currentRevisions: (events: ReadonlyArray<EconomicEvent>) => ReadonlyArray<EconomicEvent>;
/**
 * Narrow to labour events.
 *
 * @since 0.1.0
 * @category queries
 */
export declare const labourEvents: (events: ReadonlyArray<EconomicEvent>) => ReadonlyArray<LabourEvent>;
export {};
//# sourceMappingURL=EconomicEvent.d.ts.map