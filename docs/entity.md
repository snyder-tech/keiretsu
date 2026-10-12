# @snyder-tech/keiretsu/entity

Group declaration for the **Keiretsu commercial interoperability standard**: the legal entities a group
declares, how they are owned and controlled, its counterparties and systems of record, the people who
work for it and on what terms, and when they can work.

> **Decision support; professional review required.** This package records declarations and screens
> them. It never classifies a worker, determines a tax group, concludes on control for consolidation or
> takes a filing position. It emits issues, holds and candidates for a human to decide.

## Modules

| Module | Contents |
| --- | --- |
| `Keiretsu` | `Keiretsu.make`, `decodeKeiretsu`, the `Keiretsu<K>` facade, `KeiretsuConfigError`, `KeiretsuService` (one static tag), `layer`, `get` |
| `KeiretsuInput` | the config schema, `KeiretsuInput` (authored type), `KeySpace`, `KeySpaceOf`, `PartyKeyOf` |
| `LegalEntity` | entities with timelines: legal name, functional currency, fiscal year (incl. 52–53 week), accounting basis, books system, lifecycle; `fiscalYearEnd` |
| `Identifier` | scheme-tagged identifiers; LEI MOD 97-10, US EIN, India PAN/GSTIN (checksum, embedded PAN)/CIN, Pakistan NTN |
| `Ownership`, `Control`, `TaxGroup` | separate ownership (`shareBps`) and control (scope, bases) edges with assurance; declared tax groups and an ownership screen |
| `Counterparty`, `Brand`, `SystemOfRecord` | counterparties with roles and related-party basis; brands (presentation only); system references |
| `Person`, `Engagement`, `RegimePack` | people with issuer-side subject crosswalks; engagements with legal relationship, parties, countries and regimes; regime code data pack |
| `Pseudonym` | HMAC-SHA-256 pseudonyms per (issuer, audience, epoch) via Web Crypto; `PseudonymKeyring` port |
| `WorkCalendar`, `Availability` | CLDR-style weekend days, holiday packs (provisional/restricted), leave; `availableMinutes` |
| `Invariants`, `GraphInvariants`, `PeopleInvariants` | every invariant with a stable issue code (tables in each module's docs) |
| `Timeline`, `Model` | effective-dated timelines and the normalized model |

## Example

```ts
import { Keiretsu, type KeiretsuInput } from '@snyder-tech/keiretsu/entity/Keiretsu'

export const group = {
  tenant: 'northwind',
  entities: {
    'nw-us': {
      id: '01920000-0000-7000-8000-000000000001',
      legalName: 'Northwind Services LLC',
      jurisdiction: { country: 'US', subdivision: 'US-PA' },
      functionalCurrency: 'USD',
      fiscalYear: { _tag: 'month-end', endMonth: 12 },
      accountingBasis: { framework: 'us-gaap', method: 'accrual' },
      lifecycle: [{ value: 'active', validFrom: '2019-01-01' }],
    },
    'nw-pk': {
      id: '01920000-0000-7000-8000-000000000003',
      legalName: 'Northwind Delivery (Private) Limited',
      jurisdiction: { country: 'PK' },
      functionalCurrency: 'PKR',
      fiscalYear: { _tag: 'month-end', endMonth: 6 },
      accountingBasis: { framework: 'pk-ifrs', method: 'accrual' },
      lifecycle: [{ value: 'active', validFrom: '2024-01-01' }],
    },
  },
  control: [
    { controller: 'nw-us', controlled: 'nw-pk', scope: 'full', bases: ['operational'], assurance: 'asserted',
      evidence: [{ kind: 'minutes', ref: 'board-2024-01' }], validFrom: '2024-01-01' },
  ],
} as const satisfies KeiretsuInput

type K = Keiretsu.KeySpaceOf<typeof group> // { entity: 'nw-us' | 'nw-pk'; currency: 'USD' | 'PKR'; country: 'US' | 'PK'; … }
const k = Keiretsu.make(group)             // Keiretsu<K>; throws KeiretsuConfigError on an invalid config
k.money('1000.00', 'PKR')                  // { minor: '100000', currency: 'PKR' }
k.money('1', 'JPY')                        // compile error: 'JPY' is not declared
k.idOf('nw-pk')                            // EntityId
k.screen('bundle-7', { entity: 'nw-de' })  // [{ code: 'policy.undeclared-entity', severity: 'hold', … }]
```

At runtime (multi-tenant hosts, YAML-sourced config) use `decodeKeiretsu(unknown)` or
`Keiretsu.layer(config)`, then `Keiretsu.get<K>()` inside an Effect program. There is one statically
declared `KeiretsuService` tag; tags are never minted per config.

Narrowed literal schemas (`k.schemas`) are **adopter policy**: decode wire data with the open schemas
first, then screen it against the key space so an undeclared value becomes a hold, not a decode failure.

## Invariants (selected)

Uniqueness (`key.duplicate`, `id.duplicate`, `key.former-duplicate`, `identifier.duplicate`); timelines
(`timeline.order`, `timeline.outside-lifecycle`); references (`ref.unresolved`); identifiers
(`identifier.lei-checksum`, `identifier.gstin-checksum`, `identifier.gstin-pan-mismatch`, …); ownership
(`ownership.over-allocated` per date, `ownership.cycle`); control (`control.full-overlap`,
`control.joint-single`, `control.equity-without-ownership`); `tax-group.ownership-unsupported` (warning);
engagements (`engagement.paying-agent-agreement`, `engagement.secondee-host`, `engagement.overlap`,
`engagement.relationship-evidence-missing`, `engagement.withholding-unknown` as a hold). Unverified edges
are surfaced as warnings and excluded from derivations unless a caller opts in.

## Data

Regime codes (`us-w2`, `in-192`, `pk-149`, …) and holiday packs are data marked `needs-verification`.
The bundled `RegimePack.samplePack()` is illustrative; adopters supply their own verified pack through
`decodeKeiretsu(config, { regimePack })`. Public packages carry no adopter data; the tests use the
fictitious Northwind group.

## Roadmap (deferred)

- ISO 3166 membership table for countries and subdivisions (pattern-only today; needs a core data subpath).
- `codegen` from YAML registries with a `--check` mode; JSON Schema export with the invariant catalogue.
- §1563 brother-sister (five-or-fewer persons) test; OECD associated-enterprise and GST-group screens.
- Functional-currency determination records (ASC 830-10-55-5 indicators) and `ControlDetermination`.
- Contractor-control screen (employer-style control facts on contractor engagements) and presence days.
- Leave feed and holiday packs as Layer-loaded versioned data subpaths; RFC 5545 import/export.
- Bitemporal revisions of config records (`recordedAt`, revision chains).

Effect is a peer dependency. ESM only. Apache-2.0.
