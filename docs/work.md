# @snyder-tech/keiretsu/work

Delivery facts for the **Keiretsu commercial interoperability standard**: what work happened, who
did it, where and when, what AI it used, what was ordered and accepted, and what capacity was
offered and committed. Every other layer (charges, cost, revenue, journals, tax attributions) is a
derivation over these records. This package holds no prices, cost rates or tax logic.

**Decision support; professional review required.** Presence days and permanent-establishment flags
are screening inputs, not conclusions. The package never decides employment classification,
treaty position, research qualification or any filing position.

## Modules

| Module                                                             | Contents                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EconomicEvent`                                                    | The event spine: `labour` (attested human minutes with employer, relationship, work situs, civil work date and IANA zone, lineage), `compute` (AI/tool usage in integer units with `Money` cost and cost bearer), `delivery` (value units handed over), `licence-use` (metered use). Bitemporal and revisioned. `currentRevisions`, `occurredOn`                       |
| `JournalEntry`                                                     | Append-only journal with PROV-style provenance (`human`/`agent`/`hook`); `affirm` (owner only)                                                                                                                                                                                                                                                                         |
| `TimeProposal`                                                     | Agent- or system-drafted minutes with attribution method and confidence; `promote` and `dismiss` (owner only, `HumanActor`)                                                                                                                                                                                                                                            |
| `WorkObject`, `ProjectLink`                                        | References into each entity's own systems (open system codes, `x-` kinds); bilateral links accepted by a human for each owner (`acceptLink`)                                                                                                                                                                                                                           |
| `ApprovalChain`, `WorkOrder`, `StandingAuthority`                  | Configured approval stages; scope lines whose budgets sum to the order budget; `approve` with separation of duties; `authorizeUnderStanding` (scope, threshold, cap, expiry)                                                                                                                                                                                           |
| `Acceptance`                                                       | `accepted` / `rejected` / `accepted-with-deviations` / `deemed`, citing the criteria digest and producing events; `accept` (human only)                                                                                                                                                                                                                                |
| `CapacityOffer`, `CapacityRequest`, `CapacityCommitment`           | One record per writer; configurable week start day; `commit` (employer's human only, committed ≤ requested ≤ offered)                                                                                                                                                                                                                                                  |
| `CapacityHold`                                                     | Time-boxed reservation of another company's capacity (pseudonymous person or role) under an agreement's hold right; `state` `held → converted \| released \| lapsed` (adjacency map, `canTransitionCapacityHold`); `closeHold` writes the next revision with `supersedesDigest`. Distinct from a charge line's `held` status and from core `Hold`                      |
| `CapacityForecast`                                                 | Non-binding 13-week forecast (`binding: false`) of weekly minutes per subject                                                                                                                                                                                                                                                                                          |
| `FirmSchedule`                                                     | Two-week firm schedule, one human-signed revision per civil day; reassignment removes and adds assignments and declares `reassigned` with the id it replaces                                                                                                                                                                                                           |
| `ValidatePlanning`                                                 | `planningIssues(set)` — hold lifecycles and schedule revisions (run by `validateWork`)                                                                                                                                                                                                                                                                                 |
| `PresenceDays`                                                     | Distinct civil dates per person and jurisdiction from labour situs                                                                                                                                                                                                                                                                                                     |
| `ValidateWork`                                                     | `validateWork(set)` — cross-record invariants as core `ValidationIssue`s                                                                                                                                                                                                                                                                                               |
| `MonthlyClose`                                                     | The standard monthly close: period lifecycle (`open` → `closing` → `locked`), `computeCloseReadiness` (owed days, stragglers, the four standard checks), `findAnomalies` with an adopter classifier, `approvalInbox`, `strandedPreview`, `lockIssues` and the exchanged `CloseReceipt`. The chart of accounts is per entity (`finance/CloseProfile`); the close is not |
| `Employment`                                                       | Port: `EmploymentFact` (person → employer over an interval), supplied by `keiretsu/entity` engagements                                                                                                                                                                                                                                                                 |
| `WorkSource`                                                       | Source adapter port (`Context.Service`), `layerInMemory`, `fetchAll`                                                                                                                                                                                                                                                                                                   |
| `Disclosure`                                                       | Disclosure level per record kind (journals and proposals are owner-only)                                                                                                                                                                                                                                                                                               |
| `Code`, `PersonRef`, `PartyRef`, `TimeZone`, `WorkIds`, `NotOwner` | Open codes and `x-` extensions, identified/pseudonymous people, parties, IANA zones and civil dates, ids, owner errors                                                                                                                                                                                                                                                 |

## Trust ladder

```
JournalEntry (anyone writes, owner affirms)
  → TimeProposal (agent or system drafts, cites affirmed journals)
    → promote(proposal, owner: HumanActor) → labour EconomicEvent (origin: agent-proposal + proposal digest)
```

Human-only steps (`affirm`, `promote`, `dismiss`, `approve`, `accept`, `commit`, `acceptLink`) take a
`HumanActor`, so agent code does not compile, and re-check with core `requireHuman` for actors that
arrive over the wire.

```ts
import { Effect } from 'effect';
import { promote } from '@snyder-tech/keiretsu/work/TimeProposal';
import { validateWork } from '@snyder-tech/keiretsu/work/ValidateWork';

const program = Effect.gen(function* () {
  const { event, proposal: promoted } = yield* promote({ proposal, owner, facts, at });
  return validateWork({ events: [event], journals, proposals: [promoted] });
});
```

## Invariants (issue codes)

Shape rules are schema checks (minutes 1–1,440 per labour event, IANA zone, subdivision inside the
country, revision chain, valid interval contains the event date, compute counts are integers, scope
lines sum to the budget, human grantors/deciders/committers). Cross-record rules are reported by
`validateWork`; the full table is in the `ValidateWork` module doc. Highlights:
`work.labour.day-cap` (≤ 1,440 minutes per person and civil date across all systems),
`work.labour.work-date-not-civil`, `work.labour.agent-origin-unpromoted`,
`work.proposal.unaffirmed-evidence` (hold), `work.work-order.self-approval`,
`work.work-order.standing-exceeded`, `work.acceptance.unknown-event`, `work.acceptance.ai-only`
(warning: AI compute alone substantiates no human labour), `work.capacity.commit-exceeds-request`,
`work.capacity.committer-not-employer`, `work.pe.acting-for-not-employer` (warning). Planning:
`work.capacity-hold.illegal-transition`, `work.capacity-hold.terms-changed`,
`work.capacity-hold.conversion-mismatch`, `work.schedule.undeclared-change`,
`work.schedule.assignment-mutated`, `work.schedule.not-daily` (full table in `ValidatePlanning`).
Checks against the agreement's hold right live in `commerce/CapacityHoldCheck`.

## Source adapter mapping notes

Adapters are `Layer`s providing `WorkSource`. They map vendor records to events, never invent
missing facts, and fail (or hold upstream) when a record cannot be mapped. No vendor code ships here.

- **Task-tracker work logs** (hours logged per work item, often as floating-point hours): map each
  approved log to a `labour` event with `origin: import`. Convert hours to integer minutes by a
  declared rule and reconcile per person-week within one minute (largest remainder, core
  `Allocation`). Transcript- or agent-drafted logs map to `TimeProposal`, never directly to labour.
  The work item becomes a `WorkObjectRef` (`kind: work-item`); a time zone missing from the source
  comes from the engagement, never from the server.
- **Kantata (PSA)**: approved time entries → `labour`; resource allocations → `CapacityOffer` or work
  order scope, not labour; the vendor's external-reference fields act as the identity crosswalk.
  Outbound pushes are idempotent on `(event id, revision)`.
- **Replicon**: file import only (timesheet exports), approved rows → `labour` with
  `origin: import`; timesheet approval status is evidence, not an approval chain.
- **Executive work journals** (journal entries with agent-session provenance and owner affirmation):
  map to `JournalEntry`; the journal's proposal generator maps to `TimeProposal`; work-order
  envelopes map to `StandingAuthority`.

## Roadmap (deferred)

- Typed configuration (`defineWork`) narrowing systems, activities, value units and stages to a
  `KeySpace`, with adopter policy raising holds for undeclared codes.
- Capability catalog (value units, calibrated baselines) — may move to its own package.
- Calendars and availability (`net availability` bound on offers), planner grants.
- Midnight-crossing split and configurable workday cutoff; hours→minutes reconciliation helper.
- Digest verification of `supersedesDigest` chains (exchange receiver) and crosswalk records.
- Secondment flag (partner directing day-to-day work), agent budgets on work orders.
- JSON Schema annotations and conformance vectors for each issue code.

Effect is a peer dependency. ESM only. Apache-2.0.

Work-object owners and human actors use the canonical core `PartyRef`. Labour records `assistedBy` compute-event IDs; references must resolve to recorded compute events. Tax projections derive assistance from that attested linkage.
