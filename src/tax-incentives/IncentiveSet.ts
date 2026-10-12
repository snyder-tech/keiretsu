/**
 * The input set screened together: regimes, entity profiles, components,
 * labour/wage/transfer facts from other packages, slices, funding assessments,
 * controlled groups, attributions and base-period facts.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { IsoDate } from '../core/Temporal.ts';

import { BasePeriodFact } from './BasePeriodFact.ts';
import { BusinessComponent } from './BusinessComponent.ts';
import { ClaimantAttribution } from './ClaimantAttribution.ts';
import { ControlledGroupYear } from './ControlledGroupYear.ts';
import { EntityTaxProfile } from './EntityTaxProfile.ts';
import { FundingAssessment } from './FundingAssessment.ts';
import { IncentiveRegime } from './IncentiveRegime.ts';
import { LabourFact } from './LabourFact.ts';
import { TaxActivitySlice } from './TaxActivitySlice.ts';
import { TransferFact } from './TransferFact.ts';
import { WageFact } from './WageFact.ts';

/**
 * An incentive screening set.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IncentiveSet = Schema.Struct({
  /** The date the screen is run for (citation staleness is measured to it). */
  asOf: IsoDate,
  regimes: Schema.Array(IncentiveRegime),
  entities: Schema.Array(EntityTaxProfile),
  components: Schema.Array(BusinessComponent),
  labour: Schema.Array(LabourFact),
  wages: Schema.Array(WageFact),
  transfers: Schema.Array(TransferFact),
  slices: Schema.Array(TaxActivitySlice),
  fundings: Schema.Array(FundingAssessment),
  groups: Schema.Array(ControlledGroupYear),
  attributions: Schema.Array(ClaimantAttribution),
  basePeriods: Schema.Array(BasePeriodFact),
});
/** @since 0.1.0 @category models */
export type IncentiveSet = typeof IncentiveSet.Type;

/**
 * Lookup tables over a set (first record wins on duplicate ids; duplicates are reported by the screen).
 *
 * @since 0.1.0
 * @category models
 */
export interface SetIndex {
  readonly set: IncentiveSet;
  readonly regimes: ReadonlyMap<string, IncentiveRegime>;
  readonly entities: ReadonlyMap<string, EntityTaxProfile>;
  readonly components: ReadonlyMap<string, BusinessComponent>;
  readonly labour: ReadonlyMap<string, LabourFact>;
  readonly slices: ReadonlyMap<string, TaxActivitySlice>;
  readonly fundings: ReadonlyMap<string, FundingAssessment>;
  readonly groups: ReadonlyMap<string, ControlledGroupYear>;
  readonly transfersByEvent: ReadonlyMap<string, ReadonlyArray<TransferFact>>;
}

const byKey = <A>(items: ReadonlyArray<A>, key: (item: A) => string): ReadonlyMap<string, A> => {
  const map = new Map<string, A>();
  for (const item of items) if (!map.has(key(item))) map.set(key(item), item);
  return map;
};

const groupBy = <A>(items: ReadonlyArray<A>, key: (item: A) => string): ReadonlyMap<string, ReadonlyArray<A>> => {
  const map = new Map<string, Array<A>>();
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return map;
};

/**
 * Build the lookup tables.
 *
 * @since 0.1.0
 * @category constructors
 */
export const indexSet = (set: IncentiveSet): SetIndex => ({
  set,
  regimes: byKey(set.regimes, (regime) => regime.id),
  entities: byKey(set.entities, (entity) => entity.entityId),
  components: byKey(set.components, (component) => component.id),
  labour: byKey(set.labour, (fact) => fact.eventId),
  slices: byKey(set.slices, (slice) => slice.id),
  fundings: byKey(set.fundings, (funding) => funding.id),
  groups: byKey(set.groups, (group) => group.id),
  transfersByEvent: groupBy(set.transfers, (transfer) => transfer.eventId),
});
