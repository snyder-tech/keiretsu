# @snyder-tech/keiretsu/commerce

Commerce layer of the **Keiretsu commercial interoperability standard**: what a group of companies
sells, under which agreements, how work moves between legal entities to the end customer, what each
hop charges, and the billing documents that carry those charges.

**Decision support; professional review required.** This package records commercial terms and
computes charges. It never outputs a filing position, tax classification, place-of-supply decision,
withholding character or arm's-length conclusion. Where those matter it emits a `hold`-severity issue
or a `hold` disposition for a person to decide. Invoices are claims, not revenue: revenue is posted
from recognition entries in `@snyder-tech/keiretsu/finance`, never from invoices.

## Modules (subpath imports)

| Module                                                                 | Owns                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Agreement`                                                            | masters and bilateral schedules, kind, invoice currency, rate-clause port, settlement terms, optional hold rights and lead-time classes; executed only with digested signed evidence                                                                                                           |
| `CapacityTerms`                                                        | `HoldRight` (holder, provider, roles, ceiling on minutes held at once, minimum lead days, expiry and release notice in business days, optional calendar and agent threshold), `LeadTimeClass` (half-open lead-day ranges with a discount in bps), `leadDays`, `classFor`, business-day helpers |
| `CapacityHoldCheck`                                                    | `validateCapacityHolds` — a capacity hold (work) is valid only under a hold right of an agreement executed on its booking date                                                                                                                                                                 |
| `BillingPolicy`                                                        | versioned, effective-dated, management-approved billing policy; `citePolicy`, `checkPolicyCitation` (agent- and system-drafted quotes must cite the policy in force)                                                                                                                           |
| `LegDisclosure`                                                        | `checkLegDisclosure` — no bundle carries another leg's cost base, markup or downstream resale price                                                                                                                                                                                            |
| `BillingMode`                                                          | the ten billing modes, `CostBaseRef` port (finance owns the `CostBaseDefinition`)                                                                                                                                                                                                              |
| `DividendAllocation`                                                   | efficiency-dividend split on value-based legs                                                                                                                                                                                                                                                  |
| `TransferRoute`                                                        | `TransferLeg`, `TransferRoute`, related-party status with determination ref, chain/acyclic/party invariants                                                                                                                                                                                    |
| `RouteView`                                                            | per-audience redaction of legs the audience is not party to                                                                                                                                                                                                                                    |
| `RouteBinding`                                                         | work object → route bindings (share bps, end customer, interval)                                                                                                                                                                                                                               |
| `TransferAllocation`                                                   | revisioned minute allocations, reversal chains, conservation                                                                                                                                                                                                                                   |
| `Charge`                                                               | pure `computeCharge` (price, less any lead-time class discount → translate with FX snapshot → round once)                                                                                                                                                                                      |
| `ChargeLine`                                                           | charge-line record, credits, optional lead-time class claim, single- and cross-record validators                                                                                                                                                                                               |
| `TaxLine`                                                              | `none`, `us-sales-tax`, `in-gst` (incl. export under LUT), `pk-provincial-sales-tax`, `eu-vat`; UNCL 5305 categories                                                                                                                                                                           |
| `Invoice`                                                              | invoices (380) and credit notes (381), EN 16931 totals, immutability once issued                                                                                                                                                                                                               |
| `InvoiceAssembly`                                                      | `assembleInvoices` with exclusions and append-only consumption links                                                                                                                                                                                                                           |
| `Numbering`                                                            | per entity/series/fiscal-year allocation, templates, gapless validation, allocator service                                                                                                                                                                                                     |
| `Withholding`                                                          | withholding certificates; `expectedCash` (never reduces revenue or payable)                                                                                                                                                                                                                    |
| `Offering`, `PriceBook`, `RateCard`, `ResaleMarginRule`                | catalog core, price lookup with explicit holds, resale margins in bps                                                                                                                                                                                                                          |
| `Party`, `WorkObjectRef`, `FxPort`, `Code`, `CommerceIds`, `Invariant` | ports and shared building blocks                                                                                                                                                                                                                                                               |

Ports (narrow structural inputs supplied by sibling packages): `WorkObjectRef` and `LabourEventRef`
(work), `RateClauseRef`/`FxSnapshotRef` (fx), `CostBaseRef`/`CostMeasurement` and the related-party
determination ref (finance).

## Example

```ts
import { Effect } from 'effect';
import { computeCharge } from '@snyder-tech/keiretsu/commerce/Charge';

// nw-pk → nw-us, cost-plus 15% on a PKR cost base, invoiced in USD at the snapshotted rate
const charge = Effect.runSync(computeCharge({ leg: legPkUs, basis: { minutes: 480, cost: pkrCostMeasurement, fx: usdPkrSnapshot } }));
charge.amount; // { minor: '817429', currency: 'USD' }
charge.disposition; // { _tag: 'accrue' } — or { _tag: 'hold', reasonCode: 'charge.related-party-undetermined', … }
```

## Invariants

Every invariant has a stable issue code. Schema checks prefix their failure message with the code;
validators return `ValidationIssue`s. Families: `agreement.*`, `leg.*`, `route.*`, `route-view.*`,
`binding.*`, `allocation.*`, `billing-mode.*`, `dividend.*`, `charge.*`, `assembly.*`,
`document.*`, `numbering.*`, `tax.*`, `withholding.*`, `offering.*`, `price-book.*`, `price.*`,
`resale.*`, `capacity-hold.*`, `billing-policy.*`, `leg-disclosure.*`.

## Roadmap (deferred from v0.1)

- Quote, contract/SOW, purchase order with tolerance holds, debit note, remittance, dispute,
  settlement (netting) statement, partner-program statements, AR ageing and dunning.
- Tax-currency totals for documents whose tax is stated in another currency (EN 16931 BT-111).
- E-invoicing profiles (UBL/PEPPOL encoder, India IRP registration gate, Pakistan digital invoicing).
- Pakistan export record (`pk-export`, proceeds realisation) and India realisation tracking records.
- SKUs, discount schedules, tiered/package price models, entitlements, subscription renewal rules,
  SSP studies and bundle allocation.
- Derivation receipts for every computed charge and invoice; mirror projections (receivable/payable).
- Typed adopter `KeySpace` narrowing and policy holds for undeclared codes; JSON Schema export.

`CostMeasurement` has separate `markupBase` and `passThrough` money fields in one currency. Cost-plus marks up only the base. FX uses the canonical snapshot legs and the leg rounding rule; the invoice amount is computed before rounding the provider amount. `ChargeLine.acceptanceIds` names human acceptance records.
