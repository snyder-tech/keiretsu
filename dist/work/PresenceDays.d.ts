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
import { type IsoDate } from '../core/Temporal.ts';
import { type EconomicEvent } from './EconomicEvent.ts';
import { type PersonRef } from './PersonRef.ts';
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
/**
 * Derive presence days over a half-open period from the current revision of each labour event.
 *
 * @since 0.1.0
 * @category derivations
 */
export declare const presenceDays: (options: {
    readonly events: ReadonlyArray<EconomicEvent>;
    readonly person: PersonRef;
    readonly jurisdiction: Situs;
    readonly period: {
        readonly validFrom: string;
        readonly validTo?: string | undefined;
    };
}) => PresenceDays;
//# sourceMappingURL=PresenceDays.d.ts.map