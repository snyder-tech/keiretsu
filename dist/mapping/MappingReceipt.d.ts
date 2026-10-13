import { Effect, Schema } from 'effect';
import { type MapSourceInput } from './MapSource.ts';
/** Deterministic evidence of a computation, separate from approval/application. */
export declare const MappingReceipt: Schema.Struct<{
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly sourceSnapshotDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly sourceConfigurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly direction: Schema.Literals<readonly ["source-to-canonical", "canonical-to-source"]>;
    readonly installationLifecycle: Schema.Literals<readonly ["active", "archived", "retired"]>;
    readonly sourceRecordLifecycle: Schema.Literals<readonly ["active", "archived", "retired"]>;
    readonly mappingId: Schema.NonEmptyString;
    readonly mappingVersion: Schema.NonEmptyString;
    readonly mappingDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly registryRevision: Schema.NonEmptyString;
    readonly bindingsDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly asOf: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly companyContext: Schema.optional<Schema.Struct<{
        readonly namespace: Schema.NonEmptyString;
        readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
        readonly id: Schema.NonEmptyString;
    }>>;
    readonly candidateDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly resultDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
}>;
export type MappingReceipt = typeof MappingReceipt.Type;
export interface MappingReceiptInput extends MapSourceInput {
    readonly registryRevision: string;
    readonly installationLifecycle: MappingReceipt['installationLifecycle'];
    readonly sourceRecordLifecycle: MappingReceipt['sourceRecordLifecycle'];
}
/** Receipt and result are computed together from one configuration-bound packet. */
export declare const MappingComputation: Schema.Struct<{
    readonly result: Schema.TaggedUnion<{
        readonly mapped: Schema.TaggedStruct<"mapped", {
            readonly candidates: Schema.NonEmptyArray<Schema.Struct<{
                readonly canonical: Schema.Struct<{
                    readonly namespace: Schema.NonEmptyString;
                    readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                    readonly id: Schema.NonEmptyString;
                }>;
                readonly targetSchemaVersion: Schema.NonEmptyString;
                readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
            }>>;
            readonly issues: Schema.$Array<Schema.Struct<{
                readonly code: Schema.NonEmptyString;
                readonly field: Schema.optional<Schema.NonEmptyString>;
                readonly message: Schema.NonEmptyString;
            }>>;
            readonly fields: Schema.$Array<Schema.Struct<{
                readonly source: Schema.Struct<{
                    readonly installationId: Schema.NonEmptyString;
                    readonly model: Schema.NonEmptyString;
                    readonly recordKey: Schema.NonEmptyString;
                }>;
                readonly sourceField: Schema.NonEmptyString;
                readonly targetField: Schema.NonEmptyString;
                readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
                readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
                readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
                readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>>;
        }>;
        readonly conflict: Schema.TaggedStruct<"conflict", {
            candidates: Schema.$Array<Schema.Struct<{
                readonly canonical: Schema.Struct<{
                    readonly namespace: Schema.NonEmptyString;
                    readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                    readonly id: Schema.NonEmptyString;
                }>;
                readonly targetSchemaVersion: Schema.NonEmptyString;
                readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
            }>>;
            issues: Schema.$Array<Schema.Struct<{
                readonly code: Schema.NonEmptyString;
                readonly field: Schema.optional<Schema.NonEmptyString>;
                readonly message: Schema.NonEmptyString;
            }>>;
            fields: Schema.$Array<Schema.Struct<{
                readonly source: Schema.Struct<{
                    readonly installationId: Schema.NonEmptyString;
                    readonly model: Schema.NonEmptyString;
                    readonly recordKey: Schema.NonEmptyString;
                }>;
                readonly sourceField: Schema.NonEmptyString;
                readonly targetField: Schema.NonEmptyString;
                readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
                readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
                readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
                readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>>;
        }>;
        readonly ambiguous: Schema.TaggedStruct<"ambiguous", {
            candidates: Schema.$Array<Schema.Struct<{
                readonly canonical: Schema.Struct<{
                    readonly namespace: Schema.NonEmptyString;
                    readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                    readonly id: Schema.NonEmptyString;
                }>;
                readonly targetSchemaVersion: Schema.NonEmptyString;
                readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
            }>>;
            issues: Schema.$Array<Schema.Struct<{
                readonly code: Schema.NonEmptyString;
                readonly field: Schema.optional<Schema.NonEmptyString>;
                readonly message: Schema.NonEmptyString;
            }>>;
            fields: Schema.$Array<Schema.Struct<{
                readonly source: Schema.Struct<{
                    readonly installationId: Schema.NonEmptyString;
                    readonly model: Schema.NonEmptyString;
                    readonly recordKey: Schema.NonEmptyString;
                }>;
                readonly sourceField: Schema.NonEmptyString;
                readonly targetField: Schema.NonEmptyString;
                readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
                readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
                readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
                readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>>;
        }>;
        readonly unresolved: Schema.TaggedStruct<"unresolved", {
            candidates: Schema.$Array<Schema.Struct<{
                readonly canonical: Schema.Struct<{
                    readonly namespace: Schema.NonEmptyString;
                    readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                    readonly id: Schema.NonEmptyString;
                }>;
                readonly targetSchemaVersion: Schema.NonEmptyString;
                readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
            }>>;
            issues: Schema.$Array<Schema.Struct<{
                readonly code: Schema.NonEmptyString;
                readonly field: Schema.optional<Schema.NonEmptyString>;
                readonly message: Schema.NonEmptyString;
            }>>;
            fields: Schema.$Array<Schema.Struct<{
                readonly source: Schema.Struct<{
                    readonly installationId: Schema.NonEmptyString;
                    readonly model: Schema.NonEmptyString;
                    readonly recordKey: Schema.NonEmptyString;
                }>;
                readonly sourceField: Schema.NonEmptyString;
                readonly targetField: Schema.NonEmptyString;
                readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
                readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
                readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
                readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>>;
        }>;
        readonly unsupported: Schema.TaggedStruct<"unsupported", {
            candidates: Schema.$Array<Schema.Struct<{
                readonly canonical: Schema.Struct<{
                    readonly namespace: Schema.NonEmptyString;
                    readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
                    readonly id: Schema.NonEmptyString;
                }>;
                readonly targetSchemaVersion: Schema.NonEmptyString;
                readonly values: Schema.$Record<Schema.String, Schema.Union<readonly [Schema.String, Schema.Number, Schema.Boolean, Schema.Null]>>;
            }>>;
            issues: Schema.$Array<Schema.Struct<{
                readonly code: Schema.NonEmptyString;
                readonly field: Schema.optional<Schema.NonEmptyString>;
                readonly message: Schema.NonEmptyString;
            }>>;
            fields: Schema.$Array<Schema.Struct<{
                readonly source: Schema.Struct<{
                    readonly installationId: Schema.NonEmptyString;
                    readonly model: Schema.NonEmptyString;
                    readonly recordKey: Schema.NonEmptyString;
                }>;
                readonly sourceField: Schema.NonEmptyString;
                readonly targetField: Schema.NonEmptyString;
                readonly transform: Schema.Literals<readonly ["copy", "trim-string", "lookup"]>;
                readonly state: Schema.Literals<readonly ["mapped", "missing", "unsupported", "conflict"]>;
                readonly loss: Schema.Literals<readonly ["none", "normalization", "unmapped-value", "missing-value"]>;
                readonly evidenceRefs: Schema.$Array<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>>;
        }>;
    }>;
    readonly receipt: Schema.Struct<{
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly sourceSnapshotDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly sourceConfigurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly direction: Schema.Literals<readonly ["source-to-canonical", "canonical-to-source"]>;
        readonly installationLifecycle: Schema.Literals<readonly ["active", "archived", "retired"]>;
        readonly sourceRecordLifecycle: Schema.Literals<readonly ["active", "archived", "retired"]>;
        readonly mappingId: Schema.NonEmptyString;
        readonly mappingVersion: Schema.NonEmptyString;
        readonly mappingDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly registryRevision: Schema.NonEmptyString;
        readonly bindingsDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly asOf: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly companyContext: Schema.optional<Schema.Struct<{
            readonly namespace: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
            readonly id: Schema.NonEmptyString;
        }>>;
        readonly candidateDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly resultDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly digest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
}>;
export type MappingComputation = typeof MappingComputation.Type;
export declare const createMappingReceipt: (input: MappingReceiptInput) => Effect.Effect<{
    result: {
        readonly _tag: "mapped";
        readonly candidates: readonly [{
            readonly canonical: {
                readonly namespace: string;
                readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
                readonly id: string;
            };
            readonly targetSchemaVersion: string;
            readonly values: {
                readonly [x: string]: string | number | boolean | null;
            };
        }, ...{
            readonly canonical: {
                readonly namespace: string;
                readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
                readonly id: string;
            };
            readonly targetSchemaVersion: string;
            readonly values: {
                readonly [x: string]: string | number | boolean | null;
            };
        }[]];
        readonly issues: readonly {
            readonly message: string;
            readonly code: string;
            readonly field?: string | undefined;
        }[];
        readonly fields: readonly {
            readonly source: {
                readonly installationId: string;
                readonly model: string;
                readonly recordKey: string;
            };
            readonly sourceField: string;
            readonly targetField: string;
            readonly transform: "lookup" | "copy" | "trim-string";
            readonly state: "mapped" | "conflict" | "missing" | "unsupported";
            readonly loss: "none" | "normalization" | "unmapped-value" | "missing-value";
            readonly evidenceRefs: readonly {
                readonly kind: string;
                readonly ref: string;
                readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
            }[];
        }[];
    } | {
        readonly _tag: "conflict";
        readonly candidates: readonly {
            readonly canonical: {
                readonly namespace: string;
                readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
                readonly id: string;
            };
            readonly targetSchemaVersion: string;
            readonly values: {
                readonly [x: string]: string | number | boolean | null;
            };
        }[];
        readonly issues: readonly {
            readonly message: string;
            readonly code: string;
            readonly field?: string | undefined;
        }[];
        readonly fields: readonly {
            readonly source: {
                readonly installationId: string;
                readonly model: string;
                readonly recordKey: string;
            };
            readonly sourceField: string;
            readonly targetField: string;
            readonly transform: "lookup" | "copy" | "trim-string";
            readonly state: "mapped" | "conflict" | "missing" | "unsupported";
            readonly loss: "none" | "normalization" | "unmapped-value" | "missing-value";
            readonly evidenceRefs: readonly {
                readonly kind: string;
                readonly ref: string;
                readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
            }[];
        }[];
    } | {
        readonly _tag: "ambiguous";
        readonly candidates: readonly {
            readonly canonical: {
                readonly namespace: string;
                readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
                readonly id: string;
            };
            readonly targetSchemaVersion: string;
            readonly values: {
                readonly [x: string]: string | number | boolean | null;
            };
        }[];
        readonly issues: readonly {
            readonly message: string;
            readonly code: string;
            readonly field?: string | undefined;
        }[];
        readonly fields: readonly {
            readonly source: {
                readonly installationId: string;
                readonly model: string;
                readonly recordKey: string;
            };
            readonly sourceField: string;
            readonly targetField: string;
            readonly transform: "lookup" | "copy" | "trim-string";
            readonly state: "mapped" | "conflict" | "missing" | "unsupported";
            readonly loss: "none" | "normalization" | "unmapped-value" | "missing-value";
            readonly evidenceRefs: readonly {
                readonly kind: string;
                readonly ref: string;
                readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
            }[];
        }[];
    } | {
        readonly _tag: "unresolved";
        readonly candidates: readonly {
            readonly canonical: {
                readonly namespace: string;
                readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
                readonly id: string;
            };
            readonly targetSchemaVersion: string;
            readonly values: {
                readonly [x: string]: string | number | boolean | null;
            };
        }[];
        readonly issues: readonly {
            readonly message: string;
            readonly code: string;
            readonly field?: string | undefined;
        }[];
        readonly fields: readonly {
            readonly source: {
                readonly installationId: string;
                readonly model: string;
                readonly recordKey: string;
            };
            readonly sourceField: string;
            readonly targetField: string;
            readonly transform: "lookup" | "copy" | "trim-string";
            readonly state: "mapped" | "conflict" | "missing" | "unsupported";
            readonly loss: "none" | "normalization" | "unmapped-value" | "missing-value";
            readonly evidenceRefs: readonly {
                readonly kind: string;
                readonly ref: string;
                readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
            }[];
        }[];
    } | {
        readonly _tag: "unsupported";
        readonly candidates: readonly {
            readonly canonical: {
                readonly namespace: string;
                readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
                readonly id: string;
            };
            readonly targetSchemaVersion: string;
            readonly values: {
                readonly [x: string]: string | number | boolean | null;
            };
        }[];
        readonly issues: readonly {
            readonly message: string;
            readonly code: string;
            readonly field?: string | undefined;
        }[];
        readonly fields: readonly {
            readonly source: {
                readonly installationId: string;
                readonly model: string;
                readonly recordKey: string;
            };
            readonly sourceField: string;
            readonly targetField: string;
            readonly transform: "lookup" | "copy" | "trim-string";
            readonly state: "mapped" | "conflict" | "missing" | "unsupported";
            readonly loss: "none" | "normalization" | "unmapped-value" | "missing-value";
            readonly evidenceRefs: readonly {
                readonly kind: string;
                readonly ref: string;
                readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
            }[];
        }[];
    };
    receipt: {
        readonly source: {
            readonly installationId: string;
            readonly model: string;
            readonly recordKey: string;
        };
        readonly direction: "source-to-canonical" | "canonical-to-source";
        readonly digest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly installationLifecycle: "active" | "retired" | "archived";
        readonly sourceRecordLifecycle: "active" | "retired" | "archived";
        readonly sourceDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly sourceSnapshotDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly sourceConfigurationDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly mappingId: string;
        readonly mappingVersion: string;
        readonly mappingDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly registryRevision: string;
        readonly bindingsDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly asOf: string & import("effect/Brand").Brand<"keiretsu/IsoDate">;
        readonly candidateDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly resultDigest: string & import("effect/Brand").Brand<"keiretsu/Sha256">;
        readonly companyContext?: {
            readonly namespace: string;
            readonly kind: "counterparty" | "project" | "work-item" | "work-order" | "person" | "activity" | "invoice" | "service" | "subscription" | "company" | "engagement" | "legal-entity" | "service-line" | "time-entry" | "economic-event" | "billing-account" | "company-group" | "cost-object" | "brand" | "tax-group" | "work-request" | "service-case" | "work-observation" | "work-container";
            readonly id: string;
        } | undefined;
    };
}, Schema.SchemaError | import("../core/CanonicalJson.ts").CanonicalJsonError, never>;
//# sourceMappingURL=MappingReceipt.d.ts.map