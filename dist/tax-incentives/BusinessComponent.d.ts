/**
 * Business components: the unit of research analysis (a product, process,
 * software, technique, formula or invention), with its internal-use class and
 * the evidence for uncertainty at the outset, alternatives considered and the
 * process of experimentation. Classifications are human decisions; the package
 * only reads them and holds when they are undetermined.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const BusinessComponentId: Schema.brand<Schema.String, "keiretsu/BusinessComponentId">;
/** @since 0.1.0 @category models */
export type BusinessComponentId = typeof BusinessComponentId.Type;
/** @since 0.1.0 @category schemas */
export declare const ComponentKind: Schema.Literals<readonly ["product", "process", "software", "technique", "formula", "invention"]>;
/**
 * Internal-use class, determined from intent at the start of development.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const InternalUseClass: Schema.Literals<readonly ["commercial", "internal-use", "dual-function", "undetermined"]>;
/** @since 0.1.0 @category models */
export type InternalUseClass = typeof InternalUseClass.Type;
/**
 * A business component.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BusinessComponent: Schema.Struct<{
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/BusinessComponentId">;
    readonly name: Schema.NonEmptyString;
    readonly version: Schema.optional<Schema.NonEmptyString>;
    readonly kind: Schema.Literals<readonly ["product", "process", "software", "technique", "formula", "invention"]>;
    readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly internalUseClass: Schema.Literals<readonly ["commercial", "internal-use", "dual-function", "undetermined"]>;
    /** What was technically uncertain at the outset (capability, method or design). */
    readonly uncertaintyAtOutset: Schema.optional<Schema.Struct<{
        readonly statement: Schema.NonEmptyString;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly alternativesEvidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly experimentationEvidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly developmentStart: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    /** After this date work is post-production and outside the research credit. */
    readonly commercialReadinessDate: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type BusinessComponent = typeof BusinessComponent.Type;
/**
 * Whether the component carries evidence for each element of the research
 * process (uncertainty, alternatives, experimentation). A screening flag, not a finding.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const hasProcessEvidence: (component: BusinessComponent) => boolean;
//# sourceMappingURL=BusinessComponent.d.ts.map