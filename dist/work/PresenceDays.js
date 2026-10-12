import { contains } from "../core/Temporal.js";
import { currentRevisions, labourEvents } from "./EconomicEvent.js";
import { personKey } from "./PersonRef.js";
const inJurisdiction = (situs, jurisdiction) => situs.country === jurisdiction.country && (jurisdiction.subdivision === undefined || situs.subdivision === jurisdiction.subdivision);
/**
 * Derive presence days over a half-open period from the current revision of each labour event.
 *
 * @since 0.1.0
 * @category derivations
 */
export const presenceDays = (options) => {
    const key = personKey(options.person);
    const days = new Set();
    for (const event of labourEvents(currentRevisions(options.events))) {
        if (personKey(event.person) === key && inJurisdiction(event.situs, options.jurisdiction) && contains(options.period, event.workDate))
            days.add(event.workDate);
    }
    const sorted = [...days].sort();
    return { person: key, jurisdiction: options.jurisdiction, days: sorted, count: sorted.length };
};
//# sourceMappingURL=PresenceDays.js.map