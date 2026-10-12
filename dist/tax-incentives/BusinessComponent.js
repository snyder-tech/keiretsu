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
import { EntityId } from "../core/Actor.js";
import { AssertionFields, EvidenceRef, RevisionFields, revisionChain } from "../core/Envelope.js";
import { brand } from "../core/Id.js";
import { Instant, IsoDate } from "../core/Temporal.js";
/** @since 0.1.0 @category schemas */
export const BusinessComponentId = brand('keiretsu/BusinessComponentId');
/** @since 0.1.0 @category schemas */
export const ComponentKind = Schema.Literals(['product', 'process', 'software', 'technique', 'formula', 'invention']);
/**
 * Internal-use class, determined from intent at the start of development.
 *
 * @since 0.1.0
 * @category schemas
 */
export const InternalUseClass = Schema.Literals(['commercial', 'internal-use', 'dual-function', 'undetermined']);
/**
 * A business component.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BusinessComponent = Schema.Struct({
    id: BusinessComponentId,
    name: Schema.NonEmptyString,
    version: Schema.optional(Schema.NonEmptyString),
    kind: ComponentKind,
    owner: EntityId,
    internalUseClass: InternalUseClass,
    /** What was technically uncertain at the outset (capability, method or design). */
    uncertaintyAtOutset: Schema.optional(Schema.Struct({ statement: Schema.NonEmptyString, evidence: Schema.Array(EvidenceRef) })),
    alternativesEvidence: Schema.Array(EvidenceRef),
    experimentationEvidence: Schema.Array(EvidenceRef),
    developmentStart: Schema.optional(IsoDate),
    /** After this date work is post-production and outside the research credit. */
    commercialReadinessDate: Schema.optional(IsoDate),
    recordedAt: Instant,
    ...RevisionFields,
    ...AssertionFields,
}).check(revisionChain);
/**
 * Whether the component carries evidence for each element of the research
 * process (uncertainty, alternatives, experimentation). A screening flag, not a finding.
 *
 * @since 0.1.0
 * @category predicates
 */
export const hasProcessEvidence = (component) => component.uncertaintyAtOutset !== undefined && component.alternativesEvidence.length > 0 && component.experimentationEvidence.length > 0;
//# sourceMappingURL=BusinessComponent.js.map