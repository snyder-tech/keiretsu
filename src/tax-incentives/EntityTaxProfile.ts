/**
 * Port: the tax facts this package needs about a legal entity. Supplied by
 * `@snyder-tech/keiretsu/entity` (entity timeline, fiscal calendar,
 * registrations); declared here narrowly so the packages stay decoupled.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { EntityId } from '../core/Actor.ts';
import { Situs } from '../core/Country.ts';
import { CurrencyCode } from '../core/Currency.ts';
import { EvidenceRef } from '../core/Envelope.ts';
import { IsoDate } from '../core/Temporal.ts';

import { FiscalYearEndMonth } from './TaxYear.ts';

/**
 * A registration or approval an entity holds (e.g. a software-export board
 * registration or an in-house R&D approval), with its validity and evidence.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Registration = Schema.Struct({
  kind: Schema.String.check(Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  evidence: Schema.Array(EvidenceRef),
});
/** @since 0.1.0 @category models */
export type Registration = typeof Registration.Type;

/**
 * Entity tax profile port.
 *
 * @since 0.1.0
 * @category schemas
 */
export const EntityTaxProfile = Schema.Struct({
  entityId: EntityId,
  /** Where the entity is resident for tax. */
  situs: Situs,
  functionalCurrency: CurrencyCode,
  fiscalYearEndMonth: FiscalYearEndMonth,
  /** Income flows through to owners (partnership, S corporation, disregarded entity). */
  passThrough: Schema.Boolean,
  registrations: Schema.Array(Registration),
});
/** @since 0.1.0 @category models */
export type EntityTaxProfile = typeof EntityTaxProfile.Type;
