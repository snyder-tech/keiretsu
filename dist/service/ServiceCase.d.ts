/** A service case is a profile of canonical work, with source-specific policy. */
import { Schema } from 'effect';
import { SourceWorkState } from '../work/SourceWorkMapping.ts';
export declare const ServiceStatusRule: Schema.Struct<{
    readonly scope: Schema.NonEmptyString;
    readonly sourceCode: Schema.NonEmptyString;
    readonly operationalMeaning: Schema.NonEmptyString;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export declare const ServiceProfile: Schema.Struct<{
    readonly id: Schema.NonEmptyString;
    readonly version: Schema.NonEmptyString;
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly sourcePolicyRef: Schema.NonEmptyString;
    readonly statusRules: Schema.$Array<Schema.Struct<{
        readonly scope: Schema.NonEmptyString;
        readonly sourceCode: Schema.NonEmptyString;
        readonly operationalMeaning: Schema.NonEmptyString;
        readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
}>;
export type ServiceProfile = typeof ServiceProfile.Type;
/** Calendar and pause semantics are owned by the named source policy. */
export declare const ServiceObligation: Schema.Struct<{
    readonly id: Schema.NonEmptyString;
    readonly kind: Schema.NonEmptyString;
    readonly sourcePolicyRef: Schema.NonEmptyString;
    readonly sourcePolicyVersion: Schema.NonEmptyString;
    readonly calendarRef: Schema.NonEmptyString;
    readonly calendarVersion: Schema.NonEmptyString;
    readonly clockUnit: Schema.NonEmptyString;
    readonly targetQuantity: Schema.NonEmptyString;
    readonly startsAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly dueAt: Schema.optional<Schema.brand<Schema.String, "keiretsu/Instant">>;
    readonly pauses: Schema.$Array<Schema.Struct<{
        readonly from: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly to: Schema.optional<Schema.brand<Schema.String, "keiretsu/Instant">>;
        readonly reasonCode: Schema.NonEmptyString;
        readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type ServiceObligation = typeof ServiceObligation.Type;
export declare const ServiceCase: Schema.Struct<{
    readonly work: Schema.Struct<{
        readonly ref: Schema.Struct<{
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
        readonly mode: Schema.Literals<readonly ["executable", "container"]>;
        readonly title: Schema.NonEmptyString;
        readonly description: Schema.optional<Schema.String>;
        readonly dueOn: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly relationships: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.Literals<readonly ["parent", "depends-on", "related-to"]>;
            readonly target: Schema.Struct<{
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
            readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
        readonly assignments: Schema.$Array<Schema.Struct<{
            readonly party: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
            readonly people: Schema.$Array<Schema.TaggedUnion<{
                readonly identified: Schema.TaggedStruct<"identified", {
                    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
                }>;
                readonly pseudonymous: Schema.TaggedStruct<"pseudonymous", {
                    readonly pseudonym: Schema.String;
                    readonly epoch: Schema.Number;
                }>;
            }>>;
            readonly role: Schema.NonEmptyString;
            readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
        readonly sourceMappings: Schema.$Array<Schema.Struct<{
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
        }>>;
        readonly sourceStates: Schema.$Array<Schema.Struct<{
            readonly source: Schema.Struct<{
                readonly installationId: Schema.NonEmptyString;
                readonly model: Schema.NonEmptyString;
                readonly recordKey: Schema.NonEmptyString;
            }>;
            readonly profileId: Schema.NonEmptyString;
            readonly profileVersion: Schema.NonEmptyString;
            readonly scope: Schema.NonEmptyString;
            readonly code: Schema.NonEmptyString;
            readonly label: Schema.optional<Schema.NonEmptyString>;
        }>>;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/WorkItemId">;
    }>;
    readonly profile: Schema.Struct<{
        readonly id: Schema.NonEmptyString;
        readonly version: Schema.NonEmptyString;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly sourcePolicyRef: Schema.NonEmptyString;
        readonly statusRules: Schema.$Array<Schema.Struct<{
            readonly scope: Schema.NonEmptyString;
            readonly sourceCode: Schema.NonEmptyString;
            readonly operationalMeaning: Schema.NonEmptyString;
            readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
    readonly sourceStates: Schema.$Array<Schema.Struct<{
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly profileId: Schema.NonEmptyString;
        readonly profileVersion: Schema.NonEmptyString;
        readonly scope: Schema.NonEmptyString;
        readonly code: Schema.NonEmptyString;
        readonly label: Schema.optional<Schema.NonEmptyString>;
    }>>;
    readonly obligations: Schema.$Array<Schema.Struct<{
        readonly id: Schema.NonEmptyString;
        readonly kind: Schema.NonEmptyString;
        readonly sourcePolicyRef: Schema.NonEmptyString;
        readonly sourcePolicyVersion: Schema.NonEmptyString;
        readonly calendarRef: Schema.NonEmptyString;
        readonly calendarVersion: Schema.NonEmptyString;
        readonly clockUnit: Schema.NonEmptyString;
        readonly targetQuantity: Schema.NonEmptyString;
        readonly startsAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly dueAt: Schema.optional<Schema.brand<Schema.String, "keiretsu/Instant">>;
        readonly pauses: Schema.$Array<Schema.Struct<{
            readonly from: Schema.brand<Schema.String, "keiretsu/Instant">;
            readonly to: Schema.optional<Schema.brand<Schema.String, "keiretsu/Instant">>;
            readonly reasonCode: Schema.NonEmptyString;
            readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
        readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly economicEventIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/EventId">>;
    readonly approvals: Schema.$Array<Schema.Struct<{
        readonly workOrderId: Schema.brand<Schema.String, "keiretsu/WorkOrderId">;
        readonly workOrderRevision: Schema.Int;
        readonly workOrderDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly approval: Schema.Struct<{
            readonly stage: Schema.String;
            readonly by: Schema.TaggedUnion<{
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
            readonly at: Schema.brand<Schema.String, "keiretsu/Instant">;
        }>;
    }>>;
    readonly acceptanceIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/AcceptanceId">>;
}>;
export type ServiceCase = typeof ServiceCase.Type;
/** Mapping a source state conveys operational meaning only, never approval/acceptance. */
export declare const serviceStateMeaning: (profile: ServiceProfile, state: SourceWorkState) => string | undefined;
export declare const ServiceProfileRevision: Schema.Struct<{
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly profile: Schema.Struct<{
        readonly id: Schema.NonEmptyString;
        readonly version: Schema.NonEmptyString;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly sourcePolicyRef: Schema.NonEmptyString;
        readonly statusRules: Schema.$Array<Schema.Struct<{
            readonly scope: Schema.NonEmptyString;
            readonly sourceCode: Schema.NonEmptyString;
            readonly operationalMeaning: Schema.NonEmptyString;
            readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                readonly kind: Schema.NonEmptyString;
                readonly ref: Schema.NonEmptyString;
                readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
            }>>;
        }>>;
    }>;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
export type ServiceProfileRevision = typeof ServiceProfileRevision.Type;
//# sourceMappingURL=ServiceCase.d.ts.map