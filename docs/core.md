# @snyder-tech/keiretsu/core

Core primitives of the **Keiretsu commercial interoperability standard**: the shared vocabulary that
lets a group of companies and its partners record work, price it, bill it, cost it and exchange it
across currencies and countries.

- `Id` — UUIDv7 identifiers and namespaced brands
- `Temporal` — ISO dates, periods, half-open intervals, bitemporal stamps
- `Decimal`, `Rounding` — canonical exact decimals and explicit rounding modes
- `Currency`, `Money`, `Allocation` — ISO 4217 minor units, money totals, largest-remainder allocation (no plugs)
- `CanonicalJson` — strict JSON parsing, RFC 8785 canonical form, SHA-256 over wire JSON
- `Actor`, `Envelope`, `Hold`, `Issue` — human/agent actors, evidence and revisions, holds and decisions, validation issues

```ts
import { Effect, Schema } from 'effect';
import * as Money from '@snyder-tech/keiretsu/core/Money';
import * as Currency from '@snyder-tech/keiretsu/core/Currency';
import * as Decimal from '@snyder-tech/keiretsu/core/Decimal';

const fee = Money.fromDecimal({
  amount: Decimal.fromScaled(Decimal.multiply(Decimal.toScaled('2000000'), Decimal.toScaled('1.15'))),
  currency: Schema.decodeSync(Currency.CurrencyCode)('PKR'),
  table: Currency.iso4217,
  rounding: 'half-away-from-zero',
});
Effect.runSync(fee); // { minor: '230000000', currency: 'PKR' }
```

Effect is a peer dependency. ESM only. Apache-2.0.

**Decision support, not advice.** Packages in this family that touch tax, transfer pricing or
accounting produce evidence and candidate results for professional review; they never make a filing,
classification or arm's-length determination.
