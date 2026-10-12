import { readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Effect, Schema } from 'effect';
import * as Currency from '@snyder-tech/keiretsu/core/Currency';
import * as Decimal from '@snyder-tech/keiretsu/core/Decimal';
import * as Money from '@snyder-tech/keiretsu/core/Money';
import { parseStrict } from '@snyder-tech/keiretsu/core/CanonicalJson';
import { convertScaled } from '@snyder-tech/keiretsu/fx/Conversion';
import { seal } from '@snyder-tech/keiretsu/fx/FxSnapshot';

test('every published module loads and internal/root imports are blocked', async () => {
  const files = readdirSync('dist', { recursive: true }).filter((file) => file.endsWith('.js'));
  for (const file of files) {
    const specifier = `@snyder-tech/keiretsu/${file.slice(0, -3)}`;
    if (file.split('/').includes('internal')) await assert.rejects(import(specifier), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
    else await import(specifier);
  }
  await assert.rejects(import('@snyder-tech/keiretsu'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
});

test('documented money calculation and stable strict JSON errors', () => {
  const result = Effect.runSync(
    Money.fromDecimal({
      amount: Decimal.fromScaled(Decimal.multiply(Decimal.toScaled('2000000'), Decimal.toScaled('1.15'))),
      currency: Schema.decodeSync(Currency.CurrencyCode)('PKR'),
      table: Currency.iso4217,
      rounding: 'half-away-from-zero',
    }),
  );
  assert.deepEqual(result, { minor: '230000000', currency: 'PKR' });
  assert.equal(Effect.runSync(Effect.flip(parseStrict('{"a":1,"a":2}'))).code, 'core.json-duplicate-member');
});

test('exact inverse preserves half-even rounding', async () => {
  const content = {
    clauseDigest: 'a'.repeat(64),
    purpose: 'contract',
    requestedDate: '2026-09-30',
    rateDate: '2026-09-30',
    base: 'USD',
    quote: 'PKR',
    rate: '6',
    status: 'final',
    fallbackApplied: false,
    rounding: 'half-even',
    observationSetDigest: 'b'.repeat(64),
    revision: 1,
    legs: [{ source: 'fixed', base: 'USD', quote: 'PKR', unit: 1, rate: '6', orientation: 'multiply', rateDate: '2026-09-30', status: 'final', revisions: [], observationDigests: [] }],
  };
  const snapshot = await Effect.runPromise(seal(content));
  const result = Effect.runSync(
    convertScaled({ amount: Decimal.toScaled('1.59'), currency: Schema.decodeSync(Currency.CurrencyCode)('PKR'), snapshot, table: Currency.iso4217, direction: 'reverse', rounding: 'half-even' }),
  );
  assert.equal(result.minor, '26');
});
