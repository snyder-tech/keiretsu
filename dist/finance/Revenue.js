/**
 * Minimal revenue recognition (ASC 606 / IFRS 15): performance obligations,
 * recognition entries, contract assets and liabilities, principal/agent.
 *
 * Revenue is recognised, not billed. Over-time obligations recognise the
 * cumulative share of the allocated price by an input or output measure
 * (cumulative catch-up, rounded once); point-in-time obligations recognise in
 * full at transfer of control. Invoices create receivables and contract
 * liabilities. Principal/agent is a human determination; an undetermined role
 * holds recognition. Transaction-price estimation, variable consideration and
 * SSP allocation are on the roadmap: the allocated price is an input here.
 *
 * @since 0.1.0
 * @module
 */
import { Effect, Schema } from 'effect';
import { Actor } from "../core/Actor.js";
import * as Decimal from "../core/Decimal.js";
import { EvidenceRef } from "../core/Envelope.js";
import { brand } from "../core/Id.js";
import { AgreementId, CounterpartyId, DerivationId, EntityId } from "../core/Ids.js";
import { issue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { IsoDate, periodOf } from "../core/Temporal.js";
import { makeEntry, role, Roles } from "./Journal.js";
/** @since 0.1.0 @category schemas */
export const PerformanceObligationId = brand('keiretsu/PerformanceObligationId');
/**
 * A performance obligation with its allocated transaction price.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PerformanceObligation = Schema.Struct({
    id: PerformanceObligationId,
    entityId: EntityId,
    agreementId: AgreementId,
    customer: CounterpartyId,
    description: Schema.NonEmptyString,
    allocatedPrice: Money.Money,
    pattern: Schema.TaggedUnion({
        'point-in-time': {},
        'over-time': { measure: Schema.Literals(['input', 'output']), unit: Schema.NonEmptyString },
    }),
    role: Schema.Literals(['principal', 'agent', 'undetermined']),
    roleDecidedBy: Schema.optional(Actor),
}).check(Schema.makeFilter((obligation) => obligation.role === 'undetermined' || obligation.roleDecidedBy?._tag === 'human' ? undefined : 'revenue.role-decided-by-human: principal/agent is a human determination'));
/**
 * A recognition entry: revenue recognised for an obligation on a date.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RecognitionEntry = Schema.Struct({
    derivationId: DerivationId,
    obligationId: PerformanceObligationId,
    date: IsoDate,
    amount: Money.Money,
    cumulative: Money.Money,
    progress: Schema.optional(Schema.Struct({ measured: Decimal.Decimal, expectedTotal: Decimal.Decimal })),
    evidence: Schema.Array(EvidenceRef),
});
/**
 * Recognise revenue to date for an obligation.
 *
 * Codes: `revenue.role-undetermined` (hold), `revenue.progress-invalid` (hold), `revenue.not-transferred` (hold).
 *
 * @since 0.1.0
 * @category recognition
 */
export const recognise = (options) => Effect.gen(function* () {
    const { obligation } = options;
    const held = (code, message) => ({ _tag: 'held', issue: issue(code, 'hold', obligation.id, message) });
    if (obligation.role === 'undetermined')
        return held('revenue.role-undetermined', 'principal/agent role undetermined');
    const price = yield* Money.toScaledAmount(obligation.allocatedPrice, options.money.table);
    let cumulativeScaled;
    let progress;
    if ('transferred' in options.progress) {
        if (obligation.pattern._tag !== 'point-in-time')
            return held('revenue.progress-invalid', 'over-time obligations need a progress measure');
        if (!options.progress.transferred)
            return held('revenue.not-transferred', 'control has not transferred');
        cumulativeScaled = price;
    }
    else {
        if (obligation.pattern._tag !== 'over-time')
            return held('revenue.progress-invalid', 'point-in-time obligations recognise at transfer of control');
        const measured = Decimal.toScaled(options.progress.measured);
        const total = Decimal.toScaled(options.progress.expectedTotal);
        if (total <= 0n || measured < 0n)
            return held('revenue.progress-invalid', 'progress needs a positive expected total and non-negative measure');
        const ratio = measured >= total ? Decimal.fromInteger(1) : Decimal.divideBy(measured, total);
        cumulativeScaled = Decimal.multiply(price, ratio);
        progress = { measured: options.progress.measured, expectedTotal: options.progress.expectedTotal };
    }
    const cumulative = yield* Money.fromScaledAmount({ amount: cumulativeScaled, currency: obligation.allocatedPrice.currency, table: options.money.table, rounding: options.money.rounding });
    const amount = Money.make(Money.units(cumulative) - Money.units(options.recognisedToDate), cumulative.currency);
    const entry = {
        derivationId: options.derivationId,
        obligationId: obligation.id,
        date: options.date,
        amount,
        cumulative,
        evidence: [...options.evidence],
        ...(progress === undefined ? {} : { progress }),
    };
    return { _tag: 'entry', entry };
});
/**
 * The revenue role for an obligation: gross revenue for a principal, net for an agent.
 *
 * @since 0.1.0
 * @category presentation
 */
export const revenueRole = (obligation) => {
    if (obligation.role === 'principal')
        return role(Roles.revenue);
    if (obligation.role === 'agent')
        return role(Roles.revenueAgentNet);
    return undefined;
};
/**
 * Contract position from cumulative invoicing and recognition (one contract, one currency).
 * Recognised beyond invoiced is a contract asset; invoiced beyond recognised is a contract liability.
 *
 * @since 0.1.0
 * @category presentation
 */
export const contractPosition = (options) => Effect.map(Money.subtract(options.recognisedToDate, options.invoicedToDate), (difference) => {
    const value = Money.units(difference);
    return {
        contractAsset: Money.make(value > 0n ? value : 0n, difference.currency),
        contractLiability: Money.make(value < 0n ? -value : 0n, difference.currency),
    };
});
/**
 * Journal for a recognition entry: debit contract liability (netted against invoicing), credit revenue.
 *
 * Invoice journals debit `trade-receivable` and credit `contract-liability`, so the
 * contract-liability balance is the net contract position.
 *
 * @since 0.1.0
 * @category journals
 */
export const recognitionJournal = (options) => {
    const revenue = revenueRole(options.obligation) ?? role(Roles.revenue);
    const value = Money.units(options.entry.amount);
    const amount = Money.make(value < 0n ? -value : value, options.entry.amount.currency);
    const forward = value >= 0n;
    return makeEntry({
        id: options.id,
        entityId: options.obligation.entityId,
        date: options.entry.date,
        period: periodOf(options.entry.date),
        memo: `Revenue recognition: ${options.obligation.description}`,
        lines: [
            { role: forward ? role(Roles.contractLiability) : revenue, side: 'debit', amount, dimensions: { counterpartyId: options.obligation.customer } },
            { role: forward ? revenue : role(Roles.contractLiability), side: 'credit', amount, dimensions: { counterpartyId: options.obligation.customer } },
        ],
        source: { kind: 'recognition-entry', derivationId: options.entry.derivationId, digest: options.entryDigest },
        recognitionRef: { derivationId: options.entry.derivationId, digest: options.entryDigest },
    });
};
//# sourceMappingURL=Revenue.js.map