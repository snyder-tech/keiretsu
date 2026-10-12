/**
 * Presence days per person and jurisdiction, derived from labour events' work
 * situs. An input to service-PE and day-count screening in the tax package;
 * the work package draws no conclusion. Any attested minute on a civil date
 * counts that date once.
 *
 * @since 0.1.0
 * @module
 */
import type { Situs } from '../core/Country.ts';
import { contains, type IsoDate } from '../core/Temporal.ts';

import { currentRevisions, type EconomicEvent, labourEvents } from './EconomicEvent.ts';
import { type PersonRef, personKey } from './PersonRef.ts';

/**
 * Distinct civil dates on which the person worked in the jurisdiction.
 *
 * @since 0.1.0
 * @category models
 */
export interface PresenceDays {
  readonly person: string;
  readonly jurisdiction: Situs;
  readonly days: ReadonlyArray<IsoDate>;
  readonly count: number;
}

const inJurisdiction = (situs: Situs, jurisdiction: Situs): boolean =>
  situs.country === jurisdiction.country && (jurisdiction.subdivision === undefined || situs.subdivision === jurisdiction.subdivision);

/**
 * Derive presence days over a half-open period from the current revision of each labour event.
 *
 * @since 0.1.0
 * @category derivations
 */
export const presenceDays = (options: {
  readonly events: ReadonlyArray<EconomicEvent>;
  readonly person: PersonRef;
  readonly jurisdiction: Situs;
  readonly period: { readonly validFrom: string; readonly validTo?: string | undefined };
}): PresenceDays => {
  const key = personKey(options.person);
  const days = new Set<IsoDate>();
  for (const event of labourEvents(currentRevisions(options.events))) {
    if (personKey(event.person) === key && inJurisdiction(event.situs, options.jurisdiction) && contains(options.period, event.workDate)) days.add(event.workDate);
  }
  const sorted = [...days].sort();
  return { person: key, jurisdiction: options.jurisdiction, days: sorted, count: sorted.length };
};
