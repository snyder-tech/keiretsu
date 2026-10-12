import { issue, ValidationIssue } from "../core/Issue.js";
import { iso4217 } from "../core/Currency.js";
import { make as makeMoney } from "../core/Money.js";
import { Context, Effect, Layer, Result, Schema, SchemaIssue } from 'effect';
import { availableMinutes } from "./Availability.js";
import { validate } from "./Invariants.js";
import { KeiretsuInput } from "./KeiretsuInput.js";
import { toModel } from "./Model.js";
import { activeEdges } from "./Ownership.js";
import { valueOn } from "./Timeline.js";
/**
 * The config failed structural decode or an `error` invariant. `issues` lists every finding.
 *
 * @since 0.1.0
 * @category errors
 */
export class KeiretsuConfigError extends Schema.TaggedError()('KeiretsuConfigError', {
    issues: Schema.Array(ValidationIssue),
}) {
}
/**
 * A money literal is malformed or has more fraction digits than the currency allows.
 *
 * @since 0.1.0
 * @category errors
 */
export class InvalidAmount extends Schema.TaggedError()('InvalidAmount', {
    amount: Schema.String,
    currency: Schema.String,
    reason: Schema.String,
}) {
}
const AMOUNT_PATTERN = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/;
const toMinor = (amount, currency) => {
    const match = AMOUNT_PATTERN.exec(amount);
    const digits = iso4217.minorUnits(currency);
    if (match === null || digits === undefined) {
        throw new InvalidAmount({ amount, currency, reason: match === null ? 'not a plain decimal' : 'unknown currency' });
    }
    const [, sign = '', whole = '0', fraction = ''] = match;
    if (fraction.length > digits)
        throw new InvalidAmount({ amount, currency, reason: `${currency} has ${digits} minor digits` });
    const units = BigInt(`${whole}${fraction.padEnd(digits, '0')}`);
    // SAFETY: `currency` is a declared currency, validated against ISO 4217 when the group was decoded.
    return makeMoney(sign === '-' ? -units : units, currency);
};
const found = (records, key, kind) => {
    const record = records.find((candidate) => candidate.key === key);
    if (record === undefined)
        throw new RangeError(`${kind} ${key} is not declared`);
    return record;
};
const keyLists = (model) => ({
    entity: model.entities.map((record) => record.key),
    counterparty: model.counterparties.map((record) => record.key),
    person: model.people.map((record) => record.key),
    system: model.systems.map((record) => record.key),
    currency: [...new Set([...model.entities.flatMap((entity) => [...entity.functionalCurrency.map((span) => span.value), ...(entity.reportingCurrency === undefined ? [] : [entity.reportingCurrency])]), ...model.currencies])],
    country: [...new Set([...model.entities.map((entity) => entity.jurisdiction.country), ...model.counterparties.map((party) => party.jurisdiction.country), ...model.countries])],
});
const KINDS = ['entity', 'counterparty', 'person', 'system', 'currency', 'country'];
const facade = (model, issues) => {
    const lists = keyLists(model);
    const sets = {
        entity: new Set(lists.entity),
        counterparty: new Set(lists.counterparty),
        person: new Set(lists.person),
        system: new Set(lists.system),
        currency: new Set(lists.currency),
        country: new Set(lists.country),
    };
    const ids = new Map([...model.entities, ...model.counterparties, ...model.people].map((record) => [record.id.toLowerCase(), record.key]));
    const idByKey = new Map([...model.entities, ...model.counterparties, ...model.people].map((record) => [record.key, record.id]));
    const keiretsu = {
        tenant: model.tenant,
        model,
        issues,
        keys: lists,
        schemas: Object.fromEntries(KINDS.map((kind) => [kind, Schema.Literals(lists[kind])])),
        money: (amount, currency) => {
            if (!sets.currency.has(currency))
                throw new InvalidAmount({ amount, currency, reason: `${currency} is not declared by ${model.tenant}` });
            return toMinor(amount, currency);
        },
        entity: (key) => found(model.entities, key, 'entity'),
        counterparty: (key) => found(model.counterparties, key, 'counterparty'),
        person: (key) => found(model.people, key, 'person'),
        idOf: (key) => idByKey.get(key),
        keyOf: (id) => ids.get(id.toLowerCase()),
        is: (kind, value) => sets[kind].has(value),
        screen: (subject, values) => KINDS.flatMap((kind) => {
            const value = values[kind];
            return value === undefined || sets[kind].has(value) ? [] : [issue(`policy.undeclared-${kind}`, 'hold', subject, `${kind} ${value} is not declared by ${model.tenant}`)];
        }),
        activeEntities: (date) => model.entities.filter((entity) => valueOn(entity.lifecycle, date) === 'active').map((entity) => entity.key),
        functionalCurrency: (key, date) => valueOn(found(model.entities, key, 'entity').functionalCurrency, date),
        ownersOf: (key, query) => activeEdges(model.ownership.filter((edge) => edge.owned === key), query),
        controllersOf: (key, query) => activeEdges(model.control.filter((edge) => edge.controlled === key), query),
        engagementsOf: (person, date) => model.engagements.filter((engagement) => engagement.person === person && engagement.validFrom <= date && (engagement.validTo === undefined || date < engagement.validTo)),
        availableMinutes: (options) => availableMinutes({ model, ...options }),
    };
    // SAFETY: every key list, set and lookup above is built from the decoded model, whose keys are exactly
    // the literal keys `K` was derived from; overloaded/predicate signatures share one runtime implementation.
    return keiretsu;
};
const schemaIssues = (failure) => SchemaIssue.makeFormatterStandardSchemaV1()(failure.issue).issues.map((entry) => issue('config.schema', 'error', (entry.path ?? []).map((segment) => String(typeof segment === 'object' ? segment.key : segment)).join('.') || '$', entry.message));
const build = (input, options) => {
    const decoded = Schema.decodeUnknownResult(KeiretsuInput)(input, { errors: 'all' });
    if (Result.isFailure(decoded))
        return { ok: false, error: new KeiretsuConfigError({ issues: schemaIssues(decoded.failure) }) };
    const model = toModel(decoded.success);
    const issues = validate(model, options);
    if (issues.some((entry) => entry.severity === 'error'))
        return { ok: false, error: new KeiretsuConfigError({ issues }) };
    return { ok: true, value: facade(model, issues) };
};
export function decodeKeiretsu(input, options = {}) {
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
export const make = (input, options = {}) => {
    const result = build(input, options);
    if (!result.ok)
        throw result.error;
    // SAFETY: `build` derived the facade from this very config, whose literal keys define KeySpaceOf<C>.
    return result.value;
};
/**
 * The one statically declared service tag, keyed on the wide `Keiretsu`. Narrow with {@link get}.
 *
 * @since 0.1.0
 * @category services
 */
export class KeiretsuService extends Context.Service()('@snyder-tech/keiretsu/entity/KeiretsuService') {
}
/**
 * A layer that decodes the config (all invariants) and provides {@link KeiretsuService}.
 *
 * @since 0.1.0
 * @category layers
 */
export const layer = (input, options = {}) => Layer.effect(KeiretsuService, decodeKeiretsu(input, options));
/**
 * Typed accessor: the provided group narrowed to `K`. Safe when the layer was built from the config
 * `K` was derived from (`get<KeySpaceOf<typeof group>>()` with `layer(group)`).
 *
 * @since 0.1.0
 * @category accessors
 */
export const get = () => Effect.gen(function* () {
    const keiretsu = yield* KeiretsuService;
    // SAFETY: the service was built by `layer(config)` from the config `K` describes; keys are checked at decode.
    return keiretsu;
});
/**
 * Namespace-style entry point: `Keiretsu.make`, `Keiretsu.decode`, `Keiretsu.layer`, `Keiretsu.get`.
 *
 * @since 0.1.0
 * @category constructors
 */
export const Keiretsu = { make, decode: decodeKeiretsu, layer, get, Service: KeiretsuService };
//# sourceMappingURL=Keiretsu.js.map