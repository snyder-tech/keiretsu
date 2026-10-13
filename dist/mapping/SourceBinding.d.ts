import { Schema } from 'effect';
import { IsoDate } from '../core/Temporal.ts';
import { SourceRecordRef } from './SourceRecordRef.ts';
export declare const BindingRelationship: Schema.Literals<readonly ["kind-equivalence", "branch-of", "contact-of", "projection-of"]>;
export type BindingRelationship = typeof BindingRelationship.Type;
/** Evidence of a dated relationship is not field authority or write permission. */
export declare const SourceBinding: Schema.Struct<{
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly canonical: Schema.Struct<{
        readonly namespace: Schema.NonEmptyString;
        readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
        readonly id: Schema.NonEmptyString;
    }>;
    readonly relationship: Schema.Literals<readonly ["kind-equivalence", "branch-of", "contact-of", "projection-of"]>;
    readonly effectiveFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly effectiveTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly evidenceRefs: Schema.NonEmptyArray<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
export type SourceBinding = typeof SourceBinding.Type;
export declare const activeSourceBindings: (bindings: ReadonlyArray<SourceBinding>, source: SourceRecordRef, asOf: IsoDate) => ReadonlyArray<SourceBinding>;
export interface SourceBindingCollision {
    readonly source: SourceRecordRef;
    readonly left: SourceBinding;
    readonly right: SourceBinding;
}
/** Only same-kind equivalence is exclusive. Contacts and projections are facets. */
export declare const sourceBindingCollisions: (bindings: ReadonlyArray<SourceBinding>) => ReadonlyArray<SourceBindingCollision>;
//# sourceMappingURL=SourceBinding.d.ts.map