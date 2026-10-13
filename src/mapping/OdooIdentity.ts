import { Schema } from 'effect';

import { Sha256 } from '../core/CanonicalJson.ts';
import { IsoDate } from '../core/Temporal.ts';
import { CanonicalRef, canonicalRefKey, type CanonicalKind } from './CanonicalRef.ts';
import { SourceConfiguration } from './MappingDefinition.ts';
import { activeSourceBindings, BindingRelationship, SourceBinding } from './SourceBinding.ts';
import { SourceRecordRef } from './SourceRecordRef.ts';

const OdooId = Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0));
const Many2one = Schema.Union([Schema.Literal(false), OdooId, Schema.Tuple([OdooId, Schema.String])]);
type Many2one = typeof Many2one.Type;
const relationKey = (relation: Many2one): string | undefined => (relation === false ? undefined : String(typeof relation === 'number' ? relation : relation[0]));
const CompanyContext = CanonicalRef.check(
  Schema.makeFilter((ref) => (ref.kind === 'company' || ref.kind === 'legal-entity' ? undefined : 'Company context must refer to a company or accounting legal-entity facet')),
);

export const OdooCompanyRow = Schema.Struct({
  id: OdooId,
  name: Schema.NonEmptyString,
  active: Schema.Boolean,
  parent_id: Many2one,
  partner_id: Many2one,
});
export const OdooPartnerRow = Schema.Struct({
  id: OdooId,
  name: Schema.NonEmptyString,
  active: Schema.Boolean,
  is_company: Schema.Boolean,
  company_id: Many2one,
  parent_id: Many2one,
  commercial_partner_id: Many2one,
});

/** Clone installations must receive distinct installation IDs, even for identical DB bytes. */
export const OdooInstallation = Schema.Struct({
  installationId: Schema.NonEmptyString,
  databaseIdentityDigest: Sha256,
  sourceConfiguration: SourceConfiguration,
  selectedCompanyRecordKey: Schema.NonEmptyString,
  allowedCompanyRecordKeys: Schema.NonEmptyArray(Schema.NonEmptyString),
  companyDependentFields: Schema.Array(Schema.NonEmptyString),
}).check(Schema.makeFilter((configuration) => (configuration.allowedCompanyRecordKeys.includes(configuration.selectedCompanyRecordKey) ? undefined : 'The selected company must be allowed')));
export type OdooInstallation = typeof OdooInstallation.Type;

/** The extraction packet pins context; a caller cannot silently swap company-dependent values. */
export const OdooIdentityInput = Schema.Struct({
  installation: OdooInstallation,
  source: SourceRecordRef,
  snapshotConfigurationDigest: Sha256,
  snapshotDatabaseIdentityDigest: Sha256,
  snapshotCompanyRecordKey: Schema.NonEmptyString,
  companyContext: CompanyContext,
  model: Schema.Literals(['res.company', 'res.partner']),
  row: Schema.Unknown,
  companyDependentValues: Schema.Record(Schema.String, Schema.Unknown),
  bindings: Schema.Array(SourceBinding),
  asOf: IsoDate,
});
export type OdooIdentityInput = typeof OdooIdentityInput.Type;

const IdentityFields = {
  source: SourceRecordRef,
  companyContext: CanonicalRef,
  lifecycle: Schema.Literals(['active', 'archived']),
  classification: Schema.Literals(['company', 'branch', 'company-contact', 'contact', 'shared-contact']),
  sourceParentRecordKey: Schema.optional(Schema.NonEmptyString),
  sourceCommercialPartnerRecordKey: Schema.optional(Schema.NonEmptyString),
};
export const OdooIdentityResult = Schema.TaggedUnion({
  mapped: { ...IdentityFields, canonical: CanonicalRef, relationship: BindingRelationship, binding: SourceBinding },
  unresolved: { ...IdentityFields, reason: Schema.NonEmptyString },
  ambiguous: { ...IdentityFields, reason: Schema.NonEmptyString },
  unsupported: { reason: Schema.NonEmptyString },
});
export type OdooIdentityResult = typeof OdooIdentityResult.Type;

const contextBindingIssue = (input: OdooIdentityInput): string | undefined => {
  const companySource = { installationId: input.source.installationId, model: 'res.company', recordKey: input.snapshotCompanyRecordKey };
  const companyBindings = activeSourceBindings(input.bindings, companySource, input.asOf).filter((binding) => binding.relationship === 'kind-equivalence' || binding.relationship === 'branch-of');
  const companyTargets = new Set(companyBindings.map((binding) => canonicalRefKey(binding.canonical)));
  if (companyTargets.size !== 1 || !companyTargets.has(canonicalRefKey(input.companyContext))) return 'Company context requires one exact evidenced company binding.';
  return undefined;
};

const configurationIssue = (input: OdooIdentityInput): string | undefined => {
  if (input.installation.sourceConfiguration.product !== 'odoo' || input.installation.sourceConfiguration.version !== '20.0') return 'Only the pinned Odoo 20.0 adapter is supported.';
  if (input.source.installationId !== input.installation.installationId || input.source.model !== input.model) return 'Exact installation and model identity must match.';
  if (input.snapshotConfigurationDigest !== input.installation.sourceConfiguration.configurationDigest || input.snapshotDatabaseIdentityDigest !== input.installation.databaseIdentityDigest)
    return 'The extraction configuration and database identity must match.';
  if (input.snapshotCompanyRecordKey !== input.installation.selectedCompanyRecordKey) return 'Company-dependent values require the selected extraction context.';
  const declared = new Set(input.installation.companyDependentFields);
  if (Object.keys(input.companyDependentValues).some((field) => !declared.has(field))) return 'The packet contains an undeclared company-dependent field.';
  return contextBindingIssue(input);
};

interface IdentityFacts {
  readonly active: boolean;
  readonly classification: 'company' | 'branch' | 'company-contact' | 'contact' | 'shared-contact';
  readonly sourceParentRecordKey?: string | undefined;
  readonly sourceCommercialPartnerRecordKey?: string | undefined;
  readonly relationship: ReadonlyArray<BindingRelationship>;
  readonly equivalenceKinds: ReadonlyArray<CanonicalKind>;
}

const companyFacts = (input: OdooIdentityInput): IdentityFacts | string => {
  const row = Schema.decodeUnknownResult(OdooCompanyRow)(input.row);
  if (row._tag === 'Failure') return 'The res.company record does not match the pinned identity decoder.';
  if (String(row.success.id) !== input.source.recordKey) return 'The packet record key does not match its source row.';
  const parent = relationKey(row.success.parent_id);
  return {
    active: row.success.active,
    classification: parent === undefined ? 'company' : 'branch',
    sourceParentRecordKey: parent,
    relationship: parent === undefined ? ['kind-equivalence'] : ['branch-of'],
    equivalenceKinds: ['company', 'legal-entity'],
  };
};

const partnerFacts = (input: OdooIdentityInput): IdentityFacts | string => {
  const row = Schema.decodeUnknownResult(OdooPartnerRow)(input.row);
  if (row._tag === 'Failure') return 'The res.partner record does not match the pinned identity decoder.';
  if (String(row.success.id) !== input.source.recordKey) return 'The packet record key does not match its source row.';
  const company = relationKey(row.success.company_id);
  if (company !== undefined && company !== input.installation.selectedCompanyRecordKey) return 'The partner is assigned to a different source company.';
  const classification = company === undefined ? 'shared-contact' : row.success.is_company ? 'company-contact' : 'contact';
  return {
    active: row.success.active,
    classification,
    sourceParentRecordKey: relationKey(row.success.parent_id),
    sourceCommercialPartnerRecordKey: relationKey(row.success.commercial_partner_id),
    relationship: ['kind-equivalence', 'contact-of', 'projection-of'],
    equivalenceKinds: row.success.is_company ? ['company', 'legal-entity'] : ['person'],
  };
};

/** Record shape and relationship constrain which canonical facet evidence may assert. */
const bindingKindAllowed = (facts: IdentityFacts, binding: SourceBinding): boolean => {
  if (binding.relationship === 'kind-equivalence') return facts.equivalenceKinds.includes(binding.canonical.kind);
  if (binding.relationship === 'branch-of' || binding.relationship === 'contact-of') return binding.canonical.kind === 'company' || binding.canonical.kind === 'legal-entity';
  return ['company', 'legal-entity', 'person', 'counterparty'].includes(binding.canonical.kind);
};

const identitySnapshot = (input: OdooIdentityInput, facts: IdentityFacts) => ({
  source: input.source,
  companyContext: input.companyContext,
  lifecycle: facts.active ? ('active' as const) : ('archived' as const),
  classification: facts.classification,
  ...(facts.sourceParentRecordKey === undefined ? {} : { sourceParentRecordKey: facts.sourceParentRecordKey }),
  ...(facts.sourceCommercialPartnerRecordKey === undefined ? {} : { sourceCommercialPartnerRecordKey: facts.sourceCommercialPartnerRecordKey }),
});

/**
 * Decodes source identity facets. No name matching, ownership, payer inference,
 * ACL grant, or provider write. Shared contacts remain context-restricted facts.
 * Upstream: Odoo 20.0 Community 99e83fca911ac2d69b44e86219860077bdf8ebc8.
 */
export const decodeOdooIdentity = (value: unknown): OdooIdentityResult => {
  const decoded = Schema.decodeUnknownResult(OdooIdentityInput, { onExcessProperty: 'error' })(value);
  if (decoded._tag === 'Failure') return { _tag: 'unsupported', reason: 'The extraction packet does not match the Odoo identity input contract.' };
  const input = decoded.success;
  const issue = configurationIssue(input);
  if (issue !== undefined) return { _tag: 'unsupported', reason: issue };
  const facts = input.model === 'res.company' ? companyFacts(input) : partnerFacts(input);
  if (typeof facts === 'string') return { _tag: 'unsupported', reason: facts };
  const identity = identitySnapshot(input, facts);
  const bindings = activeSourceBindings(input.bindings, input.source, input.asOf).filter((binding) => facts.relationship.includes(binding.relationship));
  if (bindings.some((binding) => !bindingKindAllowed(facts, binding))) return { _tag: 'unsupported', reason: 'The evidenced relationship targets an incompatible canonical kind.' };
  const targets = new Set(bindings.map((binding) => JSON.stringify([canonicalRefKey(binding.canonical), binding.relationship])));
  if (targets.size > 1) return { _tag: 'ambiguous', ...identity, reason: 'Multiple evidenced identity relationships require explicit selection.' };
  const binding = bindings[0];
  if (binding === undefined) return { _tag: 'unresolved', ...identity, reason: 'No applicable evidenced relationship exists for the exact source record.' };
  return { _tag: 'mapped', ...identity, canonical: binding.canonical, relationship: binding.relationship, binding };
};
