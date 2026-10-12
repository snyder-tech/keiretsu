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
import { ValidationIssue } from '../core/Issue.ts';
import { type Money } from '../core/Money.ts';
import type { IsoDate } from '../core/Temporal.ts';
import { Context, Effect, Layer, Schema } from 'effect';
import { type AvailabilityResult } from './Availability.ts';
import type { ControlEdge } from './Control.ts';
import type { Counterparty } from './Counterparty.ts';
import type { Engagement } from './Engagement.ts';
import { type ValidateOptions } from './Invariants.ts';
import { KeiretsuInput, type KeySpace, type KeySpaceOf } from './KeiretsuInput.ts';
import type { KeySpaceOf as KeySpaceOfInput } from './KeiretsuInput.ts';
import type { LegalEntity } from './LegalEntity.ts';
import { type KeiretsuModel } from './Model.ts';
import { type OwnershipEdge } from './Ownership.ts';
import type { Person } from './Person.ts';
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
declare const KeiretsuConfigError_base: Schema.Class<KeiretsuConfigError, Schema.TaggedStruct<"KeiretsuConfigError", {
    readonly issues: Schema.$Array<Schema.Struct<{
        readonly code: Schema.String;
        readonly severity: Schema.Literals<readonly ["error", "hold", "warning"]>;
        readonly subject: Schema.NonEmptyString;
        readonly message: Schema.NonEmptyString;
        readonly path: Schema.optional<Schema.String>;
    }>>;
}>, import("effect/Cause").YieldableError>;
/**
 * The config failed structural decode or an `error` invariant. `issues` lists every finding.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class KeiretsuConfigError extends KeiretsuConfigError_base {
}
declare const InvalidAmount_base: Schema.Class<InvalidAmount, Schema.TaggedStruct<"InvalidAmount", {
    readonly amount: Schema.String;
    readonly currency: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A money literal is malformed or has more fraction digits than the currency allows.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class InvalidAmount extends InvalidAmount_base {
}
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
    readonly keys: {
        readonly [S in keyof KeySpace]: ReadonlyArray<K[S]>;
    };
    /** Narrowed literal schemas for adopter policy (not for wire decoding). */
    readonly schemas: {
        readonly [S in keyof KeySpace]: Schema.Codec<K[S]>;
    };
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
    screen(subject: string, values: {
        readonly [S in keyof KeySpace]?: string | undefined;
    }): ReadonlyArray<ValidationIssue>;
    activeEntities(date: string): ReadonlyArray<K['entity']>;
    functionalCurrency(key: K['entity'], date: string): K['currency'] | undefined;
    ownersOf(key: K['entity'], query: EdgeQuery): ReadonlyArray<OwnershipEdge>;
    controllersOf(key: K['entity'], query: EdgeQuery): ReadonlyArray<ControlEdge>;
    engagementsOf(person: K['person'], date: string): ReadonlyArray<Engagement>;
    availableMinutes(options: {
        readonly person: K['person'];
        readonly from: IsoDate;
        readonly to: IsoDate;
        readonly leave?: ReadonlyArray<Leave> | undefined;
    }): AvailabilityResult;
}
/**
 * Decode and validate a config at runtime. With a literal config the result is narrowed to its key space;
 * with `unknown` input (multi-tenant hosts) it is the wide `Keiretsu`.
 *
 * @since 0.1.0
 * @category decoding
 */
export declare function decodeKeiretsu<const C extends KeiretsuInput>(input: C, options?: ValidateOptions): Effect.Effect<Keiretsu<KeySpaceOf<C>>, KeiretsuConfigError>;
export declare function decodeKeiretsu(input: unknown, options?: ValidateOptions): Effect.Effect<Keiretsu, KeiretsuConfigError>;
/**
 * Build the typed facade synchronously, throwing {@link KeiretsuConfigError} on an invalid config.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const make: <const C extends KeiretsuInput>(input: C, options?: ValidateOptions) => Keiretsu<KeySpaceOf<C>>;
declare const KeiretsuService_base: Context.ServiceClass<KeiretsuService, "@snyder-tech/keiretsu/entity/KeiretsuService", Keiretsu<KeySpace>>;
/**
 * The one statically declared service tag, keyed on the wide `Keiretsu`. Narrow with {@link get}.
 *
 * @since 0.1.0
 * @category services
 */
export declare class KeiretsuService extends KeiretsuService_base {
}
/**
 * A layer that decodes the config (all invariants) and provides {@link KeiretsuService}.
 *
 * @since 0.1.0
 * @category layers
 */
export declare const layer: (input: unknown, options?: ValidateOptions) => Layer.Layer<KeiretsuService, KeiretsuConfigError>;
/**
 * Typed accessor: the provided group narrowed to `K`. Safe when the layer was built from the config
 * `K` was derived from (`get<KeySpaceOf<typeof group>>()` with `layer(group)`).
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const get: <K extends KeySpace>() => Effect.Effect<Keiretsu<K>, never, KeiretsuService>;
/**
 * Namespace-style entry point: `Keiretsu.make`, `Keiretsu.decode`, `Keiretsu.layer`, `Keiretsu.get`.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const Keiretsu: {
    readonly make: <const C extends KeiretsuInput>(input: C, options?: ValidateOptions) => Keiretsu<KeySpaceOf<C>>;
    readonly decode: typeof decodeKeiretsu;
    readonly layer: (input: unknown, options?: ValidateOptions) => Layer.Layer<KeiretsuService, KeiretsuConfigError>;
    readonly get: <K extends KeySpace>() => Effect.Effect<Keiretsu<K>, never, KeiretsuService>;
    readonly Service: typeof KeiretsuService;
};
/**
 * Type-level members of {@link Keiretsu}.
 *
 * @since 0.1.0
 * @category models
 */
export declare namespace Keiretsu {
    /** Literal key space of a config. */
    type KeySpaceOf<C extends KeiretsuInput> = KeySpaceOfInput<C>;
    /** The authored config type. */
    type Input = KeiretsuInput;
}
//# sourceMappingURL=Keiretsu.d.ts.map