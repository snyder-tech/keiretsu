import { Effect, Schema } from 'effect';
import * as Currency from '@snyder-tech/keiretsu/core/Currency';
import * as Decimal from '@snyder-tech/keiretsu/core/Decimal';
import * as Money from '@snyder-tech/keiretsu/core/Money';
import { EntityId, PersonId } from '@snyder-tech/keiretsu/core/Ids';
import { Keiretsu, type KeiretsuInput } from '@snyder-tech/keiretsu/entity/Keiretsu';

// This fixture compiles against the packed declarations, with no paths aliases,
// workspace sources, allowImportingTsExtensions, or skipLibCheck escape hatch.
const currency = Schema.decodeSync(Currency.CurrencyCode)('PKR');
const fee = Effect.runSync(
  Money.fromDecimal({
    amount: Decimal.fromScaled(Decimal.multiply(Decimal.toScaled('2000000'), Decimal.toScaled('1.15'))),
    currency,
    table: Currency.iso4217,
    rounding: 'half-away-from-zero',
  }),
);
if (fee.minor !== '230000000' || fee.currency !== 'PKR') throw new Error('documented money result changed');

const sum: Effect.Effect<Money.Money, Money.CurrencyMismatch, never> = Money.add(fee, fee);
if (Effect.runSync(sum).minor !== '460000000') throw new Error('typed money operation changed');

const group = {
  tenant: 'northwind',
  entities: {
    'nw-us': {
      id: '01920000-0000-7000-8000-000000000001',
      legalName: 'Northwind Services LLC',
      jurisdiction: { country: 'US' },
      functionalCurrency: 'USD',
      fiscalYear: { _tag: 'month-end', endMonth: 12 },
      accountingBasis: { framework: 'us-gaap', method: 'accrual' },
      lifecycle: [{ value: 'active', validFrom: '2019-01-01' }],
    },
  },
} as const satisfies KeiretsuInput;

const company = Keiretsu.make(group);
const entity: typeof EntityId.Type = company.idOf('nw-us');
if (company.keyOf(entity) !== 'nw-us') throw new Error('adopter key inference changed');

if (false) {
  // Negative assertions run through the compiler and are never evaluated.
  // @ts-expect-error currency strings require validation into the currency brand
  Money.make(1n, 'PKR');
  // @ts-expect-error two validated string brands are still distinct
  Money.make(1n, Schema.decodeSync(Decimal.Decimal)('1'));
  // @ts-expect-error person and entity identifiers cannot be substituted
  const person: typeof PersonId.Type = entity;
  void person;
  // @ts-expect-error this entity was not declared by the adopter
  company.entity('nw-pk');
  // @ts-expect-error this currency was not declared by the adopter
  company.money('1', 'JPY');
}
