/** ConnectWise board-specific service statuses remain scoped source facts. */
import { Effect, Schema } from 'effect';
import { type ProjectionContext } from './SourceProjection.ts';
export declare const ConnectWiseTicket: Schema.Struct<{
    readonly id: Schema.Int;
    readonly summary: Schema.String;
    readonly board: Schema.Struct<{
        readonly id: Schema.Int;
        readonly name: Schema.optional<Schema.String>;
    }>;
    readonly status: Schema.Struct<{
        readonly id: Schema.Int;
        readonly name: Schema.optional<Schema.String>;
    }>;
    readonly resources: Schema.$Array<Schema.Struct<{
        readonly id: Schema.Int;
        readonly name: Schema.optional<Schema.String>;
    }>>;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type ConnectWiseTicket = typeof ConnectWiseTicket.Type;
export declare const ConnectWiseTimeEntry: Schema.Struct<{
    readonly id: Schema.Int;
    readonly chargeToId: Schema.Int;
    readonly chargeToType: Schema.NonEmptyString;
    readonly member: Schema.Struct<{
        readonly id: Schema.Int;
        readonly name: Schema.optional<Schema.String>;
    }>;
    readonly quantity: Schema.Struct<{
        readonly value: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly unit: Schema.NonEmptyString;
    }>;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type ConnectWiseTimeEntry = typeof ConnectWiseTimeEntry.Type;
export declare const decodeConnectWiseTicket: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly summary: string;
    readonly board: {
        readonly id: number;
        readonly name?: string | undefined;
    };
    readonly status: {
        readonly id: number;
        readonly name?: string | undefined;
    };
    readonly resources: readonly {
        readonly id: number;
        readonly name?: string | undefined;
    }[];
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, Schema.SchemaError, never>;
export declare const decodeConnectWiseTimeEntry: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly chargeToId: number;
    readonly chargeToType: string;
    readonly member: {
        readonly id: number;
        readonly name?: string | undefined;
    };
    readonly quantity: {
        readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly unit: string;
    };
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, Schema.SchemaError, never>;
export declare const projectConnectWiseTicket: (row: {
    readonly id: number;
    readonly summary: string;
    readonly board: {
        readonly id: number;
        readonly name?: string | undefined;
    };
    readonly status: {
        readonly id: number;
        readonly name?: string | undefined;
    };
    readonly resources: readonly {
        readonly id: number;
        readonly name?: string | undefined;
    }[];
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
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
export declare const projectConnectWiseTimeEntry: (row: {
    readonly id: number;
    readonly chargeToId: number;
    readonly chargeToType: string;
    readonly member: {
        readonly id: number;
        readonly name?: string | undefined;
    };
    readonly quantity: {
        readonly value: string & import("effect/Brand").Brand<"keiretsu/Decimal">;
        readonly unit: string;
    };
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
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
//# sourceMappingURL=ConnectWise.d.ts.map