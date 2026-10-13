import { Schema } from 'effect';

import { EvidenceRef } from '../core/Envelope.ts';
import { IsoDate } from '../core/Temporal.ts';
import { CanonicalRef, canonicalRefKey } from './CanonicalRef.ts';
import { SourceRecordRef, sourceRecordKey } from './SourceRecordRef.ts';

export const BindingRelationship = Schema.Literals(['kind-equivalence', 'branch-of', 'contact-of', 'projection-of']);
export type BindingRelationship = typeof BindingRelationship.Type;

/** Evidence of a dated relationship is not field authority or write permission. */
export const SourceBinding = Schema.Struct({
  source: SourceRecordRef,
  canonical: CanonicalRef,
  relationship: BindingRelationship,
  effectiveFrom: IsoDate,
  effectiveTo: Schema.optional(IsoDate),
  evidenceRefs: Schema.NonEmptyArray(EvidenceRef),
}).check(Schema.makeFilter((binding) => (binding.effectiveTo === undefined || binding.effectiveFrom < binding.effectiveTo ? undefined : 'effectiveTo must follow effectiveFrom')));
export type SourceBinding = typeof SourceBinding.Type;

export const activeSourceBindings = (bindings: ReadonlyArray<SourceBinding>, source: SourceRecordRef, asOf: IsoDate): ReadonlyArray<SourceBinding> =>
  bindings.filter((binding) => sourceRecordKey(binding.source) === sourceRecordKey(source) && binding.effectiveFrom <= asOf && (binding.effectiveTo === undefined || asOf < binding.effectiveTo));

export interface SourceBindingCollision {
  readonly source: SourceRecordRef;
  readonly left: SourceBinding;
  readonly right: SourceBinding;
}

const competingEquivalence = (left: SourceBinding, right: SourceBinding): boolean => {
  if (left.relationship !== 'kind-equivalence' || right.relationship !== 'kind-equivalence') return false;
  if (left.canonical.namespace !== right.canonical.namespace || left.canonical.kind !== right.canonical.kind) return false;
  return sourceRecordKey(left.source) === sourceRecordKey(right.source) && canonicalRefKey(left.canonical) !== canonicalRefKey(right.canonical);
};

const bindingIntervalsOverlap = (left: SourceBinding, right: SourceBinding): boolean =>
  (left.effectiveTo === undefined || right.effectiveFrom < left.effectiveTo) && (right.effectiveTo === undefined || left.effectiveFrom < right.effectiveTo);

/** Only same-kind equivalence is exclusive. Contacts and projections are facets. */
export const sourceBindingCollisions = (bindings: ReadonlyArray<SourceBinding>): ReadonlyArray<SourceBindingCollision> => {
  const collisions: Array<SourceBindingCollision> = [];
  for (const [index, left] of bindings.entries()) {
    for (const right of bindings.slice(index + 1)) {
      if (competingEquivalence(left, right) && bindingIntervalsOverlap(left, right)) {
        collisions.push({ source: left.source, left, right });
      }
    }
  }
  return collisions;
};
