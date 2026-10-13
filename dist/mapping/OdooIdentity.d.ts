import { Schema } from 'effect';
export declare const OdooCompanyRow: Schema.Struct<{
    readonly id: Schema.Number;
    readonly name: Schema.NonEmptyString;
    readonly active: Schema.Boolean;
    readonly parent_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Number, Schema.Tuple<readonly [Schema.Number, Schema.String]>]>;
    readonly partner_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Number, Schema.Tuple<readonly [Schema.Number, Schema.String]>]>;
}>;
export declare const OdooPartnerRow: Schema.Struct<{
    readonly id: Schema.Number;
    readonly name: Schema.NonEmptyString;
    readonly active: Schema.Boolean;
    readonly is_company: Schema.Boolean;
    readonly company_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Number, Schema.Tuple<readonly [Schema.Number, Schema.String]>]>;
    readonly parent_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Number, Schema.Tuple<readonly [Schema.Number, Schema.String]>]>;
    readonly commercial_partner_id: Schema.Union<readonly [Schema.Literal<false>, Schema.Number, Schema.Tuple<readonly [Schema.Number, Schema.String]>]>;
}>;
/** Clone installations must receive distinct installation IDs, even for identical DB bytes. */
export declare const OdooInstallation: Schema.Struct<{
    readonly installationId: Schema.NonEmptyString;
    readonly databaseIdentityDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly sourceConfiguration: Schema.Struct<{
        readonly product: Schema.NonEmptyString;
        readonly version: Schema.NonEmptyString;
        readonly modules: Schema.$Array<Schema.NonEmptyString>;
        readonly configurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    }>;
    readonly selectedCompanyRecordKey: Schema.NonEmptyString;
    readonly allowedCompanyRecordKeys: Schema.NonEmptyArray<Schema.NonEmptyString>;
    readonly companyDependentFields: Schema.$Array<Schema.NonEmptyString>;
}>;
export type OdooInstallation = typeof OdooInstallation.Type;
/** The extraction packet pins context; a caller cannot silently swap company-dependent values. */
export declare const OdooIdentityInput: Schema.Struct<{
    readonly installation: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly databaseIdentityDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly sourceConfiguration: Schema.Struct<{
            readonly product: Schema.NonEmptyString;
            readonly version: Schema.NonEmptyString;
            readonly modules: Schema.$Array<Schema.NonEmptyString>;
            readonly configurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        }>;
        readonly selectedCompanyRecordKey: Schema.NonEmptyString;
        readonly allowedCompanyRecordKeys: Schema.NonEmptyArray<Schema.NonEmptyString>;
        readonly companyDependentFields: Schema.$Array<Schema.NonEmptyString>;
    }>;
    readonly source: Schema.Struct<{
        readonly installationId: Schema.NonEmptyString;
        readonly model: Schema.NonEmptyString;
        readonly recordKey: Schema.NonEmptyString;
    }>;
    readonly snapshotConfigurationDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly snapshotDatabaseIdentityDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly snapshotCompanyRecordKey: Schema.NonEmptyString;
    readonly companyContext: Schema.Struct<{
        readonly namespace: Schema.NonEmptyString;
        readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
        readonly id: Schema.NonEmptyString;
    }>;
    readonly model: Schema.Literals<readonly ["res.company", "res.partner"]>;
    readonly row: Schema.Unknown;
    readonly companyDependentValues: Schema.$Record<Schema.String, Schema.Unknown>;
    readonly bindings: Schema.$Array<Schema.Struct<{
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
    }>>;
    readonly asOf: Schema.brand<Schema.String, "keiretsu/IsoDate">;
}>;
export type OdooIdentityInput = typeof OdooIdentityInput.Type;
export declare const OdooIdentityResult: Schema.TaggedUnion<{
    readonly mapped: Schema.TaggedStruct<"mapped", {
        readonly canonical: Schema.Struct<{
            readonly namespace: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
            readonly id: Schema.NonEmptyString;
        }>;
        readonly relationship: Schema.Literals<readonly ["kind-equivalence", "branch-of", "contact-of", "projection-of"]>;
        readonly binding: Schema.Struct<{
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
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly companyContext: Schema.Struct<{
            readonly namespace: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
            readonly id: Schema.NonEmptyString;
        }>;
        readonly lifecycle: Schema.Literals<readonly ["active", "archived"]>;
        readonly classification: Schema.Literals<readonly ["company", "branch", "company-contact", "contact", "shared-contact"]>;
        readonly sourceParentRecordKey: Schema.optional<Schema.NonEmptyString>;
        readonly sourceCommercialPartnerRecordKey: Schema.optional<Schema.NonEmptyString>;
    }>;
    readonly ambiguous: Schema.TaggedStruct<"ambiguous", {
        readonly reason: Schema.NonEmptyString;
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly companyContext: Schema.Struct<{
            readonly namespace: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
            readonly id: Schema.NonEmptyString;
        }>;
        readonly lifecycle: Schema.Literals<readonly ["active", "archived"]>;
        readonly classification: Schema.Literals<readonly ["company", "branch", "company-contact", "contact", "shared-contact"]>;
        readonly sourceParentRecordKey: Schema.optional<Schema.NonEmptyString>;
        readonly sourceCommercialPartnerRecordKey: Schema.optional<Schema.NonEmptyString>;
    }>;
    readonly unresolved: Schema.TaggedStruct<"unresolved", {
        readonly reason: Schema.NonEmptyString;
        readonly source: Schema.Struct<{
            readonly installationId: Schema.NonEmptyString;
            readonly model: Schema.NonEmptyString;
            readonly recordKey: Schema.NonEmptyString;
        }>;
        readonly companyContext: Schema.Struct<{
            readonly namespace: Schema.NonEmptyString;
            readonly kind: Schema.Literals<readonly ["company", "legal-entity", "person", "engagement", "service", "work-order", "service-line", "activity", "time-entry", "economic-event", "billing-account", "subscription", "company-group", "invoice", "cost-object", "counterparty", "project", "brand", "tax-group", "work-item", "work-request", "service-case", "work-observation", "work-container"]>;
            readonly id: Schema.NonEmptyString;
        }>;
        readonly lifecycle: Schema.Literals<readonly ["active", "archived"]>;
        readonly classification: Schema.Literals<readonly ["company", "branch", "company-contact", "contact", "shared-contact"]>;
        readonly sourceParentRecordKey: Schema.optional<Schema.NonEmptyString>;
        readonly sourceCommercialPartnerRecordKey: Schema.optional<Schema.NonEmptyString>;
    }>;
    readonly unsupported: Schema.TaggedStruct<"unsupported", {
        readonly reason: Schema.NonEmptyString;
    }>;
}>;
export type OdooIdentityResult = typeof OdooIdentityResult.Type;
/**
 * Decodes source identity facets. No name matching, ownership, payer inference,
 * ACL grant, or provider write. Shared contacts remain context-restricted facts.
 * Upstream: Odoo 20.0 Community 99e83fca911ac2d69b44e86219860077bdf8ebc8.
 */
export declare const decodeOdooIdentity: (value: unknown) => OdooIdentityResult;
//# sourceMappingURL=OdooIdentity.d.ts.map