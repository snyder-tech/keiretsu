import { Effect, Schema } from 'effect';
/** Source semantics pinned for synthetic fixtures; this is not installed-tenant qualification. */
export declare const odoo20SourceCommit = "99e83fca911ac2d69b44e86219860077bdf8ebc8";
/** Bounded read projection, not an Odoo RPC implementation or complete vendor schema. */
export declare const Odoo20Row: Schema.TaggedUnion<{
    readonly "event.event.ticket": Schema.TaggedStruct<"event.event.ticket", {
        readonly id: Schema.Number;
        readonly event_id: Schema.Number;
        readonly name: Schema.NonEmptyString;
        readonly entry_limit: Schema.Number;
    }>;
    readonly "event.registration": Schema.TaggedStruct<"event.registration", {
        readonly id: Schema.Number;
        readonly event_id: Schema.Number;
        readonly event_ticket_id: Schema.Union<readonly [Schema.Number, Schema.Literal<false>]>;
        readonly partner_id: Schema.Union<readonly [Schema.Number, Schema.Literal<false>]>;
        readonly name: Schema.String;
        readonly email: Schema.String;
        readonly state: Schema.Literals<readonly ["draft", "open", "done", "cancel"]>;
        readonly event_slot_id: Schema.optional<Schema.Union<readonly [Schema.Number, Schema.Literal<false>]>>;
        readonly ticket_entry_limit: Schema.optional<Schema.Number>;
        readonly main_registration_id: Schema.optional<Schema.Union<readonly [Schema.Number, Schema.Literal<false>]>>;
        readonly sale_order_id: Schema.optional<Schema.Union<readonly [Schema.Number, Schema.Literal<false>]>>;
    }>;
    readonly "sale.order": Schema.TaggedStruct<"sale.order", {
        readonly id: Schema.Number;
        readonly partner_id: Schema.Number;
        readonly state: Schema.Literals<readonly ["draft", "sent", "sale", "cancel"]>;
    }>;
    readonly "payment.transaction": Schema.TaggedStruct<"payment.transaction", {
        readonly id: Schema.Number;
        readonly state: Schema.Literals<readonly ["draft", "pending", "authorized", "done", "cancel", "error"]>;
        readonly operation: Schema.Literals<readonly ["online_redirect", "online_direct", "online_token", "validation", "offline", "refund"]>;
    }>;
}>;
export type Odoo20Row = typeof Odoo20Row.Type;
export declare const Odoo20AdmissionObservation: Schema.TaggedUnion<{
    readonly order: Schema.TaggedStruct<"order", {
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly buyer: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly sourceState: Schema.Literals<readonly ["draft", "sent", "sale", "cancel"]>;
        readonly confirmedSale: Schema.Boolean;
        readonly paymentStatus: Schema.Literal<"unestablished">;
    }>;
    readonly tier: Schema.TaggedStruct<"tier", {
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly event: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly label: Schema.String;
        readonly entryLimit: Schema.Number;
        readonly capability: Schema.Literals<readonly ["single-entry", "hold-multi-entry"]>;
    }>;
    readonly registration: Schema.TaggedStruct<"registration", {
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly event: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly tier: Schema.optional<Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>>;
        readonly bookedBy: Schema.optional<Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>>;
        readonly attendee: Schema.Struct<{
            readonly name: Schema.String;
            readonly email: Schema.String;
        }>;
        readonly sourceState: Schema.Literals<readonly ["draft", "open", "done", "cancel"]>;
        readonly slot: Schema.optional<Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>>;
        readonly order: Schema.optional<Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>>;
        readonly capability: Schema.Literals<readonly ["single-entry", "hold-multi-entry", "hold-entry-policy-unknown"]>;
    }>;
    readonly payment: Schema.TaggedStruct<"payment", {
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly sourceState: Schema.Literals<readonly ["draft", "pending", "authorized", "done", "cancel", "error"]>;
        readonly sourceOperation: Schema.Literals<readonly ["online_redirect", "online_direct", "online_token", "validation", "offline", "refund"]>;
        readonly settlementStatus: Schema.Literal<"unestablished">;
        readonly entitlementEffect: Schema.Literal<"none">;
    }>;
}>;
export type Odoo20AdmissionObservation = typeof Odoo20AdmissionObservation.Type;
/** No source state creates an entitlement, credential, authorized redemption or settlement. */
export declare const observeOdoo20Admission: (options: {
    readonly installationId: unknown;
    readonly row: unknown;
}) => Effect.Effect<{
    readonly _tag: "order";
    readonly source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly buyer: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly sourceState: "cancel" | "draft" | "sent" | "sale";
    readonly confirmedSale: boolean;
    readonly paymentStatus: "unestablished";
} | {
    readonly _tag: "tier";
    readonly source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly event: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly label: string;
    readonly entryLimit: number;
    readonly capability: "single-entry" | "hold-multi-entry";
} | {
    readonly source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly event: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly _tag: "registration";
    readonly attendee: {
        readonly name: string;
        readonly email: string;
    };
    readonly capability: "single-entry" | "hold-multi-entry" | "hold-entry-policy-unknown";
    readonly sourceState: "open" | "cancel" | "done" | "draft";
    readonly order?: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    } | undefined;
    readonly slot?: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    } | undefined;
    readonly tier?: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    } | undefined;
    readonly bookedBy?: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    } | undefined;
} | {
    readonly _tag: "payment";
    readonly source: {
        readonly installationId: string;
        readonly model: string;
        readonly recordKey: string;
    };
    readonly sourceState: "error" | "cancel" | "pending" | "done" | "draft" | "authorized";
    readonly sourceOperation: "validation" | "offline" | "online_redirect" | "online_direct" | "online_token" | "refund";
    readonly settlementStatus: "unestablished";
    readonly entitlementEffect: "none";
}, Schema.SchemaError, never>;
//# sourceMappingURL=Odoo20Observation.d.ts.map