/**
 * Catalog offerings: what is sold, by whom, and its revenue-recognition attributes.
 *
 * Recognition attributes are **hints** for the revenue package (finance); this
 * package never recognises or posts revenue. A license carries the nature of
 * the IP right (right-to-use → point in time at activation; right-to-access →
 * over time). A capability is an automated or AI-assisted service priced per
 * value unit against a versioned baseline of human effort.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Decimal, toScaled } from "../core/Decimal.js";
import { EvidenceRef, RevisionFields } from "../core/Envelope.js";
import { EntityId, OfferingId } from "../core/Ids.js";
import { Instant, IsoDate } from "../core/Temporal.js";
import { OpenCode, openVocabulary } from "./Code.js";
import { fault } from "./Invariant.js";
/**
 * ISO 8601 duration (`P1M`, `P1Y`, `P3Y`, `PT168H`).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Iso8601Duration = Schema.String.check(Schema.isPattern(/^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/));
/**
 * Recognition pattern hint (ASC 606 / IFRS 15).
 *
 * @since 0.1.0
 * @category schemas
 */
export const RecognitionHint = Schema.TaggedUnion({
    'point-in-time': { trigger: openVocabulary(['delivery', 'acceptance', 'activation']) },
    'over-time': { measure: openVocabulary(['straight-line', 'output-units', 'input-hours', 'as-invoiced']) },
});
/**
 * Item classification (UNSPSC, CPV, HSN/SAC, internal).
 *
 * @since 0.1.0
 * @category schemas
 */
export const ItemClassification = Schema.Struct({ scheme: OpenCode, code: Schema.NonEmptyString.check(Schema.isMaxLength(32)) });
const Base = {
    id: OfferingId,
    ...RevisionFields,
    /** Seller of record. */
    owner: EntityId,
    name: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
    classification: Schema.optional(ItemClassification),
    recognition: RecognitionHint,
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
    recordedAt: Instant,
};
/**
 * A capability's baseline of human minutes per value unit.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CapabilityBaseline = Schema.TaggedUnion({
    estimated: { minutesPerUnit: Decimal },
    calibrated: { minutesPerUnit: Decimal, evidence: Schema.NonEmptyArray(EvidenceRef) },
});
/**
 * A component of a bundle, with its standalone selling price evidence when known.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BundleComponent = Schema.Struct({
    offeringId: OfferingId,
    quantity: Decimal,
    ssp: Schema.optional(Schema.Struct({ method: openVocabulary(['observable', 'adjusted-market', 'expected-cost-plus-margin', 'residual']), evidence: EvidenceRef })),
});
/**
 * An offering.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Offering = Schema.TaggedUnion({
    product: { ...Base, fulfilment: Schema.Literals(['physical', 'digital']) },
    service: { ...Base, deliveryPattern: openVocabulary(['time-based', 'deliverable', 'stand-ready']) },
    license: { ...Base, ipNature: Schema.Literals(['right-to-use', 'right-to-access']), licenseModel: openVocabulary(['seat', 'term', 'perpetual', 'metered']) },
    subscription: { ...Base, term: Iso8601Duration, billingFrequency: Iso8601Duration, autoRenew: Schema.Boolean },
    capability: {
        ...Base,
        capabilityKey: OpenCode,
        version: Schema.String.check(Schema.isPattern(/^\d+\.\d+(?:\.\d+)?$/)),
        valueUnit: OpenCode,
        baseline: CapabilityBaseline,
        commercialStatus: Schema.Literals(['internal', 'included', 'priceable']),
    },
    bundle: { ...Base, components: Schema.NonEmptyArray(BundleComponent) },
});
const common = (offering) => [
    ...((offering.revision > 1) === (offering.supersedesDigest !== undefined) ? [] : [fault('offering.revision-chain', offering.id, 'supersedesDigest is present exactly when revision > 1')]),
    ...(offering.validTo === undefined || offering.validFrom < offering.validTo ? [] : [fault('offering.interval', offering.id, 'validTo follows validFrom')]),
];
const checkLicense = (offering) => {
    const pattern = offering.recognition;
    if (offering.ipNature === 'right-to-access')
        return pattern._tag === 'over-time' ? [] : [fault('offering.license-pattern', offering.id, 'a right-to-access licence is recognised over time')];
    return pattern._tag === 'point-in-time' && pattern.trigger === 'activation' ? [] : [fault('offering.license-pattern', offering.id, 'a right-to-use licence is recognised at a point in time on activation')];
};
const checkCapability = (offering) => toScaled(offering.baseline.minutesPerUnit) > 0n ? [] : [fault('offering.baseline-not-positive', offering.id, 'baseline minutes per unit are positive')];
const checkBundle = (offering) => {
    const ids = offering.components.map((component) => component.offeringId);
    const residuals = offering.components.filter((component) => component.ssp?.method === 'residual').length;
    const missingSsp = offering.components.filter((component) => component.ssp === undefined).length;
    return [
        ...(new Set(ids).size === ids.length ? [] : [fault('offering.bundle-duplicate-component', offering.id, 'components are distinct')]),
        ...(ids.includes(offering.id) ? [fault('offering.bundle-contains-itself', offering.id, 'a bundle does not contain itself')] : []),
        ...(offering.components.some((component) => toScaled(component.quantity) <= 0n) ? [fault('offering.bundle-quantity', offering.id, 'component quantities are positive')] : []),
        ...(residuals > 1 ? [fault('offering.bundle-residuals', offering.id, 'at most one component uses the residual method')] : []),
        ...(missingSsp > 0 ? [fault('offering.bundle-ssp-missing', offering.id, `${missingSsp} component(s) lack standalone selling price evidence`, 'warning')] : []),
    ];
};
/**
 * Validate an offering: revision chain, interval, licence recognition pattern,
 * capability baseline and bundle composition.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateOffering = (offering) => [
    ...common(offering),
    ...Offering.match(offering, {
        product: () => [],
        service: () => [],
        license: checkLicense,
        subscription: () => [],
        capability: checkCapability,
        bundle: checkBundle,
    }),
];
//# sourceMappingURL=Offering.js.map