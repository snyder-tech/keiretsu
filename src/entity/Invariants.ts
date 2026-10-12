/**
 * Every config invariant, run after structural decode. Issues carry stable
 * codes; `error` fails decoding, `hold` and `warning` are returned with the
 * decoded group.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `key.pattern` | error | record keys are lower-kebab slugs |
 * | `key.duplicate` | error | entity, counterparty and person keys share one namespace |
 * | `key.former-duplicate` | error | former keys are unique and never a current key |
 * | `id.duplicate` | error | record ids are unique |
 * | `identifier.*` | error/warning | per-scheme format and checksum (see `Identifier`) |
 * | `identifier.duplicate` | error | (scheme, value) is held by one party |
 * | `identifier.scheme-country` | warning | a country scheme matches the party's jurisdiction |
 * | `identifier.gstin-pan-mismatch` | error | a GSTIN embeds the entity's PAN |
 * | `timeline.order` | error | timelines are ordered, contiguous, non-overlapping, open only at the end |
 * | `timeline.outside-lifecycle` | error | timelines lie inside the entity lifecycle |
 * | `currency.unknown` | error | currencies are active ISO 4217 codes |
 * | `ref.unresolved` | error | every key reference resolves |
 *
 * Graph and people invariants are listed in `GraphInvariants` and `PeopleInvariants`.
 *
 * @since 0.1.0
 * @module
 */
import { iso4217, type CurrencyTableShape } from '../core/Currency.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';

import { validateGraph } from './GraphInvariants.ts';
import { checkIdentifier, gstinPan, schemeCountry, type Identifier } from './Identifier.ts';
import { SLUG_PATTERN } from './KeiretsuInput.ts';
import type { LegalEntity } from './LegalEntity.ts';
import { keySets, type KeiretsuModel, type KeySets } from './Model.ts';
import { validatePeople } from './PeopleInvariants.ts';
import { samplePack, type RegimeCodePack } from './RegimePack.ts';
import { extentOf, problems, type Span, within } from './Timeline.ts';

/**
 * Validation options.
 *
 * @since 0.1.0
 * @category models
 */
export interface ValidateOptions {
  /** Regime code pack for withholding and social-security codes (default: the bundled sample). */
  readonly regimePack?: RegimeCodePack | undefined;
  /** Currency table (default: bundled ISO 4217). */
  readonly currencyTable?: CurrencyTableShape | undefined;
}

const keyedSections = (model: KeiretsuModel): ReadonlyArray<readonly [string, ReadonlyArray<{ readonly key: string }>]> => [
  ['entities', model.entities],
  ['counterparties', model.counterparties],
  ['people', model.people],
  ['brands', model.brands],
  ['systems', model.systems],
  ['taxGroups', model.taxGroups],
  ['workCalendars', model.workCalendars],
  ['holidayPacks', model.holidayPacks],
];

const duplicates = (values: ReadonlyArray<string>): ReadonlyArray<string> => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

const keyIssues = (model: KeiretsuModel): ReadonlyArray<ValidationIssue> => {
  const pattern = keyedSections(model).flatMap(([section, records]) =>
    records.filter((record) => !SLUG_PATTERN.test(record.key)).map((record) => issue('key.pattern', 'error', `${section}.${record.key}`, 'keys are lower-kebab slugs')),
  );
  const partyKeys = [...model.entities, ...model.counterparties, ...model.people].map((record) => record.key);
  const current = new Set(partyKeys);
  const former = model.entities.flatMap((entity) => entity.formerKeys);
  return [
    ...pattern,
    ...duplicates(partyKeys).map((key) => issue('key.duplicate', 'error', key, `${key} is declared in more than one party section`)),
    ...[...duplicates(former), ...former.filter((key) => current.has(key))].map((key) => issue('key.former-duplicate', 'error', key, `former key ${key} is reused`)),
  ];
};

const idIssues = (model: KeiretsuModel): ReadonlyArray<ValidationIssue> => {
  const ids: ReadonlyArray<string> = [
    ...model.entities.map((record) => record.id),
    ...model.counterparties.map((record) => record.id),
    ...model.people.map((record) => record.id),
    ...model.engagements.map((record) => record.id),
  ];
  return duplicates(ids.map((id) => id.toLowerCase())).map((id) => issue('id.duplicate', 'error', id, `id ${id} is used by more than one record`));
};

interface IdentifierHolder {
  readonly subject: string;
  readonly country: string;
  readonly identifiers: ReadonlyArray<Identifier>;
}

const holders = (model: KeiretsuModel): ReadonlyArray<IdentifierHolder> => [
  ...model.entities.map((entity) => ({ subject: `entities.${entity.key}`, country: entity.jurisdiction.country, identifiers: entity.identifiers })),
  ...model.counterparties.map((party) => ({ subject: `counterparties.${party.key}`, country: party.jurisdiction.country, identifiers: party.identifiers ?? [] })),
];

const gstinPanIssues = (holder: IdentifierHolder): ReadonlyArray<ValidationIssue> => {
  const pan = holder.identifiers.find((identifier) => identifier.scheme === 'in-pan')?.value;
  if (pan === undefined) return [];
  return holder.identifiers
    .filter((identifier) => identifier.scheme === 'in-gstin' && gstinPan(identifier.value) !== pan)
    .map((identifier) => issue('identifier.gstin-pan-mismatch', 'error', holder.subject, `GSTIN ${identifier.value} does not embed the declared PAN`));
};

const identifierIssues = (model: KeiretsuModel): ReadonlyArray<ValidationIssue> => {
  const all = holders(model);
  const pairs = all.flatMap((holder) => holder.identifiers.map((identifier) => `${identifier.scheme}|${identifier.value}`));
  return [
    ...all.flatMap((holder) =>
      holder.identifiers.flatMap((identifier) => [
        ...checkIdentifier(identifier).map((finding) => issue(finding.code, finding.severity, holder.subject, `${identifier.scheme}: ${finding.message}`)),
        ...(schemeCountry(identifier.scheme) !== undefined && schemeCountry(identifier.scheme) !== holder.country
          ? [issue('identifier.scheme-country', 'warning', holder.subject, `${identifier.scheme} is issued outside ${holder.country}`)]
          : []),
      ]),
    ),
    ...all.flatMap(gstinPanIssues),
    ...duplicates(pairs).map((pair) => issue('identifier.duplicate', 'error', 'identifiers', `identifier ${pair} is held by more than one party`)),
  ];
};

const timelinesOf = (entity: LegalEntity): ReadonlyArray<readonly [string, ReadonlyArray<Span<unknown>>]> => [
  ['legalName', entity.legalName],
  ['functionalCurrency', entity.functionalCurrency],
  ['fiscalYear', entity.fiscalYear],
  ['accountingBasis', entity.accountingBasis],
  ['booksSystem', entity.booksSystem ?? []],
];

const timelineIssues = (entity: LegalEntity): ReadonlyArray<ValidationIssue> => {
  const subject = `entities.${entity.key}`;
  const life = extentOf(entity.lifecycle);
  return [
    ...problems(entity.lifecycle).map((message) => issue('timeline.order', 'error', `${subject}.lifecycle`, message)),
    ...timelinesOf(entity).flatMap(([field, timeline]) => [
      ...problems(timeline).map((message) => issue('timeline.order', 'error', `${subject}.${field}`, message)),
      ...timeline
        .filter((span) => !within(span, life))
        .map((span) => issue('timeline.outside-lifecycle', 'error', `${subject}.${field}`, `segment from ${span.validFrom} lies outside the lifecycle`)),
    ]),
  ];
};

const currencyIssues = (model: KeiretsuModel, table: CurrencyTableShape): ReadonlyArray<ValidationIssue> => {
  const used = [
    ...model.entities.flatMap((entity) => [
      ...entity.functionalCurrency.map((span) => ({ code: span.value, subject: `entities.${entity.key}` })),
      ...(entity.reportingCurrency === undefined ? [] : [{ code: entity.reportingCurrency, subject: `entities.${entity.key}` }]),
    ]),
    ...model.currencies.map((code) => ({ code, subject: 'currencies' })),
  ];
  return used.filter((entry) => table.minorUnits(entry.code) === undefined).map((entry) => issue('currency.unknown', 'error', entry.subject, `${entry.code} is not in ${table.edition}`));
};

const unresolved = (subject: string, kind: string, key: string): ValidationIssue => issue('ref.unresolved', 'error', subject, `${kind} ${key} is not declared`);

const entityReferenceIssues = (model: KeiretsuModel, keys: KeySets): ReadonlyArray<ValidationIssue> =>
  model.entities.flatMap((entity) => {
    const subject = `entities.${entity.key}`;
    return [
      ...(entity.booksSystem ?? []).filter((span) => !keys.system.has(span.value)).map((span) => unresolved(subject, 'system', span.value)),
      ...(entity.workCalendar === undefined || keys.calendar.has(entity.workCalendar) ? [] : [unresolved(subject, 'work calendar', entity.workCalendar)]),
    ];
  });

const referenceIssues = (model: KeiretsuModel, keys: KeySets): ReadonlyArray<ValidationIssue> => [
  ...entityReferenceIssues(model, keys),
  ...model.brands.flatMap((brand) => (keys.entity.has(brand.entity) ? [] : [unresolved(`brands.${brand.key}`, 'entity', brand.entity)])),
  ...model.ownership.flatMap((edge, index) => [
    ...(keys.party.has(edge.owner) ? [] : [unresolved(`ownership[${index}]`, 'party', edge.owner)]),
    ...(keys.entity.has(edge.owned) ? [] : [unresolved(`ownership[${index}]`, 'entity', edge.owned)]),
  ]),
  ...model.control.flatMap((edge, index) => [
    ...(keys.party.has(edge.controller) ? [] : [unresolved(`control[${index}]`, 'party', edge.controller)]),
    ...(keys.entity.has(edge.controlled) ? [] : [unresolved(`control[${index}]`, 'entity', edge.controlled)]),
  ]),
  ...model.taxGroups.flatMap((group) => group.members.filter((member) => !keys.entity.has(member)).map((member) => unresolved(`taxGroups.${group.key}`, 'entity', member))),
  ...model.people.flatMap((person) =>
    person.subjects.flatMap((ref) => [
      ...(keys.entity.has(ref.issuer) ? [] : [unresolved(`people.${person.key}`, 'entity', ref.issuer)]),
      ...(ref.system === undefined || keys.system.has(ref.system) ? [] : [unresolved(`people.${person.key}`, 'system', ref.system)]),
    ]),
  ),
];

/**
 * Run every invariant over a normalized model.
 *
 * @since 0.1.0
 * @category validation
 */
export const validate = (model: KeiretsuModel, options: ValidateOptions = {}): ReadonlyArray<ValidationIssue> => {
  const keys = keySets(model);
  return [
    ...keyIssues(model),
    ...idIssues(model),
    ...identifierIssues(model),
    ...model.entities.flatMap(timelineIssues),
    ...currencyIssues(model, options.currencyTable ?? iso4217),
    ...referenceIssues(model, keys),
    ...validateGraph(model),
    ...validatePeople({ model, keys, regimePack: options.regimePack ?? samplePack() }),
  ];
};
