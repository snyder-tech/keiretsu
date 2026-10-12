/**
 * Intercompany mirrors and eliminations.
 *
 * One intercompany fact projects to the issuer's receivable/income entry and
 * the recipient's payable/cost entry; both cite the fact's digest, so the two
 * books agree by construction. {@link eliminate} removes intercompany income
 * and cost in the presentation currency. Each side is translated from its own
 * functional amount; the difference is real FX and appears on an explicit
 * `fx-difference-elimination` line — it is never absorbed into another line.
 * Markup that the payer capitalised is unrealised profit: it is flagged as a
 * candidate, not booked.
 *
 * @since 0.1.0
 * @module
 */
import { Data, Effect, Schema } from 'effect';
import { FxSnapshot } from "../fx/FxSnapshot.js";
import { convertScaled, findSnapshot } from "../fx/Conversion.js";
import { invalidJson, digestValue, Sha256 } from "../core/CanonicalJson.js";
import { CurrencyCode } from "../core/Currency.js";
import * as Decimal from "../core/Decimal.js";
import { brand } from "../core/Id.js";
import { ChargeId, DerivationId, DocumentId, EntityId } from "../core/Ids.js";
import { issue } from "../core/Issue.js";
import * as Money from "../core/Money.js";
import { IsoDate, periodOf } from "../core/Temporal.js";
import { makeEntry, role, Roles, signedLine } from "./Journal.js";
/** @since 0.1.0 @category schemas */
export const IntercompanyFactId = brand('keiretsu/IntercompanyFactId');
/**
 * A single intercompany fact: what the issuer charged the recipient, in the
 * transaction currency and in each party's functional currency as booked.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IntercompanyFact = Schema.Struct({
    id: IntercompanyFactId,
    issuer: EntityId,
    recipient: EntityId,
    date: IsoDate,
    flow: Schema.Literals(['services', 'royalty']),
    amount: Money.Money,
    issuerFunctional: Money.Money,
    recipientFunctional: Money.Money,
    chargeIds: Schema.Array(ChargeId),
    documentId: Schema.optional(DocumentId),
    /** Revenue-recognition derivation supporting the issuer's income. */
    recognitionRef: Schema.Struct({ derivationId: DerivationId, digest: Schema.optional(Sha256) }),
    /** Portion the recipient capitalised (in its functional currency) and the markup it carries. */
    payerCapitalisation: Schema.optional(Schema.Struct({ capitalised: Money.Money, markup: Decimal.Decimal })),
}).check(Schema.makeFilter((fact) => (fact.issuer === fact.recipient ? 'ic.same-party: issuer and recipient differ' : undefined)), Schema.makeFilter((fact) => Money.units(fact.amount) > 0n && Money.units(fact.issuerFunctional) > 0n && Money.units(fact.recipientFunctional) > 0n ? undefined : 'ic.amount-positive: amounts are positive'), Schema.makeFilter((fact) => {
    const capitalised = fact.payerCapitalisation?.capitalised;
    if (capitalised === undefined)
        return undefined;
    return capitalised.currency === fact.recipientFunctional.currency && Money.units(capitalised) >= 0n && Money.units(capitalised) <= Money.units(fact.recipientFunctional)
        ? undefined
        : 'ic.capitalised-portion: capitalised portion lies within the recipient amount, in its currency';
}));
/**
 * Project a fact into both books.
 *
 * @since 0.1.0
 * @category mirrors
 */
export const mirror = (options) => Effect.gen(function* () {
    const { fact } = options;
    const factDigest = yield* Schema.encodeEffect(IntercompanyFact)(fact).pipe(Effect.mapError((error) => invalidJson('$', String(error))), Effect.flatMap(digestValue));
    const source = { kind: 'intercompany-mirror', derivationId: options.derivationId, digest: factDigest };
    const period = periodOf(fact.date);
    const issuerEntry = yield* makeEntry({
        id: options.ids.issuerEntryId,
        entityId: fact.issuer,
        date: fact.date,
        period,
        memo: `Intercompany ${fact.flow} to recipient`,
        lines: [
            { role: role(Roles.icReceivable), side: 'debit', amount: fact.issuerFunctional, transactionAmount: fact.amount, dimensions: { counterpartyEntityId: fact.recipient } },
            { role: role(Roles.revenueIntercompany), side: 'credit', amount: fact.issuerFunctional, transactionAmount: fact.amount, dimensions: { counterpartyEntityId: fact.recipient } },
        ],
        source,
        recognitionRef: fact.recognitionRef,
    });
    const capitalised = fact.payerCapitalisation?.capitalised ?? Money.zero(fact.recipientFunctional.currency);
    const expensed = Money.make(Money.units(fact.recipientFunctional) - Money.units(capitalised), fact.recipientFunctional.currency);
    const dimensions = { counterpartyEntityId: fact.issuer };
    const recipientEntry = yield* makeEntry({
        id: options.ids.recipientEntryId,
        entityId: fact.recipient,
        date: fact.date,
        period,
        memo: `Intercompany ${fact.flow} from issuer`,
        lines: [
            ...signedLine(role(Roles.icServiceCost), expensed, { dimensions }),
            ...signedLine(role(Roles.icCapitalisedCost), capitalised, { dimensions }),
            { role: role(Roles.icPayable), side: 'credit', amount: fact.recipientFunctional, transactionAmount: fact.amount, dimensions },
        ],
        source,
    });
    return { fact, factDigest, issuerEntry, recipientEntry };
});
/**
 * Presentation-currency rates from an FX snapshot (supplied by the FX package):
 * presentation units per one unit of `from`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PresentationFx = Schema.Struct({
    presentationCurrency: CurrencyCode,
    snapshots: Schema.Array(FxSnapshot),
});
/**
 * Translation needed a rate the snapshot does not have.
 *
 * @since 0.1.0
 * @category errors
 */
export class RateMissing extends Data.TaggedError('RateMissing') {
}
const translate = (amount, fx, money) => Effect.gen(function* () {
    if (amount.currency === fx.presentationCurrency)
        return amount;
    const found = findSnapshot(fx.snapshots, { from: amount.currency, to: fx.presentationCurrency });
    if (found === undefined)
        return yield* Effect.fail(new RateMissing({ from: amount.currency }));
    const scaled = yield* Money.toScaledAmount(amount, money.table);
    return yield* convertScaled({ amount: scaled, currency: amount.currency, snapshot: found.snapshot, direction: found.direction, table: money.table, rounding: money.rounding }).pipe(Effect.catchTag('CurrencyMismatch', () => Effect.fail(new RateMissing({ from: amount.currency }))));
});
const unrealisedCandidate = (fact, money) => Effect.gen(function* () {
    const capitalisation = fact.payerCapitalisation;
    if (capitalisation === undefined || Money.units(capitalisation.capitalised) === 0n)
        return undefined;
    const capitalised = yield* Money.toScaledAmount(capitalisation.capitalised, money.table);
    const markup = Decimal.toScaled(capitalisation.markup);
    const profit = Decimal.divideBy(Decimal.multiply(capitalised, markup), Decimal.add(Decimal.fromInteger(1), markup));
    return yield* Money.fromScaledAmount({ amount: profit, currency: capitalisation.capitalised.currency, table: money.table, rounding: money.rounding });
});
/**
 * Eliminate intercompany income against cost for a consolidation entity.
 *
 * Codes: `elimination.fx-missing` (hold; that fact is left uneliminated), `elimination.unrealised-profit` (hold),
 * `elimination.fx-difference` (warning, whenever the difference is non-zero).
 *
 * @since 0.1.0
 * @category eliminations
 */
export const eliminate = (options) => Effect.gen(function* () {
    const entries = [];
    const differences = [];
    const unrealisedProfit = [];
    const issues = [];
    const { consolidation, money, presentationFx } = options;
    for (const { fact, factDigest } of options.mirrors) {
        const capitalised = fact.payerCapitalisation?.capitalised ?? Money.zero(fact.recipientFunctional.currency);
        const expensed = Money.make(Money.units(fact.recipientFunctional) - Money.units(capitalised), capitalised.currency);
        const translated = yield* Effect.all({
            income: translate(fact.issuerFunctional, presentationFx, money),
            expensed: translate(expensed, presentationFx, money),
            capitalised: translate(capitalised, presentationFx, money),
        }, { concurrency: 1 }).pipe(Effect.catchTag('RateMissing', (error) => Effect.succeed(error)));
        if (translated instanceof RateMissing) {
            issues.push(issue('elimination.fx-missing', 'hold', fact.id, `no presentation rate for ${translated.from}; fact left uneliminated`));
            continue;
        }
        const costUnits = Money.units(translated.expensed) + Money.units(translated.capitalised);
        const costSide = Money.make(costUnits, presentationFx.presentationCurrency);
        const fxDifference = Money.make(Money.units(translated.income) - costUnits, presentationFx.presentationCurrency);
        differences.push({ factId: fact.id, incomeSide: translated.income, costSide, fxDifference });
        if (Money.units(fxDifference) !== 0n)
            issues.push(issue('elimination.fx-difference', 'warning', fact.id, `translation difference of ${fxDifference.minor} ${fxDifference.currency} minor units shown on its own line`));
        const candidate = yield* unrealisedCandidate(fact, money);
        if (candidate !== undefined) {
            unrealisedProfit.push({ factId: fact.id, candidate });
            issues.push(issue('elimination.unrealised-profit', 'hold', fact.id, 'payer capitalised marked-up cost; unrealised profit candidate for review'));
        }
        const id = options.entryId(fact);
        const lines = [
            ...signedLine(role(Roles.revenueIntercompany), translated.income),
            ...signedLine(role(Roles.icServiceCost), Money.negate(translated.expensed)),
            ...signedLine(role(Roles.icCapitalisedCost), Money.negate(translated.capitalised)),
            ...signedLine(role(Roles.fxDifferenceElimination), Money.negate(fxDifference), { memo: 'translation difference between issuer and recipient functional amounts' }),
        ];
        const entry = yield* makeEntry({
            id,
            entityId: consolidation.entityId,
            date: consolidation.date,
            period: periodOf(consolidation.date),
            memo: 'Eliminate intercompany income and cost',
            lines,
            source: { kind: 'elimination', derivationId: consolidation.derivationId, digest: factDigest },
        });
        entries.push(entry);
    }
    return { entries, differences, unrealisedProfit, issues };
});
//# sourceMappingURL=IntercompanyMirror.js.map