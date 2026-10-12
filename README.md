# @snyder-tech/keiretsu

Effect-first, strongly typed records for the **Keiretsu commercial interoperability standard**. A
group of companies and its partners declare who they are and how they trade, then record work, price
it, bill it, cost it, recognise it, exchange it and attribute tax incentives to it across currencies
and countries.

```sh
npm install @snyder-tech/keiretsu effect
```

ESM only. `effect` (stable v4) is the only peer dependency. Apache-2.0.
TypeScript consumers need strict checking and the `ESNext.Disposable` library in addition to their runtime libraries.

## Areas

Import each module from its subpath. There is no root barrel, so bundles carry only what you import.

| Subpath                                  | Owns                                                                                                                       | Guide                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `@snyder-tech/keiretsu/core/*`           | ids, dates and periods, canonical decimals, money, allocation, digests, actors, holds and decisions, derivations           | [core](./docs/core.md)                     |
| `@snyder-tech/keiretsu/entity/*`         | typed adopter configuration, legal entities, ownership and control, tax groups, people, engagements, pseudonyms, calendars | [entity](./docs/entity.md)                 |
| `@snyder-tech/keiretsu/fx/*`             | rate series, clauses, snapshots, resolvers, remeasure, translate, revalue, settle, elimination FX                          | [fx](./docs/fx.md)                         |
| `@snyder-tech/keiretsu/work/*`           | economic events, journal → proposal → attested time, AI usage, work orders, acceptance, capacity                           | [work](./docs/work.md)                     |
| `@snyder-tech/keiretsu/commerce/*`       | agreements, routes, legs and allocations, billing modes, charges, invoices and credit notes, tax lines, catalog            | [commerce](./docs/commerce.md)             |
| `@snyder-tech/keiretsu/finance/*`        | costing, cost-base definitions, transfer pricing, revenue recognition, journals, eliminations                              | [finance](./docs/finance.md)               |
| `@snyder-tech/keiretsu/tax-incentives/*` | regime packs, activity slices, funding assessments, claimant attribution, candidate pools                                  | [tax-incentives](./docs/tax-incentives.md) |
| `@snyder-tech/keiretsu/exchange/*`       | signed bundles, digests over wire JSON, JWS, sequencing, receipts, disclosure                                              | [exchange](./docs/exchange.md)             |

Dependencies run one way: `core ← entity ← {fx, work} ← commerce ← finance ← tax-incentives`, and
`core ← exchange`. `*/internal/*` paths are not exported.

## Example

```ts
import { Effect } from 'effect';
import * as Currency from '@snyder-tech/keiretsu/core/Currency';
import * as Decimal from '@snyder-tech/keiretsu/core/Decimal';
import * as Money from '@snyder-tech/keiretsu/core/Money';

// Cost-plus 15% on a PKR cost base, rounded once to minor units
const fee = Money.fromDecimal({
  amount: Decimal.fromScaled(Decimal.multiply(Decimal.toScaled('2000000'), Decimal.toScaled('1.15'))),
  currency: 'PKR' as Currency.CurrencyCode,
  table: Currency.iso4217,
  rounding: 'half-away-from-zero',
});
Effect.runSync(fee); // { minor: '230000000', currency: 'PKR' }
```

## Principles

- **Hold, don't guess.** Missing or undetermined facts produce a `Hold` with a stable issue code,
  never a plug value.
- **Exact arithmetic.** Canonical decimal strings and `bigint` minor units; rounding happens once,
  with the rule recorded.
- **Digests over the wire.** SHA-256 over RFC 8785 canonical JSON of the received bytes; detached
  Ed25519 JWS when a bundle leaves its issuer's group.
- **Law as data.** Tax and transfer-pricing rules ship as regime packs marked `needs-verification`
  until a professional confirms them.

**Decision support, not advice.** Modules that touch tax, transfer pricing or accounting produce
evidence and candidate results for professional review. They never make a filing, classification or
arm's-length determination.

## Versioning

The version follows the publisher's monorepo release train. While the major version is 0, a minor
release may change record shapes; wire records carry their spec version.
