# @snyder-tech/keiretsu/finance

Finance layer of the **Keiretsu commercial interoperability standard**: costing, transfer pricing,
minimal revenue recognition, ledger-agnostic journals and intercompany eliminations for a group of
companies that bill each other across currencies and countries.

> **Decision support; professional review required.** This package produces candidates, flags and
> holds. It never outputs a filing position, a tax-credit amount, a classification or an arm's-length
> conclusion, and it never writes to a ledger. Rule data shipped here (downward-adjustment bars,
> safe-harbour bands, percentile conventions) is illustrative, cited and marked `needs-verification`;
> adopters verify their own packs in private configuration. Apache-2.0 §§7–8 apply.

## Design rules

- **One cost base.** `CostBaseDefinition` is digested; costing measures against it and every
  cost-plus amount and true-up cites the same digest. Pass-through costs are not marked up. A
  component the definition does not name is held, never silently excluded.
- **No plugs.** Allocation is exact to the minor unit (core largest-remainder). With no rule, an
  ambiguous rule or missing driver data, the whole pool stays on an explicit `unallocated` line.
  Elimination FX differences are computed and shown on their own line.
- **Hold, don't guess.** Unknown is not zero and not permission: an undetermined related party, a
  jurisdiction without rule data, a small cohort or an undetermined principal/agent role all hold.
- **Humans decide.** Allocation-rule approvals, period freezes, related-party determinations,
  principal/agent roles and aggregate cost attestations require a human actor.
- **Revenue is recognised, not billed.** Journals credit revenue roles only when the entry cites a
  recognition derivation; invoices debit receivables and credit contract liabilities.

## Modules

| Area             | Module               | Key exports                                                                                                                             |
| ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Costing          | `CostObject`         | `CostObject` (project, work-order, customer, product, capability, internal-investment)                                                  |
|                  | `CostPool`           | `CostPool`, `PoolBalance`, `CostPoolKind`, `CostBehaviour`                                                                              |
|                  | `LoadedRateSnapshot` | `LoadedRate` (pay with `wageKind`, burden, benefits, overhead), `LoadedRateSnapshot`, `resolveRate`, `componentCosts`, `snapshotDigest` |
|                  | `CostBaseDefinition` | `CostBaseDefinition`, `measure` → `CostBaseMeasurement`, `costPlusAmount`, `definitionDigest`                                           |
|                  | `AllocationRule`     | `AllocationRule`, `Driver`, `checkApproval`, `validateVersions`, `rulesInEffect`                                                        |
|                  | `PoolAllocation`     | `allocatePool`, `DriverMeasurement`, `AllocationLine`                                                                                   |
|                  | `CostAssessment`     | `CostAssessment`, `disclose` (minimum cohort `MIN_COHORT = 5`)                                                                          |
|                  | `CostSnapshot`       | `CostPeriod`, `CostLine`, `freeze`, `verify`, `correctionPeriod`, `correction`                                                          |
| Transfer pricing | `RelatedParty`       | `RelatedPartyDetermination`, `ControlTest`, `candidateResult`, `pairStatus`                                                             |
|                  | `TpMethod`           | `TpMethod` (CUP, resale price, cost plus, TNMM, profit split, low-value services 5%), `Pli`, `methodFlags`                              |
|                  | `Benchmark`          | `Benchmark`, `quantileRange` (interquartile, 35–65 percentile, full)                                                                    |
|                  | `ArmsLength`         | `plIndicator`, `armsLengthTest` (within / below / above; median as candidate point)                                                     |
|                  | `TrueUp`             | `trueUp` → `TrueUpCandidate`, `DownwardAdjustmentRule`                                                                                  |
|                  | `IntercompanyLoan`   | `IntercompanyLoan`, `LoanEvent`, `accrueInterest`, `daysBetween`, `afrBand`, `safeHarbourCheck`                                         |
|                  | `Netting`            | `proposeNetting`, `NettingPermission`                                                                                                   |
| Revenue          | `Revenue`            | `PerformanceObligation`, `recognise`, `contractPosition`, `revenueRole`, `recognitionJournal`                                           |
| Journal          | `Journal`            | `JournalEntry`, `JournalLine`, `AccountRole`, `Roles`, `validateEntry`, `makeEntry`                                                     |
|                  | `ChartMapping`       | `ChartMapping`, `resolve`, `coverage`                                                                                                   |
| Close            | `CloseProfile`       | `CloseProfile` (entity, country, functional currency, chart), `STANDARD_CLOSE_ROLES`, `CloseRoles`, `checkCloseProfile`, `accountCode`  |
|                  | `HledgerRender`      | `render` (plain-text journal, dry run)                                                                                                  |
|                  | `XbrlGlRender`       | `render` (minimal `gl-cor` instance, dry run)                                                                                           |
| Intercompany     | `IntercompanyMirror` | `IntercompanyFact`, `mirror`, `eliminate`, `PresentationFx`                                                                             |

Import by subpath: `@snyder-tech/keiretsu/finance/PoolAllocation`.

## Ports (data owned by other packages)

- `PresentationFx` — canonical FX snapshots and exact conversion legs (`@snyder-tech/keiretsu/fx`).
- `DriverMeasurement` minutes and `CostAssessment` engagement ids — attested time (`@snyder-tech/keiretsu/work`).
- `BilledCharge` and `IntercompanyFact.chargeIds` — charge lines (`@snyder-tech/keiretsu/commerce`).
- `LoadedRate.components.pay.wageKind` — read by `@snyder-tech/keiretsu/tax-incentives` to select statutory wages.

## Example

```ts
import { Effect } from 'effect';
import { allocatePool } from '@snyder-tech/keiretsu/finance/PoolAllocation';

const allocation = Effect.runSync(allocatePool({ pool, balance, rules, measurements }));
// allocation.lines sum exactly to balance.amount; with no approved rule the
// single line is { _tag: 'unallocated', reasonCode: 'allocation.no-rule' } plus a hold.
```

## Issue codes

`allocation.*` (no-rule, ambiguous-rule, measurement-missing, zero-driver, currency, entity-mismatch),
`allocation-rule.*` (human-approval, not-approved, decision-subject, overlap, duplicate-revision),
`rate.*`, `cost-base.*`, `cost-assessment.*` (min-cohort, private, human-attestation),
`cost-snapshot.*`, `related-party.*`, `tp.*` (lvas-markup, lvas-excluded, benchmark-required),
`benchmark.*`, `true-up.*` (cost-base-mismatch, downward-barred, rule-missing, measurement-held),
`loan.*`, `netting.*`, `revenue.*`, `journal.*` (unbalanced, revenue-from-recognition, period-date,
amount-positive, min-lines), `chart.*`, `render.*`, `ic.*`, `elimination.*` (fx-difference,
fx-missing, unrealised-profit).

## Roadmap (deferred from v0.1)

- QBO and Tally adapters (`render` + human-approved `submit` behind a Layer); hledger/XBRL GL
  round-trip parsers; `gl-muc` and `gl-bus` modules; Arelle validation in CI.
- Activity-based costing (pools → activities → objects), absorption vs direct costing views,
  capitalisation policies and decisions (ASC 350-40 / ASU 2025-06 / IAS 38) with amortisation.
- Margin by project/customer/entity/group and budget-vs-actual variance decomposition.
- Revenue: transaction price, variable consideration and constraint, SSP allocation, contract
  modifications, costs to obtain (ASC 340-40).
- Transfer pricing: agreements and schedules, management-fee allocation keys, guarantees, withholding
  determinations, PE flags, documentation obligations, CbCR thresholds, weekly close and IC matching
  with difference-by-cause, revaluation, India 35–65 fallback (arithmetic mean with tolerance).
- Eliminations of open intercompany balances (receivable vs payable) and CTA routing; control
  determination gating for consolidation.
- Derivation receipts (`explain`) emitted by every computation; JSON Schema and conformance vectors.
- Jurisdiction rule packs as separately versioned data packages.

Elimination requires a caller-supplied `entryId(fact)` resolver. Bind IDs to fact identity for deterministic replay. `PresentationFx.snapshots` carries the sealed snapshots; conversion never rounds an inverse rate before money.
