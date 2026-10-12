/**
 * The single, digested cost-base definition shared by costing and cost-plus pricing.
 *
 * A definition lists every cost component and how it is treated: marked up,
 * passed through at cost (OECD TPG 2.99–2.100, 7.34) or excluded. Costing
 * measures a period against a definition and cites its digest; every
 * cost-plus charge and true-up must cite the same digest. A component the
 * definition does not mention is held, never silently excluded.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { invalidJson, digestValue, Sha256 } from "../core/CanonicalJson.js";
import * as Decimal from "../core/Decimal.js";
import { revisionChain, RevisionFields, validInterval } from "../core/Envelope.js";
import { RuleId } from "../core/Ids.js";
import { ValidationIssue, issue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { IsoDate, Period } from "../core/Temporal.js";
import { extensible } from "./internal/Codes.js";
/**
 * Cost components. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostComponentKind = extensible(['pay', 'burden', 'benefits', 'overhead', 'stock-compensation', 'idle-time', 'contractor', 'cloud-ai', 'tooling', 'third-party-disbursement']);
/**
 * How a component enters the base.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ComponentTreatment = Schema.Literals(['markup', 'pass-through', 'exclude']);
/**
 * A versioned cost-base definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseDefinition = Schema.Struct({
    id: RuleId,
    ...RevisionFields,
    name: Schema.NonEmptyString,
    components: Schema.NonEmptyArray(Schema.Struct({ kind: CostComponentKind, treatment: ComponentTreatment })),
    /** Which FX basis converts foreign-currency costs into the base currency (cites an FX policy). */
    fxBasis: Schema.optional(Schema.NonEmptyString),
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
}).check(revisionChain, validInterval, Schema.makeFilter((definition) => new Set(definition.components.map((component) => component.kind)).size === definition.components.length ? undefined : 'cost-base.duplicate-component: each component is listed once'));
/**
 * SHA-256 over the definition's canonical JSON.
 *
 * @since 0.1.0
 * @category digests
 */
export const definitionDigest = (definition) => Schema.encodeEffect(CostBaseDefinition)(definition).pipe(Effect.mapError((error) => invalidJson('$', String(error))), Effect.flatMap(digestValue));
/**
 * A component amount to be measured against a definition.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ComponentAmount = Schema.Struct({ kind: CostComponentKind, amount: Money.Money });
/**
 * A period's cost base measured against one definition.
 *
 * `status: held` means at least one component could not be placed; amounts
 * then cover only the placed components and must not be billed.
 *
 * @since 0.1.0
 * @category schemas
 */
export const CostBaseMeasurement = Schema.Struct({
    definitionId: RuleId,
    definitionDigest: Sha256,
    period: Period,
    basis: Schema.Literals(['actual', 'standard']),
    markupBase: Money.Money,
    passThrough: Money.Money,
    excluded: Money.Money,
    status: Schema.Literals(['complete', 'held']),
    issues: Schema.Array(ValidationIssue),
});
/**
 * Measure component amounts against a definition.
 *
 * Codes: `cost-base.unknown-component` (hold), `cost-base.currency` (error).
 *
 * @since 0.1.0
 * @category measurement
 */
export const measure = (options) => Effect.map(definitionDigest(options.definition), (digest) => {
    const issues = [];
    const totals = { markup: 0n, 'pass-through': 0n, exclude: 0n };
    for (const line of options.amounts) {
        const treatment = options.definition.components.find((component) => component.kind === line.kind)?.treatment;
        if (line.amount.currency !== options.currency) {
            issues.push(issue('cost-base.currency', 'error', line.kind, `amount in ${line.amount.currency}, base in ${options.currency}`));
        }
        else if (treatment === undefined) {
            issues.push(issue('cost-base.unknown-component', 'hold', line.kind, 'component is not in the cost-base definition; held, not excluded'));
        }
        else {
            totals[treatment] += Money.units(line.amount);
        }
    }
    return {
        definitionId: options.definition.id,
        definitionDigest: digest,
        period: options.period,
        basis: options.basis,
        markupBase: Money.make(totals.markup, options.currency),
        passThrough: Money.make(totals['pass-through'], options.currency),
        excluded: Money.make(totals.exclude, options.currency),
        status: issues.length === 0 ? 'complete' : 'held',
        issues,
    };
});
/**
 * Cost-plus amount: `markupBase × (1 + markup) + passThrough`, rounded once.
 * A candidate for pricing; the markup's arm's-length support is a separate test.
 *
 * @since 0.1.0
 * @category math
 */
export const costPlusAmount = (options) => Effect.gen(function* () {
    const base = yield* Money.toScaledAmount(options.measurement.markupBase, options.table);
    const pass = yield* Money.toScaledAmount(options.measurement.passThrough, options.table);
    const factor = Decimal.add(Decimal.fromInteger(1), Decimal.toScaled(options.markup));
    return yield* Money.fromScaledAmount({
        amount: Decimal.add(Decimal.multiply(base, factor), pass),
        currency: options.measurement.markupBase.currency,
        table: options.table,
        rounding: options.rounding,
    });
});
//# sourceMappingURL=CostBaseDefinition.js.map