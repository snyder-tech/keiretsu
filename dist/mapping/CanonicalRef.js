import { Schema } from 'effect';
/** Registry masters and typed SDK domain records are distinct kinds, not vendor-created masters. */
export const CanonicalKind = Schema.Literals([
    'company',
    'legal-entity',
    'person',
    'engagement',
    'service',
    'work-order',
    'service-line',
    'activity',
    'time-entry',
    'economic-event',
    'billing-account',
    'subscription',
    'company-group',
    'invoice',
    'cost-object',
    'counterparty',
    'project',
    'brand',
    'tax-group',
    'work-item',
    'work-request',
    'service-case',
    'work-observation',
    'work-container',
]);
/** A reference into an existing canonical identity namespace, never a new ID. */
export const CanonicalRef = Schema.Struct({
    namespace: Schema.NonEmptyString,
    kind: CanonicalKind,
    id: Schema.NonEmptyString,
});
/** Tuple encoding preserves opaque IDs, including case and delimiters. */
export const canonicalRefKey = (ref) => JSON.stringify([ref.namespace, ref.kind, ref.id]);
//# sourceMappingURL=CanonicalRef.js.map