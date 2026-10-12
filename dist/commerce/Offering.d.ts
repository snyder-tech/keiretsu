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
import type { ValidationIssue } from '../core/Issue.ts';
/**
 * ISO 8601 duration (`P1M`, `P1Y`, `P3Y`, `PT168H`).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Iso8601Duration: Schema.String;
/**
 * Recognition pattern hint (ASC 606 / IFRS 15).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RecognitionHint: Schema.TaggedUnion<{
    readonly "over-time": Schema.TaggedStruct<"over-time", {
        readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
    }>;
    readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
        readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type RecognitionHint = typeof RecognitionHint.Type;
/**
 * Item classification (UNSPSC, CPV, HSN/SAC, internal).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ItemClassification: Schema.Struct<{
    readonly scheme: Schema.String;
    readonly code: Schema.NonEmptyString;
}>;
/**
 * A capability's baseline of human minutes per value unit.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const CapabilityBaseline: Schema.TaggedUnion<{
    readonly estimated: Schema.TaggedStruct<"estimated", {
        readonly minutesPerUnit: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>;
    readonly calibrated: Schema.TaggedStruct<"calibrated", {
        readonly minutesPerUnit: Schema.brand<Schema.String, "keiretsu/Decimal">;
        readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>;
}>;
/** @since 0.1.0 @category models */
export type CapabilityBaseline = typeof CapabilityBaseline.Type;
/**
 * A component of a bundle, with its standalone selling price evidence when known.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BundleComponent: Schema.Struct<{
    readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
    readonly ssp: Schema.optional<Schema.Struct<{
        readonly method: Schema.Union<readonly [Schema.Literals<readonly ["observable", "adjusted-market", "expected-cost-plus-margin", "residual"]>, Schema.String]>;
        readonly evidence: Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type BundleComponent = typeof BundleComponent.Type;
/**
 * An offering.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Offering: Schema.TaggedUnion<{
    readonly product: Schema.TaggedStruct<"product", {
        readonly fulfilment: Schema.Literals<readonly ["physical", "digital"]>;
        /** Seller of record. */
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly classification: Schema.optional<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly code: Schema.NonEmptyString;
        }>>;
        readonly recognition: Schema.TaggedUnion<{
            readonly "over-time": Schema.TaggedStruct<"over-time", {
                readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
            }>;
            readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
                readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    }>;
    readonly capability: Schema.TaggedStruct<"capability", {
        readonly capabilityKey: Schema.String;
        readonly version: Schema.String;
        readonly valueUnit: Schema.String;
        readonly baseline: Schema.TaggedUnion<{
            readonly estimated: Schema.TaggedStruct<"estimated", {
                readonly minutesPerUnit: Schema.brand<Schema.String, "keiretsu/Decimal">;
            }>;
            readonly calibrated: Schema.TaggedStruct<"calibrated", {
                readonly minutesPerUnit: Schema.brand<Schema.String, "keiretsu/Decimal">;
                readonly evidence: Schema.NonEmptyArray<Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>>;
            }>;
        }>;
        readonly commercialStatus: Schema.Literals<readonly ["internal", "included", "priceable"]>;
        /** Seller of record. */
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly classification: Schema.optional<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly code: Schema.NonEmptyString;
        }>>;
        readonly recognition: Schema.TaggedUnion<{
            readonly "over-time": Schema.TaggedStruct<"over-time", {
                readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
            }>;
            readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
                readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    }>;
    readonly service: Schema.TaggedStruct<"service", {
        readonly deliveryPattern: Schema.Union<readonly [Schema.Literals<readonly ["time-based", "deliverable", "stand-ready"]>, Schema.String]>;
        /** Seller of record. */
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly classification: Schema.optional<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly code: Schema.NonEmptyString;
        }>>;
        readonly recognition: Schema.TaggedUnion<{
            readonly "over-time": Schema.TaggedStruct<"over-time", {
                readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
            }>;
            readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
                readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    }>;
    readonly license: Schema.TaggedStruct<"license", {
        readonly ipNature: Schema.Literals<readonly ["right-to-use", "right-to-access"]>;
        readonly licenseModel: Schema.Union<readonly [Schema.Literals<readonly ["seat", "term", "perpetual", "metered"]>, Schema.String]>;
        /** Seller of record. */
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly classification: Schema.optional<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly code: Schema.NonEmptyString;
        }>>;
        readonly recognition: Schema.TaggedUnion<{
            readonly "over-time": Schema.TaggedStruct<"over-time", {
                readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
            }>;
            readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
                readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    }>;
    readonly subscription: Schema.TaggedStruct<"subscription", {
        readonly term: Schema.String;
        readonly billingFrequency: Schema.String;
        readonly autoRenew: Schema.Boolean;
        /** Seller of record. */
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly classification: Schema.optional<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly code: Schema.NonEmptyString;
        }>>;
        readonly recognition: Schema.TaggedUnion<{
            readonly "over-time": Schema.TaggedStruct<"over-time", {
                readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
            }>;
            readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
                readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    }>;
    readonly bundle: Schema.TaggedStruct<"bundle", {
        readonly components: Schema.NonEmptyArray<Schema.Struct<{
            readonly offeringId: Schema.brand<Schema.String, "keiretsu/OfferingId">;
            readonly quantity: Schema.brand<Schema.String, "keiretsu/Decimal">;
            readonly ssp: Schema.optional<Schema.Struct<{
                readonly method: Schema.Union<readonly [Schema.Literals<readonly ["observable", "adjusted-market", "expected-cost-plus-margin", "residual"]>, Schema.String]>;
                readonly evidence: Schema.Struct<{
                    readonly kind: Schema.NonEmptyString;
                    readonly ref: Schema.NonEmptyString;
                    readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
                }>;
            }>>;
        }>>;
        /** Seller of record. */
        readonly owner: Schema.brand<Schema.String, "keiretsu/EntityId">;
        readonly name: Schema.NonEmptyString;
        readonly classification: Schema.optional<Schema.Struct<{
            readonly scheme: Schema.String;
            readonly code: Schema.NonEmptyString;
        }>>;
        readonly recognition: Schema.TaggedUnion<{
            readonly "over-time": Schema.TaggedStruct<"over-time", {
                readonly measure: Schema.Union<readonly [Schema.Literals<readonly ["straight-line", "output-units", "input-hours", "as-invoiced"]>, Schema.String]>;
            }>;
            readonly "point-in-time": Schema.TaggedStruct<"point-in-time", {
                readonly trigger: Schema.Union<readonly [Schema.Literals<readonly ["delivery", "acceptance", "activation"]>, Schema.String]>;
            }>;
        }>;
        readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
        readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
        readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
        readonly revision: Schema.Number;
        readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        readonly id: Schema.brand<Schema.String, "keiretsu/OfferingId">;
    }>;
}>;
/** @since 0.1.0 @category models */
export type Offering = typeof Offering.Type;
/**
 * Validate an offering: revision chain, interval, licence recognition pattern,
 * capability baseline and bundle composition.
 *
 * @since 0.1.0
 * @category validators
 */
export declare const validateOffering: (offering: Offering) => ReadonlyArray<ValidationIssue>;
//# sourceMappingURL=Offering.d.ts.map