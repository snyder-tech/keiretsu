export { EntityId, PersonId } from './Actor.ts';
export type { EntityId as EntityIdType, PersonId as PersonIdType } from './Actor.ts';
export { CounterpartyId } from './PartyRef.ts';
/** Person ↔ employer engagement. @since 0.1.0 @category schemas */
export declare const EngagementId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/EngagementId">;
/** Economic event (labour, compute, delivery, licence use, cash). @since 0.1.0 @category schemas */
export declare const EventId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/EventId">;
/** Work order or statement-of-work line. @since 0.1.0 @category schemas */
export declare const WorkOrderId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/WorkOrderId">;
/** Catalog offering (product, service, license, subscription, capability, bundle). @since 0.1.0 @category schemas */
export declare const OfferingId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/OfferingId">;
/** Master agreement or schedule. @since 0.1.0 @category schemas */
export declare const AgreementId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/AgreementId">;
/** Transfer route. @since 0.1.0 @category schemas */
export declare const RouteId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/RouteId">;
/** Transfer leg. @since 0.1.0 @category schemas */
export declare const LegId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/LegId">;
/** Charge line (a claim on one leg for one period). @since 0.1.0 @category schemas */
export declare const ChargeId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/ChargeId">;
/** Commercial document (invoice, credit note, PO, remittance…). @since 0.1.0 @category schemas */
export declare const DocumentId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/DocumentId">;
/** Cost object (project, work order, customer, product, capability, internal investment). @since 0.1.0 @category schemas */
export declare const CostObjectId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/CostObjectId">;
/** Rule (cost-base definition, allocation rule, TP method, regime rule). @since 0.1.0 @category schemas */
export declare const RuleId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/RuleId">;
/** Snapshot (rates, FX, cost). @since 0.1.0 @category schemas */
export declare const SnapshotId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/SnapshotId">;
/** Journal entry. @since 0.1.0 @category schemas */
export declare const JournalEntryId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/JournalEntryId">;
/** Incentive regime in a data pack. @since 0.1.0 @category schemas */
export declare const RegimeId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/RegimeId">;
/** Tax attribution record (slice, funding assessment, claimant). @since 0.1.0 @category schemas */
export declare const AttributionId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/AttributionId">;
/** Exchange bundle. @since 0.1.0 @category schemas */
export declare const BundleId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/BundleId">;
/** Derivation receipt explaining how an output was computed. @since 0.1.0 @category schemas */
export declare const DerivationId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/DerivationId">;
/** @since 0.1.0 @category models */
/** @since 0.1.0 @category models */
export type EngagementId = typeof EngagementId.Type;
/** @since 0.1.0 @category models */
export type EventId = typeof EventId.Type;
/** @since 0.1.0 @category models */
export type WorkOrderId = typeof WorkOrderId.Type;
/** @since 0.1.0 @category models */
export type OfferingId = typeof OfferingId.Type;
/** @since 0.1.0 @category models */
export type AgreementId = typeof AgreementId.Type;
/** @since 0.1.0 @category models */
export type RouteId = typeof RouteId.Type;
/** @since 0.1.0 @category models */
export type LegId = typeof LegId.Type;
/** @since 0.1.0 @category models */
export type ChargeId = typeof ChargeId.Type;
/** @since 0.1.0 @category models */
export type DocumentId = typeof DocumentId.Type;
/** @since 0.1.0 @category models */
export type CostObjectId = typeof CostObjectId.Type;
/** @since 0.1.0 @category models */
export type RuleId = typeof RuleId.Type;
/** @since 0.1.0 @category models */
export type SnapshotId = typeof SnapshotId.Type;
/** @since 0.1.0 @category models */
export type JournalEntryId = typeof JournalEntryId.Type;
/** @since 0.1.0 @category models */
export type RegimeId = typeof RegimeId.Type;
/** @since 0.1.0 @category models */
export type AttributionId = typeof AttributionId.Type;
/** @since 0.1.0 @category models */
export type BundleId = typeof BundleId.Type;
/** @since 0.1.0 @category models */
export type DerivationId = typeof DerivationId.Type;
/** Human decision accepting delivered work. @since 0.1.0 @category schemas */
export declare const AcceptanceId: import("effect/Schema").brand<import("effect/Schema").String, "keiretsu/AcceptanceId">;
/** @since 0.1.0 @category models */
export type AcceptanceId = typeof AcceptanceId.Type;
//# sourceMappingURL=Ids.d.ts.map