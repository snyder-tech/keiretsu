import { Schema } from 'effect';
import { EvidenceRef } from "../core/Envelope.js";
import { IsoDate } from "../core/Temporal.js";
import { CanonicalRef, canonicalRefKey } from "./CanonicalRef.js";
import { SourceRecordRef, sourceRecordKey } from "./SourceRecordRef.js";
export const BindingRelationship = Schema.Literals(['kind-equivalence', 'branch-of', 'contact-of', 'projection-of']);
/** Evidence of a dated relationship is not field authority or write permission. */
export const SourceBinding = Schema.Struct({
    source: SourceRecordRef,
    canonical: CanonicalRef,
    relationship: BindingRelationship,
    effectiveFrom: IsoDate,
    effectiveTo: Schema.optional(IsoDate),
    evidenceRefs: Schema.NonEmptyArray(EvidenceRef),
}).check(Schema.makeFilter((binding) => (binding.effectiveTo === undefined || binding.effectiveFrom < binding.effectiveTo ? undefined : 'effectiveTo must follow effectiveFrom')));
export const activeSourceBindings = (bindings, source, asOf) => bindings.filter((binding) => sourceRecordKey(binding.source) === sourceRecordKey(source) && binding.effectiveFrom <= asOf && (binding.effectiveTo === undefined || asOf < binding.effectiveTo));
const competingEquivalence = (left, right) => {
    if (left.relationship !== 'kind-equivalence' || right.relationship !== 'kind-equivalence')
        return false;
    if (left.canonical.namespace !== right.canonical.namespace || left.canonical.kind !== right.canonical.kind)
        return false;
    return sourceRecordKey(left.source) === sourceRecordKey(right.source) && canonicalRefKey(left.canonical) !== canonicalRefKey(right.canonical);
};
const bindingIntervalsOverlap = (left, right) => (left.effectiveTo === undefined || right.effectiveFrom < left.effectiveTo) && (right.effectiveTo === undefined || left.effectiveFrom < right.effectiveTo);
/** Only same-kind equivalence is exclusive. Contacts and projections are facets. */
export const sourceBindingCollisions = (bindings) => {
    const collisions = [];
    for (const [index, left] of bindings.entries()) {
        for (const right of bindings.slice(index + 1)) {
            if (competingEquivalence(left, right) && bindingIntervalsOverlap(left, right)) {
                collisions.push({ source: left.source, left, right });
            }
        }
    }
    return collisions;
};
//# sourceMappingURL=SourceBinding.js.map