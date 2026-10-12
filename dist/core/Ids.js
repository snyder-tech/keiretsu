/**
 * Cross-package record identities. Records in one package refer to records in
 * another by id (and digest), never by embedding them, so packages stay
 * decoupled and each brand is defined exactly once.
 *
 * @since 0.1.0
 * @module
 */
import { brand } from "./Id.js";
export { EntityId, PersonId } from "./Actor.js";
export { CounterpartyId } from "./PartyRef.js";
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
/** Human decision accepting delivered work. @since 0.1.0 @category schemas */
export const AcceptanceId = brand('keiretsu/AcceptanceId');
//# sourceMappingURL=Ids.js.map