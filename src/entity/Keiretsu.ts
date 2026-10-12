/**
 * The `Keiretsu` facade, decoder and service.
 *
 * ```ts
 * export const group = { tenant: 'northwind', entities: { … } } as const satisfies KeiretsuInput
 * const k = Keiretsu.make(group)        // Keiretsu<KeySpaceOf<typeof group>>
 * k.money('1000.00', 'PKR')             // ok
 * k.money('1', 'JPY')                   // compile error: 'JPY' is not declared
 * ```
 *
 * {@link decodeKeiretsu} validates the same config at runtime (structure with
 * Effect Schema, then every invariant) and fails with
 * {@link KeiretsuConfigError}. {@link KeiretsuService} is one statically
 * declared wide tag; {@link get} narrows it to a key space. Tags are never
 * minted per config.
 *
 * Narrowed literal schemas (`k.schemas`) are adopter policy: use them after a
 * wire decode to raise holds (`k.screen`), never as wire decoders.
 *
 * @since 0.1.0
 * @module
 */
import type { CounterpartyId as CounterpartyIdSchema, EntityId, PersonId } from '../core/Ids.ts';
import { issue, ValidationIssue } from '../core/Issue.ts';
import { iso4217 } from '../core/Currency.ts';
import { make as makeMoney, type Money } from '../core/Money.ts';
import type { IsoDate } from '../core/Temporal.ts';
import { Context, Effect, Layer, Result, Schema, SchemaIssue } from 'effect';

import { availableMinutes, type AvailabilityResult } from './Availability.ts';
import type { ControlEdge } from './Control.ts';
import type { Counterparty } from './Counterparty.ts';
import type { Engagement } from './Engagement.ts';
import { validate, type ValidateOptions } from './Invariants.ts';
import { KeiretsuInput, type KeySpace, type KeySpaceOf } from './KeiretsuInput.ts';
import type { KeySpaceOf as KeySpaceOfInput } from './KeiretsuInput.ts';
import type { LegalEntity } from './LegalEntity.ts';
import { toModel, type KeiretsuModel } from './Model.ts';
import { activeEdges, type OwnershipEdge } from './Ownership.ts';
import type { Person } from './Person.ts';
import { valueOn } from './Timeline.ts';
import type { Leave } from './WorkCalendar.ts';

/** Re-exported so adopters import config types from `Keiretsu`. @since 0.1.0 @category models */
export type { KeiretsuInput, KeySpace, KeySpaceOf } from './KeiretsuInput.ts';

/**
 * Branded counterparty id.
 *
 * @since 0.1.0
 * @category models
 */
export type CounterpartyId = typeof CounterpartyIdSchema.Type;

/**
 * The config failed structural decode or an `error` invariant. `issues` lists every finding.
 *
 * @since 0.1.0
 * @category errors
 */
export class KeiretsuConfigError extends Schema.TaggedError<KeiretsuConfigError>()('KeiretsuConfigError', {
  issues: Schema.Array(ValidationIssue),
}) {}

/**
 * A money literal is malformed or has more fraction digits than the currency allows.
 *
 * @since 0.1.0
 * @category errors
 */
export class InvalidAmount extends Schema.TaggedError<InvalidAmount>()('InvalidAmount', {
  amount: Schema.String,
  currency: Schema.String,
  reason: Schema.String,
}) {}

/**
 * Edge query options. Unverified edges are excluded unless asked for.
 *
 * @since 0.1.0
 * @category models
 */
export interface EdgeQuery {
  readonly date: string;
  readonly includeUnverified?: boolean | undefined;
}

/**
 * A decoded group bound to its key space `K`. Methods reject undeclared keys at compile time.
 *
 * @since 0.1.0
 * @category models
 */
export interface Keiretsu<K extends KeySpace = KeySpace> {
  readonly tenant: string;
  readonly model: KeiretsuModel;
  /** Non-blocking findings (`hold`, `warning`) from validation. */
  readonly issues: ReadonlyArray<ValidationIssue>;
  readonly keys: { readonly [S in keyof KeySpace]: ReadonlyArray<K[S]> };
  /** Narrowed literal schemas for adopter policy (not for wire decoding). */
  readonly schemas: { readonly [S in keyof KeySpace]: Schema.Codec<K[S]> };
  /** Money from a decimal literal; exact (throws {@link InvalidAmount} rather than rounding). */
  money(amount: `${number}`, currency: K['currency']): Money;
  entity(key: K['entity']): LegalEntity;
  counterparty(key: K['counterparty']): Counterparty;
  person(key: K['person']): Person;
  idOf(key: K['entity']): EntityId;
  idOf(key: K['counterparty']): CounterpartyId;
  idOf(key: K['person']): PersonId;
  keyOf(id: EntityId): K['entity'] | undefined;
  keyOf(id: CounterpartyId): K['counterparty'] | undefined;
  keyOf(id: PersonId): K['person'] | undefined;
  /** Runtime guard for a declared key. */
  is<S extends keyof KeySpace>(kind: S, value: string): value is K[S];
  /** Adopter policy: a `hold` issue for each undeclared value. */
  screen(subject: string, values: { readonly [S in keyof KeySpace]?: string | undefined }): ReadonlyArray<ValidationIssue>;
  activeEntities(date: string): ReadonlyArray<K['entity']>;
  functionalCurrency(key: K['entity'], date: string): K['currency'] | undefined;
  ownersOf(key: K['entity'], query: EdgeQuery): ReadonlyArray<OwnershipEdge>;
  controllersOf(key: K['entity'], query: EdgeQuery): ReadonlyArray<ControlEdge>;
  engagementsOf(person: K['person'], date: string): ReadonlyArray<Engagement>;
  availableMinutes(options: { readonly person: K['person']; readonly from: IsoDate; readonly to: IsoDate; readonly leave?: ReadonlyArray<Leave> | undefined }): AvailabilityResult;
}

const AMOUNT_PATTERN = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/;

const toMinor = (amount: string, currency: string): Money => {
  const match = AMOUNT_PATTERN.exec(amount);
  const digits = iso4217.minorUnits(currency);
  if (match === null || digits === undefined) {
    throw new InvalidAmount({ amount, currency, reason: match === null ? 'not a plain decimal' : 'unknown currency' });
  }
  const [, sign = '', whole = '0', fraction = ''] = match;
  if (fraction.length > digits) throw new InvalidAmount({ amount, currency, reason: `${currency} has ${digits} minor digits` });
  const units = BigInt(`${whole}${fraction.padEnd(digits, '0')}`);
  // SAFETY: `currency` is a declared currency, validated against ISO 4217 when the group was decoded.
  return makeMoney(sign === '-' ? -units : units, currency as Money['currency']);
};

const found = <A extends { readonly key: string }>(records: ReadonlyArray<A>, key: string, kind: string): A => {
  const record = records.find((candidate) => candidate.key === key);
  if (record === undefined) throw new RangeError(`${kind} ${key} is not declared`);
  return record;
};

const keyLists = (model: KeiretsuModel): { readonly [S in keyof KeySpace]: ReadonlyArray<string> } => ({
  entity: model.entities.map((record) => record.key),
  counterparty: model.counterparties.map((record) => record.key),
  person: model.people.map((record) => record.key),
  system: model.systems.map((record) => record.key),
  currency: [...new Set([...model.entities.flatMap((entity) => [...entity.functionalCurrency.map((span) => span.value), ...(entity.reportingCurrency === undefined ? [] : [entity.reportingCurrency])]), ...model.currencies])],
  country: [...new Set([...model.entities.map((entity) => entity.jurisdiction.country), ...model.counterparties.map((party) => party.jurisdiction.country), ...model.countries])],
});

const KINDS: ReadonlyArray<keyof KeySpace> = ['entity', 'counterparty', 'person', 'system', 'currency', 'country'];

const facade = <K extends KeySpace>(model: KeiretsuModel, issues: ReadonlyArray<ValidationIssue>): Keiretsu<K> => {
  const lists = keyLists(model);
  const sets: Readonly<Record<keyof KeySpace, ReadonlySet<string>>> = {
    entity: new Set(lists.entity),
    counterparty: new Set(lists.counterparty),
    person: new Set(lists.person),
    system: new Set(lists.system),
    currency: new Set(lists.currency),
    country: new Set(lists.country),
  };
  const ids = new Map<string, string>([...model.entities, ...model.counterparties, ...model.people].map((record) => [record.id.toLowerCase(), record.key]));
  const idByKey = new Map<string, string>([...model.entities, ...model.counterparties, ...model.people].map((record) => [record.key, record.id]));
  const keiretsu = {
    tenant: model.tenant,
    model,
    issues,
    keys: lists,
    schemas: Object.fromEntries(KINDS.map((kind) => [kind, Schema.Literals(lists[kind])])),
    money: (amount: string, currency: string) => {
      if (!sets.currency.has(currency)) throw new InvalidAmount({ amount, currency, reason: `${currency} is not declared by ${model.tenant}` });
      return toMinor(amount, currency);
    },
    entity: (key: string) => found(model.entities, key, 'entity'),
    counterparty: (key: string) => found(model.counterparties, key, 'counterparty'),
    person: (key: string) => found(model.people, key, 'person'),
    idOf: (key: string) => idByKey.get(key),
    keyOf: (id: string) => ids.get(id.toLowerCase()),
    is: (kind: keyof KeySpace, value: string) => sets[kind].has(value),
    screen: (subject: string, values: { readonly [S in keyof KeySpace]?: string | undefined }) =>
      KINDS.flatMap((kind) => {
        const value = values[kind];
        return value === undefined || sets[kind].has(value) ? [] : [issue(`policy.undeclared-${kind}`, 'hold', subject, `${kind} ${value} is not declared by ${model.tenant}`)];
      }),
    activeEntities: (date: string) => model.entities.filter((entity) => valueOn(entity.lifecycle, date) === 'active').map((entity) => entity.key),
    functionalCurrency: (key: string, date: string) => valueOn(found(model.entities, key, 'entity').functionalCurrency, date),
    ownersOf: (key: string, query: EdgeQuery) => activeEdges(model.ownership.filter((edge) => edge.owned === key), query),
    controllersOf: (key: string, query: EdgeQuery) => activeEdges(model.control.filter((edge) => edge.controlled === key), query),
    engagementsOf: (person: string, date: string) => model.engagements.filter((engagement) => engagement.person === person && engagement.validFrom <= date && (engagement.validTo === undefined || date < engagement.validTo)),
    availableMinutes: (options: { readonly person: string; readonly from: IsoDate; readonly to: IsoDate; readonly leave?: ReadonlyArray<Leave> | undefined }) =>
      availableMinutes({ model, ...options }),
  };
  // SAFETY: every key list, set and lookup above is built from the decoded model, whose keys are exactly
  // the literal keys `K` was derived from; overloaded/predicate signatures share one runtime implementation.
  return keiretsu as unknown as Keiretsu<K>;
};

type BuildResult = { readonly ok: true; readonly value: Keiretsu } | { readonly ok: false; readonly error: KeiretsuConfigError };

const schemaIssues = (failure: Schema.SchemaError): ReadonlyArray<ValidationIssue> =>
  SchemaIssue.makeFormatterStandardSchemaV1()(failure.issue).issues.map((entry) =>
    issue('config.schema', 'error', (entry.path ?? []).map((segment) => String(typeof segment === 'object' ? segment.key : segment)).join('.') || '$', entry.message),
  );

const build = (input: unknown, options: ValidateOptions): BuildResult => {
  const decoded = Schema.decodeUnknownResult(KeiretsuInput)(input, { errors: 'all' });
  if (Result.isFailure(decoded)) return { ok: false, error: new KeiretsuConfigError({ issues: schemaIssues(decoded.failure) }) };
  const model = toModel(decoded.success);
  const issues = validate(model, options);
  if (issues.some((entry) => entry.severity === 'error')) return { ok: false, error: new KeiretsuConfigError({ issues }) };
  return { ok: true, value: facade(model, issues) };
};

/**
 * Decode and validate a config at runtime. With a literal config the result is narrowed to its key space;
 * with `unknown` input (multi-tenant hosts) it is the wide `Keiretsu`.
 *
 * @since 0.1.0
 * @category decoding
 */
export function decodeKeiretsu<const C extends KeiretsuInput>(input: C, options?: ValidateOptions): Effect.Effect<Keiretsu<KeySpaceOf<C>>, KeiretsuConfigError>;
export function decodeKeiretsu(input: unknown, options?: ValidateOptions): Effect.Effect<Keiretsu, KeiretsuConfigError>;
export function decodeKeiretsu(input: unknown, options: ValidateOptions = {}): Effect.Effect<Keiretsu, KeiretsuConfigError> {
  return Effect.suspend(() => {
    const result = build(input, options);
    return result.ok ? Effect.succeed(result.value) : Effect.fail(result.error);
  });
}

/**
 * Build the typed facade synchronously, throwing {@link KeiretsuConfigError} on an invalid config.
 *
 * @since 0.1.0
 * @category constructors
 */
export const make = <const C extends KeiretsuInput>(input: C, options: ValidateOptions = {}): Keiretsu<KeySpaceOf<C>> => {
  const result = build(input, options);
  if (!result.ok) throw result.error;
  // SAFETY: `build` derived the facade from this very config, whose literal keys define KeySpaceOf<C>.
  return result.value as unknown as Keiretsu<KeySpaceOf<C>>;
};

/**
 * The one statically declared service tag, keyed on the wide `Keiretsu`. Narrow with {@link get}.
 *
 * @since 0.1.0
 * @category services
 */
export class KeiretsuService extends Context.Service<KeiretsuService, Keiretsu>()('@snyder-tech/keiretsu/entity/KeiretsuService') {}

/**
 * A layer that decodes the config (all invariants) and provides {@link KeiretsuService}.
 *
 * @since 0.1.0
 * @category layers
 */
export const layer = (input: unknown, options: ValidateOptions = {}): Layer.Layer<KeiretsuService, KeiretsuConfigError> =>
  Layer.effect(KeiretsuService, decodeKeiretsu(input, options));

/**
 * Typed accessor: the provided group narrowed to `K`. Safe when the layer was built from the config
 * `K` was derived from (`get<KeySpaceOf<typeof group>>()` with `layer(group)`).
 *
 * @since 0.1.0
 * @category accessors
 */
export const get = <K extends KeySpace>(): Effect.Effect<Keiretsu<K>, never, KeiretsuService> =>
  Effect.gen(function* () {
    const keiretsu = yield* KeiretsuService;
    // SAFETY: the service was built by `layer(config)` from the config `K` describes; keys are checked at decode.
    return keiretsu as unknown as Keiretsu<K>;
  });

/**
 * Namespace-style entry point: `Keiretsu.make`, `Keiretsu.decode`, `Keiretsu.layer`, `Keiretsu.get`.
 *
 * @since 0.1.0
 * @category constructors
 */
export const Keiretsu = { make, decode: decodeKeiretsu, layer, get, Service: KeiretsuService } as const;

/**
 * Type-level members of {@link Keiretsu}.
 *
 * @since 0.1.0
 * @category models
 */
export declare namespace Keiretsu {
  /** Literal key space of a config. */
  export type KeySpaceOf<C extends KeiretsuInput> = KeySpaceOfInput<C>;
  /** The authored config type. */
  export type Input = KeiretsuInput;
}
