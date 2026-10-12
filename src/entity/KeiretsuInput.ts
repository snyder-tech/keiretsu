/**
 * The adopter's group configuration, authored as data:
 *
 * ```ts
 * export const group = { tenant: 'northwind', entities: { … } } as const satisfies KeiretsuInput
 * ```
 *
 * Declaring config as a plain `as const` value keeps it declaration-safe, and
 * {@link KeySpaceOf} derives one flat literal key space from it, so downstream
 * APIs are generic over a small `KeySpace`, never over the whole config.
 *
 * @since 0.1.0
 * @module
 */
import { CountryCode } from '../core/Country.ts';
import { CurrencyCode } from '../core/Currency.ts';
import { Schema } from 'effect';

import { BrandInput } from './Brand.ts';
import { ControlEdge } from './Control.ts';
import { CounterpartyInput } from './Counterparty.ts';
import { EngagementInput } from './Engagement.ts';
import { LegalEntityInput } from './LegalEntity.ts';
import { OwnershipEdge } from './Ownership.ts';
import { PersonInput } from './Person.ts';
import { SystemInput } from './SystemOfRecord.ts';
import { TaxGroupInput } from './TaxGroup.ts';
import { HolidayPack, WorkCalendar } from './WorkCalendar.ts';

/**
 * Lower-kebab slug used for every config key.
 *
 * @since 0.1.0
 * @category patterns
 */
export const SLUG_PATTERN: RegExp = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * The configuration schema. Structural only; cross-record invariants run in `Invariants`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const KeiretsuInput = Schema.Struct({
  tenant: Schema.String.check(Schema.isPattern(SLUG_PATTERN)),
  entities: Schema.Record(Schema.String, LegalEntityInput),
  counterparties: Schema.optional(Schema.Record(Schema.String, CounterpartyInput)),
  brands: Schema.optional(Schema.Record(Schema.String, BrandInput)),
  systems: Schema.optional(Schema.Record(Schema.String, SystemInput)),
  ownership: Schema.optional(Schema.Array(OwnershipEdge)),
  control: Schema.optional(Schema.Array(ControlEdge)),
  taxGroups: Schema.optional(Schema.Record(Schema.String, TaxGroupInput)),
  people: Schema.optional(Schema.Record(Schema.String, PersonInput)),
  engagements: Schema.optional(Schema.Array(EngagementInput)),
  workCalendars: Schema.optional(Schema.Record(Schema.String, WorkCalendar)),
  holidayPacks: Schema.optional(Schema.Record(Schema.String, HolidayPack)),
  currencies: Schema.optional(Schema.Array(CurrencyCode)),
  countries: Schema.optional(Schema.Array(CountryCode)),
});

/**
 * What an adopter authors: the encoded (plain JSON) side of {@link KeiretsuInput}.
 *
 * @since 0.1.0
 * @category models
 */
export type KeiretsuInput = typeof KeiretsuInput.Encoded;

/**
 * The decoded configuration.
 *
 * @since 0.1.0
 * @category models
 */
export type DecodedInput = typeof KeiretsuInput.Type;

/**
 * A flat literal key space. Every downstream API is generic over `K extends KeySpace`.
 *
 * @since 0.1.0
 * @category models
 */
export interface KeySpace {
  readonly entity: string;
  readonly counterparty: string;
  readonly person: string;
  readonly system: string;
  readonly currency: string;
  readonly country: string;
}

type Field<T, F extends string> = T extends { readonly [P in F]?: infer V } ? V : never;
type KeysOf<T> = T extends Readonly<Record<string, unknown>> ? Extract<keyof T, string> : never;
type ElementOf<T> = T extends ReadonlyArray<infer X> ? X : never;
type TimelineValue<T> = T extends ReadonlyArray<infer S> ? (S extends { readonly value: infer V } ? V : never) : T;
type ValuesOf<T> = T[keyof T];

type EntitiesOf<C extends KeiretsuInput> = C['entities'];
type CounterpartiesOf<C extends KeiretsuInput> = Field<C, 'counterparties'>;

type EntityCurrencies<C extends KeiretsuInput> = ValuesOf<{
  [E in keyof EntitiesOf<C>]: TimelineValue<EntitiesOf<C>[E]['functionalCurrency']> | Field<EntitiesOf<C>[E], 'reportingCurrency'>;
}>;

type EntityCountries<C extends KeiretsuInput> = ValuesOf<{ [E in keyof EntitiesOf<C>]: EntitiesOf<C>[E]['jurisdiction']['country'] }>;

type CounterpartyCountries<C extends KeiretsuInput> = ValuesOf<{
  [P in keyof CounterpartiesOf<C>]: CounterpartiesOf<C>[P] extends { readonly jurisdiction: { readonly country: infer Country } } ? Country : never;
}>;

/**
 * Derive the literal key space of a config declared `as const satisfies KeiretsuInput`.
 *
 * - `entity`, `counterparty`, `person`, `system`: the declared record keys
 * - `currency`: functional and reporting currencies plus `currencies`
 * - `country`: entity and counterparty jurisdictions plus `countries`
 *
 * @since 0.1.0
 * @category models
 */
export type KeySpaceOf<C extends KeiretsuInput> = {
  readonly entity: Extract<keyof EntitiesOf<C>, string>;
  readonly counterparty: KeysOf<CounterpartiesOf<C>>;
  readonly person: KeysOf<Field<C, 'people'>>;
  readonly system: KeysOf<Field<C, 'systems'>>;
  readonly currency: Extract<EntityCurrencies<C> | ElementOf<Field<C, 'currencies'>>, string>;
  readonly country: Extract<EntityCountries<C> | CounterpartyCountries<C> | ElementOf<Field<C, 'countries'>>, string>;
};

/**
 * Party keys of a key space: entities, counterparties and people (one namespace).
 *
 * @since 0.1.0
 * @category models
 */
export type PartyKeyOf<K extends KeySpace> = K['entity'] | K['counterparty'] | K['person'];
