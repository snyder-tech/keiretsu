/**
 * The second rung of the trust ladder: time an agent or system proposes from
 * journals, hooks, work orders or capture, which only its owner can promote
 * into an attested labour event.
 *
 * `promote` takes a {@link HumanActor} so agent code fails to compile, and
 * re-checks at runtime with `requireHuman` for wire-decoded actors.
 * Proposals are owner-only and never cross companies; only the promoted
 * labour event does, carrying the proposal's id and digest as lineage.
 *
 * @since 0.1.0
 * @module
 */
import { type HumanActor, type HumanRequired } from '../core/Actor.ts';
import { type CanonicalJsonError, type Sha256 } from '../core/CanonicalJson.ts';
import { type Situs } from '../core/Country.ts';
import { type EvidenceRef } from '../core/Envelope.ts';
import { type EngagementId, type EntityId, type EventId, type WorkOrderId } from '../core/Ids.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
import { type BillableIntent, type LabourEvent, type LocationEvidence, type Relationship } from './EconomicEvent.ts';
import { NotOwner } from './NotOwner.ts';
/**
 * Where a proposal came from.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ProposalSource: Schema.Union<readonly [Schema.Literals<readonly ["journal", "agent-hook", "work-order", "quickfill", "capture"]>, Schema.String]>;
/**
 * How minutes were attributed to the work object.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const AttributionMethod: Schema.Union<readonly [Schema.Literals<readonly ["explicit-link", "journal-inference", "calendar", "commit-history", "work-order-plan"]>, Schema.String]>;
/**
 * Attribution method and confidence in basis points (0–10,000).
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Attribution: Schema.Struct<{
    readonly method: Schema.Union<readonly [Schema.Literals<readonly ["explicit-link", "journal-inference", "calendar", "commit-history", "work-order-plan"]>, Schema.String]>;
    readonly confidenceBps: Schema.Number;
}>;
/** @since 0.1.0 @category models */
export type Attribution = typeof Attribution.Type;
/**
 * A proposed block of minutes for one owner, work date and work object.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const TimeProposal: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/TimeProposalId">;
    readonly owner: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly proposedBy: Schema.TaggedUnion<{
        readonly human: Schema.TaggedStruct<"human", {
            readonly personId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly actingFor: Schema.TaggedUnion<{
                readonly entity: Schema.TaggedStruct<"entity", {
                    readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
                }>;
                readonly counterparty: Schema.TaggedStruct<"counterparty", {
                    readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
                }>;
            }>;
        }>;
        readonly agent: Schema.TaggedStruct<"agent", {
            readonly agentId: Schema.NonEmptyString;
            readonly operatorPersonId: Schema.brand<Schema.String, "keiretsu/PersonId">;
            readonly model: Schema.optional<Schema.NonEmptyString>;
            readonly sessionId: Schema.optional<Schema.String>;
        }>;
        readonly system: Schema.TaggedStruct<"system", {
            readonly systemId: Schema.NonEmptyString;
        }>;
    }>;
    readonly proposedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly source: Schema.Union<readonly [Schema.Literals<readonly ["journal", "agent-hook", "work-order", "quickfill", "capture"]>, Schema.String]>;
    readonly journalIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/JournalEntryId">>;
    readonly workDate: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly timeZone: Schema.brand<Schema.String, "keiretsu/IanaTimeZone">;
    readonly minutes: Schema.Number;
    readonly workObject: Schema.Struct<{
        readonly system: Schema.String;
        readonly owner: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["customer-contract", "proposal", "statement-of-work", "project", "project-phase", "task", "work-item", "case", "work-order", "work-order-line", "milestone", "deliverable", "capability", "internal-investment"]>, Schema.String]>;
        readonly recordId: Schema.NonEmptyString;
        readonly label: Schema.optional<Schema.NonEmptyString>;
    }>;
    readonly activity: Schema.String;
    readonly attribution: Schema.Struct<{
        readonly method: Schema.Union<readonly [Schema.Literals<readonly ["explicit-link", "journal-inference", "calendar", "commit-history", "work-order-plan"]>, Schema.String]>;
        readonly confidenceBps: Schema.Number;
    }>;
    readonly state: Schema.Literals<readonly ["pending", "promoted", "dismissed"]>;
}>;
/** @since 0.1.0 @category models */
export type TimeProposal = typeof TimeProposal.Type;
declare const ProposalNotPending_base: Schema.Class<ProposalNotPending, Schema.TaggedStruct<"ProposalNotPending", {
    readonly proposalId: Schema.String;
    readonly state: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The proposal was already promoted or dismissed.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class ProposalNotPending extends ProposalNotPending_base {
}
/**
 * Facts the owner supplies when attesting: the engagement and where the work was done.
 *
 * @since 0.1.0
 * @category models
 */
export interface PromotionFacts {
    readonly eventId: typeof EventId.Type;
    readonly engagementId: typeof EngagementId.Type;
    readonly employer: typeof EntityId.Type;
    readonly relationship: typeof Relationship.Type;
    readonly situs: Situs;
    readonly locationEvidence: typeof LocationEvidence.Type;
    readonly billableIntent: typeof BillableIntent.Type;
    readonly evidence?: ReadonlyArray<EvidenceRef>;
    readonly evidenceDigests?: ReadonlyArray<Sha256>;
    readonly startedAt?: Instant;
    readonly workOrderId?: typeof WorkOrderId.Type;
    /** The owner may correct the proposed minutes when attesting. */
    readonly minutes?: number;
}
/**
 * Promoted labour event plus the proposal marked `promoted`.
 *
 * @since 0.1.0
 * @category models
 */
export interface Promotion {
    readonly event: LabourEvent;
    readonly proposal: TimeProposal;
}
/**
 * The owner promotes a pending proposal into an attested labour event.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const promote: (options: {
    readonly proposal: TimeProposal;
    readonly owner: HumanActor;
    readonly facts: PromotionFacts;
    readonly at: Instant;
}) => Effect.Effect<Promotion, HumanRequired | NotOwner | ProposalNotPending | CanonicalJsonError | Schema.SchemaError>;
/**
 * The owner dismisses a pending proposal.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const dismiss: (options: {
    readonly proposal: TimeProposal;
    readonly owner: HumanActor;
}) => Effect.Effect<TimeProposal, HumanRequired | NotOwner | ProposalNotPending>;
export {};
//# sourceMappingURL=TimeProposal.d.ts.map