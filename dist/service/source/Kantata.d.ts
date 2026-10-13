/** Kantata source facts; approved includes the approval-not-required path. */
import { Effect, Schema } from 'effect';
import { type ProjectionContext } from './SourceProjection.ts';
export declare const KantataWork: Schema.Struct<{
    readonly id: Schema.Int;
    readonly title: Schema.String;
    readonly workspace_id: Schema.Int;
    readonly assignee_ids: Schema.$Array<Schema.Int>;
    readonly status: Schema.String;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type KantataWork = typeof KantataWork.Type;
export declare const KantataTimeEntry: Schema.Struct<{
    readonly id: Schema.Int;
    readonly story_id: Schema.optional<Schema.Int>;
    readonly workspace_id: Schema.Int;
    readonly user_id: Schema.Int;
    readonly approved: Schema.Boolean;
    readonly time_in_minutes: Schema.Int;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type KantataTimeEntry = typeof KantataTimeEntry.Type;
export declare const decodeKantataWork: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly title: string;
    readonly workspace_id: number;
    readonly assignee_ids: readonly number[];
    readonly status: string;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, Schema.SchemaError, never>;
export declare const decodeKantataTimeEntry: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly approved: boolean;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
    readonly workspace_id: number;
    readonly user_id: number;
    readonly time_in_minutes: number;
    readonly story_id?: number | undefined;
}, Schema.SchemaError, never>;
export declare const projectKantataWork: (row: {
    readonly id: number;
    readonly title: string;
    readonly workspace_id: number;
    readonly assignee_ids: readonly number[];
    readonly status: string;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, context: ProjectionContext) => Effect.Effect<{
    kind: "work-item";
    title: string;
    parents: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    }[];
    assignees: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    }[];
    state: {
        scope: string;
        code: string;
    };
    holds: string[];
    source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    mapping: {
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
    };
    evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
}, import("./SourceProjection.ts").SourceProjectionConflict, never>;
export declare const projectKantataTimeEntry: (row: {
    readonly id: number;
    readonly approved: boolean;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
    readonly workspace_id: number;
    readonly user_id: number;
    readonly time_in_minutes: number;
    readonly story_id?: number | undefined;
}, context: ProjectionContext) => Effect.Effect<{
    kind: "observation";
    parents: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    }[];
    assignees: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    }[];
    quantity: {
        readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly unit: string;
    };
    state: {
        scope: string;
        code: string;
    };
    holds: string[];
    source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    mapping: {
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
    };
    evidence: readonly [{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }, ...{
        readonly kind: string;
        readonly ref: string;
        readonly digest?: (string & import("effect/Brand").Brand<"keiretsu/Sha256">) | undefined;
    }[]];
}, import("./SourceProjection.ts").SourceProjectionConflict, never>;
//# sourceMappingURL=Kantata.d.ts.map