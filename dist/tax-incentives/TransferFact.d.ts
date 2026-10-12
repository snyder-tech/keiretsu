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
/**
 * Leg kind: a known billing basis or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LegKind: Schema.Union<readonly [Schema.Literals<readonly ["cost-plus", "time-and-materials", "fixed-fee", "value-based", "pass-through", "resale"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type LegKind = typeof LegKind.Type;
/**
 * Transfer fact port.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TransferFact: Schema.Struct<{
    readonly eventId: Schema.brand<Schema.String, "keiretsu/EventId">;
    readonly legId: Schema.optional<Schema.brand<Schema.String, "keiretsu/LegId">>;
    readonly agreementId: Schema.optional<Schema.brand<Schema.String, "keiretsu/AgreementId">>;
    readonly fromEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly toEntity: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly legKind: Schema.Union<readonly [Schema.Literals<readonly ["cost-plus", "time-and-materials", "fixed-fee", "value-based", "pass-through", "resale"]>, Schema.String]>;
}>;
/** @since 0.1.0 @category models */
export type TransferFact = typeof TransferFact.Type;
//# sourceMappingURL=TransferFact.d.ts.map