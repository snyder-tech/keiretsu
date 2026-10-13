/** Halo ticket and action facts; one action may combine effort, status and message. */
import { Effect, Schema } from 'effect';
import { type ProjectionContext } from './SourceProjection.ts';
export declare const HaloTicket: Schema.Struct<{
    readonly id: Schema.Int;
    readonly summary: Schema.String;
    readonly status_id: Schema.Int;
    readonly agent_id: Schema.optional<Schema.Int>;
    readonly team_id: Schema.optional<Schema.Int>;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type HaloTicket = typeof HaloTicket.Type;
export declare const HaloAction: Schema.Struct<{
    readonly id: Schema.Int;
    readonly ticket_id: Schema.Int;
    readonly note: Schema.optional<Schema.String>;
    readonly outcome_id: Schema.optional<Schema.Int>;
    readonly new_status: Schema.optional<Schema.Int>;
    readonly effort: Schema.optional<Schema.Struct<{
        readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly unit: Schema.NonEmptyString;
    }>>;
    readonly agent_id: Schema.optional<Schema.Int>;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type HaloAction = typeof HaloAction.Type;
export declare const decodeHaloTicket: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly summary: string;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
    readonly status_id: number;
    readonly agent_id?: number | undefined;
    readonly team_id?: number | undefined;
}, Schema.SchemaError, never>;
export declare const decodeHaloAction: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
    readonly ticket_id: number;
    readonly agent_id?: number | undefined;
    readonly note?: string | undefined;
    readonly outcome_id?: number | undefined;
    readonly new_status?: number | undefined;
    readonly effort?: {
        readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly unit: string;
    } | undefined;
}, Schema.SchemaError, never>;
export declare const projectHaloTicket: (row: {
    readonly id: number;
    readonly summary: string;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
    readonly status_id: number;
    readonly agent_id?: number | undefined;
    readonly team_id?: number | undefined;
}, context: ProjectionContext) => Effect.Effect<{
    kind: "service-case";
    title: string;
    parents: never[];
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
export declare const projectHaloAction: (row: {
    readonly id: number;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
    readonly ticket_id: number;
    readonly agent_id?: number | undefined;
    readonly note?: string | undefined;
    readonly outcome_id?: number | undefined;
    readonly new_status?: number | undefined;
    readonly effort?: {
        readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly unit: string;
    } | undefined;
}, context: ProjectionContext) => Effect.Effect<{
    holds: string[];
    state?: {
        scope: string;
        code: string;
    };
    quantity?: {
        readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly unit: string;
    };
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
    title?: string;
    kind: "observation";
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
//# sourceMappingURL=Halo.d.ts.map