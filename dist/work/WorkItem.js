/** Canonical executable work and its containers; source statuses are observations. */
import { Effect, Schema } from 'effect';
import { brand } from "../core/Id.js";
import { RevisionFields, BitemporalFields, EvidenceRef, revisionChain, validInterval } from "../core/Envelope.js";
import { IsoDate } from "../core/Temporal.js";
import { PartyRef } from "../core/PartyRef.js";
import { PersonRef, personKey } from "./PersonRef.js";
import { WorkObjectRef, workObjectKey } from "./WorkObject.js";
import { SourceWorkMapping, SourceWorkState } from "./SourceWorkMapping.js";
export const WorkItemId = brand('keiretsu/WorkItemId');
export const WorkRelationship = Schema.Struct({
    kind: Schema.Literals(['parent', 'depends-on', 'related-to']),
    target: WorkObjectRef,
    evidence: Schema.NonEmptyArray(EvidenceRef),
});
export const WorkAssignment = Schema.Struct({
    party: PartyRef,
    people: Schema.Array(PersonRef),
    role: Schema.NonEmptyString,
    evidence: Schema.NonEmptyArray(EvidenceRef),
}).check(Schema.makeFilter((row) => (new Set(row.people.map(personKey)).size === row.people.length ? undefined : 'assigned people are distinct')));
export const WorkItem = Schema.Struct({
    id: WorkItemId,
    ...RevisionFields,
    ...BitemporalFields,
    ref: WorkObjectRef,
    mode: Schema.Literals(['executable', 'container']),
    title: Schema.NonEmptyString,
    description: Schema.optional(Schema.String),
    dueOn: Schema.optional(IsoDate),
    relationships: Schema.Array(WorkRelationship),
    assignments: Schema.Array(WorkAssignment),
    sourceMappings: Schema.Array(SourceWorkMapping),
    sourceStates: Schema.Array(SourceWorkState),
    evidence: Schema.Array(EvidenceRef),
}).check(revisionChain, validInterval, Schema.makeFilter((row) => (row.relationships.every((r) => workObjectKey(r.target) !== workObjectKey(row.ref)) ? undefined : 'work cannot relate to itself')), Schema.makeFilter((row) => (row.relationships.filter((r) => r.kind === 'parent').length <= 1 ? undefined : 'work has at most one direct parent')));
export class WorkHierarchyConflict extends Schema.TaggedError()('WorkHierarchyConflict', { subjects: Schema.NonEmptyArray(Schema.String) }) {
}
/** Check the full authorized hierarchy, including hidden ancestors, before filtering. */
export const validateWorkHierarchy = Effect.fn('keiretsu.validateWorkHierarchy')(function* (items) {
    const parents = new Map(items.map((row) => [workObjectKey(row.ref), row.relationships.find((r) => r.kind === 'parent')?.target]));
    const duplicate = new Set(items.map((row) => workObjectKey(row.ref))).size !== items.length || new Set(items.map((row) => row.id)).size !== items.length;
    if (duplicate)
        return yield* new WorkHierarchyConflict({ subjects: ['duplicate-current-work-reference'] });
    for (const item of items) {
        const seen = new Set();
        let key = workObjectKey(item.ref);
        while (key !== undefined) {
            if (seen.has(key))
                return yield* new WorkHierarchyConflict({ subjects: [key, ...seen] });
            seen.add(key);
            const parent = parents.get(key);
            if (parent === undefined)
                break;
            key = workObjectKey(parent);
            if (!parents.has(key))
                return yield* new WorkHierarchyConflict({ subjects: [key] });
        }
    }
    return items;
});
//# sourceMappingURL=WorkItem.js.map