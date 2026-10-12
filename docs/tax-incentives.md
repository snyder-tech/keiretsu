# @snyder-tech/keiretsu/tax-incentives

**Decision support; professional review required.** This package screens work for tax-incentive
relevance and produces _candidates_, _flags_ and _holds_ for a CPA, tax adviser or owner to decide.
It never computes a credit or deduction amount, makes an election, classifies an activity, or takes
a filing position. Regime data shipped here is reference material marked `needs-verification`; it is
not advice. See the Apache-2.0 licence, §§7–8 (no warranty, no liability).

It answers, for every attested labour event: does the time carry an incentive consideration, in
which jurisdiction, under which regime, and which legal entity is the candidate claimant?

## Modules

| Module                                                       | Purpose                                                                                                                                                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IncentiveRegime`                                            | Cited, effective-dated regime data: situs, kind, category axis, claimant bases, test date, decimal parameters, wage cost-base rule, base-period years, status                       |
| `RegimePack`                                                 | Example pack: US §41, §174A domestic, §174 foreign (15-year), Pennsylvania R&D credit, India s. 35 (with s. 115BAA and 2025-Act notes), Pakistan s. 154A — all `needs-verification` |
| `BusinessComponent`                                          | Unit of analysis with internal-use class and uncertainty / alternatives / experimentation evidence                                                                                  |
| `TaxActivitySlice`                                           | One labour event's minutes split with **separate** `qreCategory` (credit) and `sreCategory` (deduction/amortisation) axes, quarter, substantiation and attesting human              |
| `RegimeCostBase`                                             | Per-regime base from payroll wage facts — never a loaded rate; excluded facts listed with reasons; unknown never zero                                                               |
| `FundingAssessment`                                          | Funded-research test per agreement with exclusive performer/payer verdicts                                                                                                          |
| `ClaimantAttribution`                                        | Candidate claimant and basis per (slice, regime, tax year); uniqueness key `(eventId, eventDigest, sliceId, regimeId)`                                                              |
| `ControlledGroupYear`, `BasePeriodFact`                      | Group context per year (undetermined holds), prior-year base status (unknown ≠ zero)                                                                                                |
| `LabourFact`, `WageFact`, `TransferFact`, `EntityTaxProfile` | Ports for data owned by `keiretsu/work`, payroll/`keiretsu/finance`, `keiretsu/commerce` and `keiretsu/entity`                                                                      |
| `IncentiveSet`, `Screen`, `IssueCode`                        | The screened set, `screen(set)` → core `ValidationReport`, and the invariant catalogue                                                                                              |
| `CandidatePool`                                              | `candidatePools(set, regimeId, taxYear)` → per-claimant candidate minutes and wage base by category with digest-pinned inputs                                                       |

## Example

```ts
import { Effect } from 'effect';
import { screen } from '@snyder-tech/keiretsu/tax-incentives/Screen';
import { candidatePools } from '@snyder-tech/keiretsu/tax-incentives/CandidatePool';
import { ExampleRegimeIds } from '@snyder-tech/keiretsu/tax-incentives/RegimePack';

const report = screen(set); // errors reject, holds wait for a human Decision, warnings flag
const { pools } = await Effect.runPromise(candidatePools(set, ExampleRegimeIds.usIrc41, '2025'));
// pools[0].status === 'candidate'; categories carry minutes and a wage base (or `unknown`)
```

Northwind Engineering India Limited work billed cost-plus to Northwind Services LLC is rejected for
the US research credit (`qre.foreign-research-excluded`), and is a foreign §174 candidate for the
US payer only when a funding assessment shows the payer bears the risk and holds the rights;
otherwise it is held (`sre.foreign-risk-rights-unproven`).

## Rules enforced

Situs gates every regime (a sub-national regime holds without a subdivision); transfer legs never
change situs or wage payer; intra-group charges are disregarded for the credit; one claimant per
slice per regime; funded work excludes the performer; an undetermined controlled group holds
group-level regimes; missing base years stay `unknown`; AI assistance alone never qualifies; the
effective date is tested on the regime's declared clock (claimant taxable-year start, work date…);
stale or unverified citations warn. Codes and severities are listed in `IssueCode.IssueCodes`.

## Roadmap (deferred)

- Payer-side cost for contract research and foreign §174 (the charge measured by `keiretsu/finance`), and FX into the claimant's functional currency.
- Provider-side §174 rule for funded performers; supplies and computer-use categories; post-production shrink-back per component.
- Presence-day and permanent-establishment flags; PA small-business asset test; UK and EU example packs.
- Fiscal-calendar quarters (quarters are calendar quarters in 0.1); strict mode turning `needs-verification` into holds.
- JSON Schema annotations and conformance vectors for each issue code.

Effect and `@snyder-tech/keiretsu/core` are peer dependencies. ESM only. Apache-2.0.

`Projections` exports `labourFact`, `transferFacts`, `employmentFacts` and `entityTaxProfile` from the source records. An entity tax profile requires explicit pass-through classification and registration evidence; the package does not infer either.

`labourFact(event, { computeEvents })` requires human attestation and resolves every explicit assistance reference against supplied compute records. Complete source work-set validation, including employment and proposal evidence, remains a caller obligation before screening.
