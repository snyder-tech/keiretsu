/**
 * Route bindings: a work object (and everything logged against it) bound to a
 * transfer route for an interval, with the share of each minute the route takes.
 *
 * Routes live here, never on time records: re-routing changes bindings and
 * allocations, not attested time.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import type { ValidationIssue } from '../core/Issue.ts';
import { WorkObjectRef } from './WorkObjectRef.ts';
/**
 * Who ultimately benefits. `unknown` is a legitimate answer at capture time
 * (internal investment may later be sold); it is never defaulted.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const EndCustomer: Schema.TaggedUnion<{
    readonly internal: Schema.TaggedStruct<"internal", {
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
    }>;
    readonly unknown: Schema.TaggedStruct<"unknown", {}>;
    readonly external: Schema.TaggedStruct<"external", {
        readonly party: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type EndCustomer = typeof EndCustomer.Type;
/**
 * A binding.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RouteBinding: Schema.Struct<{
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
    readonly routeId: Schema.brand<Schema.String, "keiretsu/RouteId">;
    readonly endCustomer: Schema.TaggedUnion<{
        readonly internal: Schema.TaggedStruct<"internal", {
            readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly unknown: Schema.TaggedStruct<"unknown", {}>;
        readonly external: Schema.TaggedStruct<"external", {
            readonly party: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
    }>;
    /** Share of each bound minute this route takes. Bindings in force on one work object sum to at most 10000. */
    readonly shareBps: Schema.Number;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/RouteBindingId">;
}>;
/** @since 0.1.0 @category models */
export type RouteBinding = typeof RouteBinding.Type;
/**
 * Keep the highest revision of each binding id.
 *
 * @since 0.1.0
 * @category combinators
 */
export declare const latestBindings: (bindings: ReadonlyArray<RouteBinding>) => ReadonlyArray<RouteBinding>;
/**
 * Bindings in force on any day share out at most the whole minute
 * (`binding.shares-exceed-whole`). Half-open intervals change only at start
 * dates, so testing every start date is exhaustive.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateBindings: (bindings: ReadonlyArray<RouteBinding>) => ReadonlyArray<ValidationIssue>;
/**
 * Bindings for a work object in force on a date.
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const bindingsOn: (bindings: ReadonlyArray<RouteBinding>, options: {
    readonly workObject: WorkObjectRef;
    readonly date: string;
}) => ReadonlyArray<RouteBinding>;
//# sourceMappingURL=RouteBinding.d.ts.map