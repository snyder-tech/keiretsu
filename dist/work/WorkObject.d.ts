import { Schema } from 'effect';
/**
 * A system of record, as an open code (`psa`, `tracker`, `x-acme-erp`). Adopters
 * declare their systems in configuration; the wire never closes the list.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkSystem: Schema.String;
/** @since 0.1.0 @category models */
export type WorkSystem = typeof WorkSystem.Type;
/**
 * Normative work object kinds.
 *
 * @since 0.1.0
 * @category constants
 */
export declare const WORK_OBJECT_KINDS: readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"];
/**
 * A normative kind or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkObjectKind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type WorkObjectKind = typeof WorkObjectKind.Type;
/**
 * One record in one entity's system. `recordId` is the source system's own
 * identifier and is unique only within `(system, owner, kind)`.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkObjectRef: Schema.Struct<{
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
/** @since 0.1.0 @category models */
export type WorkObjectRef = typeof WorkObjectRef.Type;
/**
 * Stable join key `(system, owner, kind, recordId)`; the label is not part of identity.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const workObjectKey: (ref: WorkObjectRef) => string;
//# sourceMappingURL=WorkObject.d.ts.map