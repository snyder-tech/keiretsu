/**
 * Port: a transfer leg that moved minutes or charges for an event from one
 * entity to another. Supplied by `@snyder-tech/keiretsu/commerce`. Legs never
 * change where work happened or who paid the wages; this package only uses
 * them to find the payer side of an agreement.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { AgreementId, EventId, LegId } from "../core/Ids.js";
/**
 * Leg kind: a known billing basis or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LegKind = Schema.Union([
    Schema.Literals(['cost-plus', 'time-and-materials', 'fixed-fee', 'value-based', 'pass-through', 'resale']),
    Schema.String.check(Schema.isPattern(/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/)),
]);
/**
 * Transfer fact port.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TransferFact = Schema.Struct({
    eventId: EventId,
    legId: Schema.optional(LegId),
    agreementId: Schema.optional(AgreementId),
    fromEntity: EntityId,
    toEntity: EntityId,
    legKind: LegKind,
});
//# sourceMappingURL=TransferFact.js.map