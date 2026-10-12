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

import { EntityId, PersonId } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { Situs } from '../core/Country.ts';
import { EngagementId, EventId } from '../core/Ids.ts';
import { IsoDate } from '../core/Temporal.ts';

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
/** @since 0.1.0 @category models */
export type LabourFact = typeof LabourFact.Type;
