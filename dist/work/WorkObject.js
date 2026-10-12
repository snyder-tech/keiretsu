/**
 * References into each company's own systems. The standard never copies a
 * project: a {@link WorkObjectRef} says "record R of kind K in system S, owned
 * by entity E".
 *
 * @since 0.1.0
 * @module
 */
import { PartyRef, partyKey } from "../core/PartyRef.js";
import { Schema } from 'effect';
import { OpenCode, openVocabulary } from "./Code.js";
/**
 * A system of record, as an open code (`psa`, `tracker`, `x-acme-erp`). Adopters
 * declare their systems in configuration; the wire never closes the list.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkSystem = OpenCode;
/**
 * Normative work object kinds.
 *
 * @since 0.1.0
 * @category constants
 */
export const WORK_OBJECT_KINDS = [
    'customer-contract',
    'proposal',
    'statement-of-work',
    'project',
    'project-phase',
    'task',
    'work-item',
    'case',
    'work-order',
    'work-order-line',
    'milestone',
    'deliverable',
    'capability',
    'internal-investment',
];
/**
 * A normative kind or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkObjectKind = openVocabulary(WORK_OBJECT_KINDS);
/**
 * One record in one entity's system. `recordId` is the source system's own
 * identifier and is unique only within `(system, owner, kind)`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WorkObjectRef = Schema.Struct({
    system: WorkSystem,
    owner: PartyRef,
    kind: WorkObjectKind,
    recordId: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
    label: Schema.optional(Schema.NonEmptyString.check(Schema.isMaxLength(200))),
});
/**
 * Stable join key `(system, owner, kind, recordId)`; the label is not part of identity.
 *
 * @since 0.1.0
 * @category accessors
 */
export const workObjectKey = (ref) => `${ref.system}|${partyKey(ref.owner)}|${ref.kind}|${ref.recordId}`;
//# sourceMappingURL=WorkObject.js.map