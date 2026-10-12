# @snyder-tech/keiretsu/fx

Exchange rates and foreign-currency accounting for the keiretsu commercial
interoperability standard. Rate series are data; rates resolve under an explicit
clause into digested snapshots; conversion multiplies exactly and rounds once.
The package also remeasures, translates, revalues, settles and eliminates under
ASC 830 and IAS 21.

**Decision support. Professional review is required.** The package computes
amounts from the inputs and flags you give it. It does not determine functional
currency, monetary classification, or long-term-investment designation, and it
reaches no accounting or tax conclusion. Those inputs come from your reviewed
policies.

## Modules

| Module | Exports |
| --- | --- |
| `FxSeries` | `FxSeries` (open id, publisher, measure, base/quote, `unit`, decimals, calendar, publication lag, verification, citation), `PublicationCalendar`, `isPublicationDay` |
| `SamplePack` | `SeriesPack` schema and `SamplePack`: **definitions only**, all `needs-verification`, for FBIL USD/INR, SBP USD/PKR (weighted average), ECB EUR reference, Fed H.10 and Bank of England. The pack has no rate values. |
| `FxObservation` | `FxObservation` (append-only, revisioned, bitemporal `recordedAt`, evidence and assurance), `append`, `fromObservations`, `latest` (with `knownAt`), `check` |
| `RateClause` | `RateClause` with `purpose`, `RateRoute` (`Direct`, `Triangulated` through a pivot, `Fixed`), `DateRule` (transaction, week-ending on a configurable weekday, period-end, period-average, invoice, settlement, fixed date), `Fallback` (`PreviousPublished` / `ProvisionalThenTrueUp` with a maximum lookback, or `Hold`), rounding, and `clauseDigest` |
| `FxSnapshot` | `FxSnapshot` (requested date, observed rate date, base/quote, display rate, legs with series, revisions and observation digests, pivot, status, fallback flag and reason, rounding, observation-set digest, revision chain, digest), `seal`, `verify` |
| `FxRateSource` | `FxRateSource` service with layers `fixed(observations)`, `fromJson(text)` and `fromCsv(text)`. The layers do no I/O: pass the text in. |
| `FxResolver` | `FxResolver` service (`resolve`, `trueUp`) with `FxResolver.layer(catalog)`, plus the pure `make` |
| `Conversion` | `convert` (exact, one rounding, forward or reverse), `convertTo`, `findSnapshot`, `trueUpDifference` |
| `Remeasurement` | `remeasure`: monetary items move to the closing rate, non-monetary items stay historical, and an `undetermined` item holds |
| `Translation` | `translate`: closing rate for assets and liabilities, average or line snapshot for P&L, historical for equity, with CTA |
| `Revaluation` | `revalueOpenBalances` (`cumulative-adjust` or `reverse-and-rebook`), `settle` (realized gain or loss, partial settlement) |
| `Elimination` | `eliminate`: translated eliminations plus the residual FX difference and its role |
| `FxError` | `RateUnavailable`, `RateHeld`, `ClauseInputMissing`, `SeriesMismatch`, `FxSourceError`, `ObservationConflict`, `SnapshotMismatch`, `SettlementExceedsBalance`, `HyperinflationaryUnsupported` |

## Example

```ts
import { Effect, Layer } from 'effect'
import { iso4217 } from '@snyder-tech/keiretsu/core/Currency'
import { FxRateSource } from '@snyder-tech/keiretsu/fx/FxRateSource'
import { FxResolver } from '@snyder-tech/keiretsu/fx/FxResolver'
import { convert } from '@snyder-tech/keiretsu/fx/Conversion'

// csvText is your committed, append-only observation file;
// catalog holds your verified series and maintained calendars.
const layer = FxResolver.layer(catalog).pipe(Layer.provide(FxRateSource.fromCsv(csvText)))

const program = Effect.gen(function* () {
  const resolver = yield* FxResolver
  const snapshot = yield* resolver.resolve({
    clause: weeklyClose,                 // e.g. WeekEnding fri, PreviousPublished 5 days
    base: usd, quote: inr,
    dates: { transactionDate },
  })
  return yield* convert({ amount: invoiceTotal, snapshot, table: iso4217 })
}).pipe(Effect.provide(layer))
```

## Invariants

- **Unknown is never zero.** A blank CSV rate means "unpublished". A missing rate falls back only as the clause allows, records `fallbackApplied` and `fallbackReason` (`non-publication-day`, `not-observed`, `outside-calendar`), and otherwise fails with `RateUnavailable` or `RateHeld`.
- **One rounding.** Conversion takes the amount in minor units, multiplies it by the exact rational product of the snapshot's legs, and rounds once with the clause's mode. Inverse and cross rates are never rounded, following the Council Regulation (EC) 1103/97 art. 4 precedent. The top-level snapshot `rate` is for display only. One rate is computed at the core scale (12 dp, half-even): the period average.
- **Append-only observations.** A restatement is revision n+1 and must name the digest of revision n. Re-appending the same revision is idempotent. Any other change fails with `ObservationConflict`. `knownAt` reproduces what was known at a close.
- **Verifiable snapshots.** `digest` is SHA-256 over the RFC 8785 form of every other member. `observationSetDigest` pins the observations used. A true-up is revision n+1 with `supersedesDigest`, and it fails with `RateHeld` while the rate is still unpublished.
- **No plugs.** CTA is computed only from a balanced, fully translated trial balance. An elimination residual counts as FX only when both sides mirror in transaction currency. Elimination lines plus the FX difference sum to zero.

Issue codes: `fx.observation.series-mismatch` (error), `fx.observation.decimals-exceed-series` (hold), `fx.observation.series-unverified` (warning), `fx.remeasure.nature-undetermined` (hold), `fx.remeasure.snapshot-missing` (hold), `fx.translate.unbalanced-input` (error), `fx.translate.equity-historical-missing` (hold), `fx.translate.snapshot-missing` (hold), `fx.revalue.side-sign-mismatch` (error), `fx.revalue.snapshot-missing` (hold), `fx.settle.long-term-balance-settled` (warning), `fx.eliminate.transaction-currency-differs` (hold), `fx.eliminate.transaction-amounts-differ` (hold), `fx.eliminate.receivable-not-debit` (error), `fx.eliminate.snapshot-missing` (hold).

Signs: debit is positive throughout. A positive `gainLoss` or `realized` is a gain. A positive `fxDifference` or `cta` is a debit (a loss).

Long-term-investment intercompany balances (ASC 830-20-35-3(b); IAS 21 ¶32, ¶45) take an input flag. Their revaluation difference stays in P&L in the entity's separate statements, with `consolidatedRole: 'oci-cta'`.

## Roadmap (deferred)

- Shipped holiday calendars per publisher and year, maintained as data.
- Publication-lag-aware resolution (`asOf` publication time, not just `knownAt`).
- `FxRestated` detection for open periods that used a superseded revision.
- `Stream`-based range reads and a `FileSystem` adapter subpath. Live publisher ingest adapters (append-only, checked against primary evidence).
- `RoundingSpec` with a cash or statutory increment, once core supports it.
- ISO 20022 `CurrencyExchange` export shape for snapshots.
- Config-typed series and clause literals (`defineFx`) and adopter policy for accepted series.
- Tax-purpose clause packs (India Income-tax Rule 115 SBI TT buying rate, IRC §989(b)) in the tax package.
- Unrealized profit in assets on elimination (capitalized markup) belongs in the finance package.
