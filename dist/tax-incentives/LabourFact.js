/**
 * Port: one attested labour event, as recorded by
 * `@snyder-tech/keiretsu/work`. Tax attribution reads the event and the
 * employer named on it — never the billing route — so re-routing money cannot
 * move where the work happened or who paid the wages.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId, PersonId } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { Situs } from "../core/Country.js";
import { EngagementId, EventId } from "../core/Ids.js";
import { IsoDate } from "../core/Temporal.js";
/**
 * Labour fact port.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LabourFact = Schema.Struct({
    eventId: EventId,
    /** Digest of the attested event revision the slices were cut from. */
    eventDigest: Sha256,
    personId: PersonId,
    engagementId: EngagementId,
    /** Legal employer (wage payer) for the engagement on the work date. */
    employer: EntityId,
    /** Where the work was physically performed. */
    situs: Situs,
    workDate: IsoDate,
    minutes: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    aiAssisted: Schema.Boolean,
});
//# sourceMappingURL=LabourFact.js.map