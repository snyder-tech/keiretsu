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
import { FxSnapshot } from '../fx/FxSnapshot.ts';
import { convertScaled, findSnapshot } from '../fx/Conversion.ts';

import { invalidJson, digestValue, Sha256, type CanonicalJsonError } from '../core/CanonicalJson.ts';
import { CurrencyCode, type CurrencyTableShape, type UnknownCurrency } from '../core/Currency.ts';
import * as Decimal from '../core/Decimal.ts';
import { brand } from '../core/Id.ts';
import { ChargeId, DerivationId, DocumentId, EntityId, type JournalEntryId } from '../core/Ids.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import * as Money from '../core/Money.ts';
import type { RoundingMode } from '../core/Rounding.ts';
import { IsoDate, periodOf } from '../core/Temporal.ts';

import { type InvalidEntry, type JournalEntry, type JournalLine, makeEntry, role, Roles, signedLine } from './Journal.ts';

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
}).check(
  Schema.makeFilter((fact) => (fact.issuer === fact.recipient ? 'ic.same-party: issuer and recipient differ' : undefined)),
  Schema.makeFilter((fact) =>
    Money.units(fact.amount) > 0n && Money.units(fact.issuerFunctional) > 0n && Money.units(fact.recipientFunctional) > 0n ? undefined : 'ic.amount-positive: amounts are positive',
  ),
  Schema.makeFilter((fact) => {
    const capitalised = fact.payerCapitalisation?.capitalised;
    if (capitalised === undefined) return undefined;
    return capitalised.currency === fact.recipientFunctional.currency && Money.units(capitalised) >= 0n && Money.units(capitalised) <= Money.units(fact.recipientFunctional)
      ? undefined
      : 'ic.capitalised-portion: capitalised portion lies within the recipient amount, in its currency';
  }),
);
/** @since 0.1.0 @category models */
export type IntercompanyFact = typeof IntercompanyFact.Type;

/**
 * The fact plus both projected entries, sharing the fact digest.
 *
 * @since 0.1.0
 * @category models
 */
export interface IntercompanyMirror {
  readonly fact: IntercompanyFact;
  readonly factDigest: Sha256;
  readonly issuerEntry: JournalEntry;
  readonly recipientEntry: JournalEntry;
}

/**
 * Project a fact into both books.
 *
 * @since 0.1.0
 * @category mirrors
 */
export const mirror = (options: {
  readonly fact: IntercompanyFact;
  readonly derivationId: typeof DerivationId.Type;
  readonly ids: { readonly issuerEntryId: typeof JournalEntryId.Type; readonly recipientEntryId: typeof JournalEntryId.Type };
}): Effect.Effect<IntercompanyMirror, CanonicalJsonError | InvalidEntry> =>
  Effect.gen(function* () {
    const { fact } = options;
    const factDigest = yield* Schema.encodeEffect(IntercompanyFact)(fact).pipe(
      Effect.mapError((error) => invalidJson('$', String(error))),
      Effect.flatMap(digestValue),
    );
    const source = { kind: 'intercompany-mirror', derivationId: options.derivationId, digest: factDigest } as const;
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
/** @since 0.1.0 @category models */
export type PresentationFx = typeof PresentationFx.Type;

/**
 * Per-fact elimination amounts in the presentation currency.
 *
 * @since 0.1.0
 * @category models
 */
export interface EliminationDifference {
  readonly factId: IntercompanyFact['id'];
  readonly incomeSide: Money.Money;
  readonly costSide: Money.Money;
  /** `incomeSide − costSide`. Shown on its own line; never absorbed. */
  readonly fxDifference: Money.Money;
}

/**
 * Elimination output.
 *
 * @since 0.1.0
 * @category models
 */
export interface EliminationResult {
  readonly entries: ReadonlyArray<JournalEntry>;
  readonly differences: ReadonlyArray<EliminationDifference>;
  /** Candidate unrealised profit in the payer's capitalised cost (recipient functional currency). Not booked. */
  readonly unrealisedProfit: ReadonlyArray<{ readonly factId: IntercompanyFact['id']; readonly candidate: Money.Money }>;
  readonly issues: ReadonlyArray<ValidationIssue>;
}

/**
 * Translation needed a rate the snapshot does not have.
 *
 * @since 0.1.0
 * @category errors
 */
export class RateMissing extends Data.TaggedError('RateMissing')<{ readonly from: string }> {}

const translate = (
  amount: Money.Money,
  fx: PresentationFx,
  money: { readonly table: CurrencyTableShape; readonly rounding: RoundingMode },
): Effect.Effect<Money.Money, RateMissing | UnknownCurrency> =>
  Effect.gen(function* () {
    if (amount.currency === fx.presentationCurrency) return amount;
    const found = findSnapshot(fx.snapshots, { from: amount.currency, to: fx.presentationCurrency });
    if (found === undefined) return yield* Effect.fail(new RateMissing({ from: amount.currency }));
    const scaled = yield* Money.toScaledAmount(amount, money.table);
    return yield* convertScaled({ amount: scaled, currency: amount.currency, snapshot: found.snapshot, direction: found.direction, table: money.table, rounding: money.rounding }).pipe(
      Effect.catchTag('CurrencyMismatch', () => Effect.fail(new RateMissing({ from: amount.currency }))),
    );
  });

const unrealisedCandidate = (fact: IntercompanyFact, money: { readonly table: CurrencyTableShape; readonly rounding: RoundingMode }): Effect.Effect<Money.Money | undefined, UnknownCurrency> =>
  Effect.gen(function* () {
    const capitalisation = fact.payerCapitalisation;
    if (capitalisation === undefined || Money.units(capitalisation.capitalised) === 0n) return undefined;
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
export const eliminate = (options: {
  readonly mirrors: ReadonlyArray<IntercompanyMirror>;
  readonly entryId: (fact: IntercompanyFact) => typeof JournalEntryId.Type;
  readonly presentationFx: PresentationFx;
  readonly consolidation: { readonly entityId: typeof EntityId.Type; readonly date: IsoDate; readonly derivationId: typeof DerivationId.Type };
  readonly money: { readonly table: CurrencyTableShape; readonly rounding: RoundingMode };
}): Effect.Effect<EliminationResult, UnknownCurrency | InvalidEntry | CanonicalJsonError> =>
  Effect.gen(function* () {
    const entries: Array<JournalEntry> = [];
    const differences: Array<EliminationDifference> = [];
    const unrealisedProfit: Array<{ readonly factId: IntercompanyFact['id']; readonly candidate: Money.Money }> = [];
    const issues: Array<ValidationIssue> = [];
    const { consolidation, money, presentationFx } = options;
    for (const { fact, factDigest } of options.mirrors) {
      const capitalised = fact.payerCapitalisation?.capitalised ?? Money.zero(fact.recipientFunctional.currency);
      const expensed = Money.make(Money.units(fact.recipientFunctional) - Money.units(capitalised), capitalised.currency);
      const translated = yield* Effect.all(
        {
          income: translate(fact.issuerFunctional, presentationFx, money),
          expensed: translate(expensed, presentationFx, money),
          capitalised: translate(capitalised, presentationFx, money),
        },
        { concurrency: 1 },
      ).pipe(Effect.catchTag('RateMissing', (error) => Effect.succeed(error)));
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
      const lines: ReadonlyArray<JournalLine> = [
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
