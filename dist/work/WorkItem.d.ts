/** Canonical executable work and its containers; source statuses are observations. */
import { Effect, Schema } from 'effect';
export declare const WorkItemId: Schema.brand<Schema.String, "keiretsu/WorkItemId">;
export type WorkItemId = typeof WorkItemId.Type;
export declare const WorkRelationship: Schema.Struct<{
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
}>;
export type WorkRelationship = typeof WorkRelationship.Type;
export declare const WorkAssignment: Schema.Struct<{
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
}>;
export type WorkAssignment = typeof WorkAssignment.Type;
export declare const WorkItem: Schema.Struct<{
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
export type WorkItem = typeof WorkItem.Type;
declare const WorkHierarchyConflict_base: Schema.Class<WorkHierarchyConflict, Schema.TaggedStruct<"WorkHierarchyConflict", {
    readonly subjects: Schema.NonEmptyArray<Schema.String>;
}>, import("effect/Cause").YieldableError>;
export declare class WorkHierarchyConflict extends WorkHierarchyConflict_base {
}
/** Check the full authorized hierarchy, including hidden ancestors, before filtering. */
export declare const validateWorkHierarchy: (items: readonly {
    readonly id: string & import("effect/Brand").Brand<"keiretsu/WorkItemId">;
    readonly title: string;
    readonly validFrom: string & import("effect/Brand").Brand<"keiretsu/IsoDate">;
    readonly recordedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly ref: {
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
    readonly evidence: readonly {
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[];
    readonly revision: number;
    readonly mode: "container" | "executable";
    readonly relationships: readonly {
        readonly kind: "parent" | "depends-on" | "related-to";
        readonly target: {
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
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    }[];
    readonly assignments: readonly {
        readonly party: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
        readonly people: readonly ({
            readonly _tag: "identified";
            readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        } | {
            readonly _tag: "pseudonymous";
            readonly pseudonym: string;
            readonly epoch: number;
        })[];
        readonly role: string;
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    }[];
    readonly sourceMappings: readonly {
        readonly source: {
            readonly installationId: string;
            readonly model: string;
            readonly recordKey: string;
        };
        readonly targets: readonly [{
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        }, ...{
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        }[]];
        readonly mappingId: string;
        readonly mappingVersion: string;
        readonly mappingDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly sourceDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    }[];
    readonly sourceStates: readonly {
        readonly code: string;
        readonly source: {
            readonly installationId: string;
            readonly model: string;
            readonly recordKey: string;
        };
        readonly scope: string;
        readonly profileId: string;
        readonly profileVersion: string;
        readonly label?: string | undefined;
    }[];
    readonly description?: string | undefined;
    readonly validTo?: (string & import("effect/Brand").Brand<"keiretsu/IsoDate">) | undefined;
    readonly supersedesDigest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    readonly dueOn?: (string & import("effect/Brand").Brand<"keiretsu/IsoDate">) | undefined;
}[]) => Effect.Effect<readonly {
    readonly id: string & import("effect/Brand").Brand<"keiretsu/WorkItemId">;
    readonly title: string;
    readonly validFrom: string & import("effect/Brand").Brand<"keiretsu/IsoDate">;
    readonly recordedAt: string & import("effect/Brand").Brand<"keiretsu/Instant">;
    readonly ref: {
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
    readonly evidence: readonly {
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[];
    readonly revision: number;
    readonly mode: "container" | "executable";
    readonly relationships: readonly {
        readonly kind: "parent" | "depends-on" | "related-to";
        readonly target: {
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
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    }[];
    readonly assignments: readonly {
        readonly party: {
            readonly _tag: "entity";
            readonly entityId: string & import("effect/Brand").Brand<"keiretsu/EntityId">;
        } | {
            readonly _tag: "counterparty";
            readonly counterpartyId: string & import("effect/Brand").Brand<"keiretsu/CounterpartyId">;
        };
        readonly people: readonly ({
            readonly _tag: "identified";
            readonly personId: string & import("effect/Brand").Brand<"keiretsu/PersonId">;
        } | {
            readonly _tag: "pseudonymous";
            readonly pseudonym: string;
            readonly epoch: number;
        })[];
        readonly role: string;
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    }[];
    readonly sourceMappings: readonly {
        readonly source: {
            readonly installationId: string;
            readonly model: string;
            readonly recordKey: string;
        };
        readonly targets: readonly [{
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        }, ...{
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        }[]];
        readonly mappingId: string;
        readonly mappingVersion: string;
        readonly mappingDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly sourceDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly evidence: readonly [{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }, ...{
            readonly kind: string;
            readonly ref: string;
            readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
        }[]];
    }[];
    readonly sourceStates: readonly {
        readonly code: string;
        readonly source: {
            readonly installationId: string;
            readonly model: string;
            readonly recordKey: string;
        };
        readonly scope: string;
        readonly profileId: string;
        readonly profileVersion: string;
        readonly label?: string | undefined;
    }[];
    readonly description?: string | undefined;
    readonly validTo?: (string & import("effect/Brand").Brand<"keiretsu/IsoDate">) | undefined;
    readonly supersedesDigest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    readonly dueOn?: (string & import("effect/Brand").Brand<"keiretsu/IsoDate">) | undefined;
}[], WorkHierarchyConflict, never>;
export {};
//# sourceMappingURL=WorkItem.d.ts.map