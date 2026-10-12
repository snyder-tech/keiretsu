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
/**
 * Labour fact port.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LabourFact: Schema.Struct<{
    readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
    /** Digest of the attested event revision the slices were cut from. */
    readonly eventDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly engagementId: Schema.brand<Schema.String, "keiretsu/EngagementId">;
    /** Legal employer (wage payer) for the engagement on the work date. */
    readonly employer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    /** Where the work was physically performed. */
    readonly situs: Schema.Struct<{
        readonly country: Schema.brand<Schema.String, "keiretsu/CountryCode">;
        readonly subdivision: Schema.optional<Schema.brand<Schema.String, "keiretsu/SubdivisionCode">>;
    }>;
    readonly workDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly minutes: Schema.Number;
    readonly aiAssisted: Schema.Boolean;
}>;
/** @since 0.1.0 @category models */
export type LabourFact = typeof LabourFact.Type;
//# sourceMappingURL=LabourFact.d.ts.map