/** Odoo 20 Community project/task and actual hr_timesheet analytic-line facts. */
import { Effect, Schema } from 'effect';
import { type ProjectionContext, type SourceWorkProjection } from './SourceProjection.ts';
export declare const OdooProject: Schema.Struct<{
    readonly id: Schema.Int;
    readonly name: Schema.NonEmptyString;
    readonly user_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly active: Schema.Boolean;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type OdooProject = typeof OdooProject.Type;
export declare const OdooTask: Schema.Struct<{
    readonly id: Schema.Int;
    readonly name: Schema.NonEmptyString;
    readonly project_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly parent_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly user_ids: Schema.$Array<Schema.Int>;
    readonly stage_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly state: Schema.NonEmptyString;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type OdooTask = typeof OdooTask.Type;
export declare const OdooTimesheetLine: Schema.Struct<{
    readonly id: Schema.Int;
    readonly name: Schema.String;
    readonly project_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly task_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly employee_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Tuple<readonly [Schema.Int, Schema.String]>]>;
    readonly date: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly unit_amount: Schema.Number;
    readonly providerFields: Schema.$Record<Schema.String, Schema.Unknown>;
}>;
export type OdooTimesheetLine = typeof OdooTimesheetLine.Type;
export declare const decodeOdooProject: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly name: string;
    readonly user_id: false | readonly [number, string];
    readonly active: boolean;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, Schema.SchemaError, never>;
export declare const decodeOdooTask: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly name: string;
    readonly project_id: false | readonly [number, string];
    readonly parent_id: false | readonly [number, string];
    readonly user_ids: readonly number[];
    readonly stage_id: false | readonly [number, string];
    readonly state: string;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, Schema.SchemaError, never>;
export declare const decodeOdooTimesheetLine: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => Effect.Effect<{
    readonly id: number;
    readonly name: string;
    readonly project_id: false | readonly [number, string];
    readonly task_id: false | readonly [number, string];
    readonly employee_id: false | readonly [number, string];
    readonly date: string & import("effect/Brand").Brand<"keiretsu/IsoDate">;
    readonly unit_amount: number;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, Schema.SchemaError, never>;
export declare const projectOdooProject: (row: {
    readonly id: number;
    readonly name: string;
    readonly user_id: false | readonly [number, string];
    readonly active: boolean;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, context: ProjectionContext) => Effect.Effect<{
    kind: "container";
    title: string;
    parents: never[];
    assignees: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    }[];
    holds: never[];
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
export declare const projectOdooTask: (row: {
    readonly id: number;
    readonly name: string;
    readonly project_id: false | readonly [number, string];
    readonly parent_id: false | readonly [number, string];
    readonly user_ids: readonly number[];
    readonly stage_id: false | readonly [number, string];
    readonly state: string;
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
/** Caller supplies the configured timesheet UoM; unit_amount is not universally hours. */
export declare const OdooTimesheetClassification: Schema.Struct<{
    readonly module: Schema.Literal<"hr_timesheet">;
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly sourceDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type OdooTimesheetClassification = typeof OdooTimesheetClassification.Type;
export declare const projectOdooTimesheetLine: (row: {
    readonly id: number;
    readonly name: string;
    readonly project_id: false | readonly [number, string];
    readonly task_id: false | readonly [number, string];
    readonly employee_id: false | readonly [number, string];
    readonly date: string & import("effect/Brand").Brand<"keiretsu/IsoDate">;
    readonly unit_amount: number;
    readonly providerFields: {
        readonly [x: string]: unknown;
    };
}, context: ProjectionContext, unit: string, classification?: {
    readonly module: "hr_timesheet";
    readonly source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
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
} | undefined) => Effect.Effect<{
    kind: "observation";
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
}, Schema.SchemaError | import("./SourceProjection.ts").SourceProjectionConflict, never>;
/** Field Service uses Enterprise Planning shifts; no task/time equivalence is asserted. */
export declare const projectOdooFieldService: (context: ProjectionContext) => SourceWorkProjection;
//# sourceMappingURL=Odoo.d.ts.map