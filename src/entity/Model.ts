/**
 * The normalized group model: decoded config with every timeline expanded and
 * every keyed record carrying its key.
 *
 * @since 0.1.0
 * @module
 */
import type { CountryCode } from '../core/Country.ts';
import type { CurrencyCode } from '../core/Currency.ts';

import type { Brand } from './Brand.ts';
import type { ControlEdge } from './Control.ts';
import type { Counterparty } from './Counterparty.ts';
import type { Engagement } from './Engagement.ts';
import type { DecodedInput } from './KeiretsuInput.ts';
import type { LegalEntity } from './LegalEntity.ts';
import type { OwnershipEdge } from './Ownership.ts';
import type { Person } from './Person.ts';
import type { SystemOfRecord } from './SystemOfRecord.ts';
import type { TaxGroup } from './TaxGroup.ts';
import { extentOf, normalize } from './Timeline.ts';
import type { HolidayPack, WorkCalendar } from './WorkCalendar.ts';

/**
 * A keyed record.
 *
 * @since 0.1.0
 * @category models
 */
export type Keyed<A> = A & { readonly key: string };

/**
 * The normalized model.
 *
 * @since 0.1.0
 * @category models
 */
export interface KeiretsuModel {
  readonly tenant: string;
  readonly entities: ReadonlyArray<LegalEntity>;
  readonly counterparties: ReadonlyArray<Counterparty>;
  readonly brands: ReadonlyArray<Brand>;
  readonly systems: ReadonlyArray<SystemOfRecord>;
  readonly ownership: ReadonlyArray<OwnershipEdge>;
  readonly control: ReadonlyArray<ControlEdge>;
  readonly taxGroups: ReadonlyArray<TaxGroup>;
  readonly people: ReadonlyArray<Person>;
  readonly engagements: ReadonlyArray<Engagement>;
  readonly workCalendars: ReadonlyArray<Keyed<WorkCalendar>>;
  readonly holidayPacks: ReadonlyArray<Keyed<HolidayPack>>;
  readonly currencies: ReadonlyArray<CurrencyCode>;
  readonly countries: ReadonlyArray<CountryCode>;
}

const keyed = <A>(record: Readonly<Record<string, A>> | undefined): ReadonlyArray<Keyed<A>> =>
  Object.entries(record ?? {}).map(([key, value]) => ({ ...value, key }));

const entityOf = (key: string, input: DecodedInput['entities'][string]): LegalEntity => {
  const lifecycle = normalize(input.lifecycle, { validFrom: input.lifecycle[0].validFrom });
  const extent = extentOf(lifecycle);
  return {
    key,
    id: input.id,
    formerKeys: input.formerKeys ?? [],
    legalName: normalize(input.legalName, extent),
    legalForm: input.legalForm,
    jurisdiction: input.jurisdiction,
    identifiers: input.identifiers ?? [],
    functionalCurrency: normalize(input.functionalCurrency, extent),
    reportingCurrency: input.reportingCurrency,
    fiscalYear: normalize(input.fiscalYear, extent),
    accountingBasis: normalize(input.accountingBasis, extent),
    booksSystem: input.booksSystem === undefined ? undefined : normalize(input.booksSystem, extent),
    lifecycle,
    workCalendar: input.workCalendar,
  };
};

/**
 * Normalize decoded config into the model.
 *
 * @since 0.1.0
 * @category constructors
 */
export const toModel = (input: DecodedInput): KeiretsuModel => ({
  tenant: input.tenant,
  entities: Object.entries(input.entities).map(([key, entity]) => entityOf(key, entity)),
  counterparties: keyed(input.counterparties),
  brands: keyed(input.brands),
  systems: keyed(input.systems),
  ownership: input.ownership ?? [],
  control: input.control ?? [],
  taxGroups: keyed(input.taxGroups),
  people: keyed(input.people).map((person) => ({ key: person.key, id: person.id, subjects: person.subjects ?? [] })),
  engagements: input.engagements ?? [],
  workCalendars: keyed(input.workCalendars),
  holidayPacks: keyed(input.holidayPacks),
  currencies: input.currencies ?? [],
  countries: input.countries ?? [],
});

/**
 * Declared key sets, for reference checks.
 *
 * @since 0.1.0
 * @category models
 */
export interface KeySets {
  readonly entity: ReadonlySet<string>;
  readonly counterparty: ReadonlySet<string>;
  readonly person: ReadonlySet<string>;
  readonly party: ReadonlySet<string>;
  readonly system: ReadonlySet<string>;
  readonly calendar: ReadonlySet<string>;
  readonly holidayPack: ReadonlySet<string>;
}

/**
 * Key sets of a model.
 *
 * @since 0.1.0
 * @category models
 */
export const keySets = (model: KeiretsuModel): KeySets => {
  const entity = new Set(model.entities.map((record) => record.key));
  const counterparty = new Set(model.counterparties.map((record) => record.key));
  const person = new Set(model.people.map((record) => record.key));
  return {
    entity,
    counterparty,
    person,
    party: new Set([...entity, ...counterparty, ...person]),
    system: new Set(model.systems.map((record) => record.key)),
    calendar: new Set(model.workCalendars.map((record) => record.key)),
    holidayPack: new Set(model.holidayPacks.map((record) => record.key)),
  };
};
