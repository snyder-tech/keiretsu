/**
 * Cross-package record identities. Records in one package refer to records in
 * another by id (and digest), never by embedding them, so packages stay
 * decoupled and each brand is defined exactly once.
 *
 * @since 0.1.0
 * @module
 */
import { brand } from './Id.ts';

export { EntityId, PersonId } from './Actor.ts';
export type { EntityId as EntityIdType, PersonId as PersonIdType } from './Actor.ts';

export { CounterpartyId } from './PartyRef.ts';
/** Person ↔ employer engagement. @since 0.1.0 @category schemas */
export const EngagementId = brand('keiretsu/EngagementId');
/** Economic event (labour, compute, delivery, licence use, cash). @since 0.1.0 @category schemas */
export const EventId = brand('keiretsu/EventId');
/** Work order or statement-of-work line. @since 0.1.0 @category schemas */
export const WorkOrderId = brand('keiretsu/WorkOrderId');
/** Catalog offering (product, service, license, subscription, capability, bundle). @since 0.1.0 @category schemas */
export const OfferingId = brand('keiretsu/OfferingId');
/** Master agreement or schedule. @since 0.1.0 @category schemas */
export const AgreementId = brand('keiretsu/AgreementId');
/** Transfer route. @since 0.1.0 @category schemas */
export const RouteId = brand('keiretsu/RouteId');
/** Transfer leg. @since 0.1.0 @category schemas */
export const LegId = brand('keiretsu/LegId');
/** Charge line (a claim on one leg for one period). @since 0.1.0 @category schemas */
export const ChargeId = brand('keiretsu/ChargeId');
/** Commercial document (invoice, credit note, PO, remittance…). @since 0.1.0 @category schemas */
export const DocumentId = brand('keiretsu/DocumentId');
/** Cost object (project, work order, customer, product, capability, internal investment). @since 0.1.0 @category schemas */
export const CostObjectId = brand('keiretsu/CostObjectId');
/** Rule (cost-base definition, allocation rule, TP method, regime rule). @since 0.1.0 @category schemas */
export const RuleId = brand('keiretsu/RuleId');
/** Snapshot (rates, FX, cost). @since 0.1.0 @category schemas */
export const SnapshotId = brand('keiretsu/SnapshotId');
/** Journal entry. @since 0.1.0 @category schemas */
export const JournalEntryId = brand('keiretsu/JournalEntryId');
/** Incentive regime in a data pack. @since 0.1.0 @category schemas */
export const RegimeId = brand('keiretsu/RegimeId');
/** Tax attribution record (slice, funding assessment, claimant). @since 0.1.0 @category schemas */
export const AttributionId = brand('keiretsu/AttributionId');
/** Exchange bundle. @since 0.1.0 @category schemas */
export const BundleId = brand('keiretsu/BundleId');
/** Derivation receipt explaining how an output was computed. @since 0.1.0 @category schemas */
export const DerivationId = brand('keiretsu/DerivationId');

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
export const AcceptanceId = brand('keiretsu/AcceptanceId');
/** @since 0.1.0 @category models */
export type AcceptanceId = typeof AcceptanceId.Type;
