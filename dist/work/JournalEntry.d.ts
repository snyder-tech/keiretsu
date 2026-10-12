/**
 * The first rung of the trust ladder: an append-only work journal.
 *
 * People, agents and hooks write journal entries; only the owner affirms them.
 * Corrections and retractions are new entries that name what they supersede.
 * Journals are owner-only: they never enter exchange bundles (see `Disclosure`).
 * Content stays with the owner; the wire carries its digest.
 *
 * @since 0.1.0
 * @module
 */
import { type HumanActor, type HumanRequired } from '../core/Actor.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
import { NotOwner } from './NotOwner.ts';
/**
 * Journal entry kinds.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const JournalKind: Schema.Union<readonly [Schema.Literals<readonly ["worklog", "decision", "blocker", "plan", "estimate", "handoff", "ai-session", "correction", "retract"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type JournalKind = typeof JournalKind.Type;
/**
 * Who wrote the entry (W3C PROV `wasAttributedTo`) and, for agents, with what.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const JournalProvenance: Schema.Struct<{
    readonly origin: Schema.Literals<readonly ["human", "agent", "hook"]>;
    readonly actor: Schema.TaggedUnion<{
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
    readonly model: Schema.optional<Schema.NonEmptyString>;
    readonly promptVersion: Schema.optional<Schema.NonEmptyString>;
    readonly inputDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
}>;
/** @since 0.1.0 @category models */
export type JournalProvenance = typeof JournalProvenance.Type;
/**
 * The owner's affirmation that an entry is a true account of their work.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Affirmation: Schema.Struct<{
    readonly by: Schema.TaggedUnion<{
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
    readonly at: Schema.brand<Schema.String, "keiretsu/Instant">;
}>;
/** @since 0.1.0 @category models */
export type Affirmation = typeof Affirmation.Type;
/**
 * One append-only journal entry.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const JournalEntry: Schema.Struct<{
    readonly id: Schema.brand<Schema.String, "keiretsu/JournalEntryId">;
    readonly owner: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["worklog", "decision", "blocker", "plan", "estimate", "handoff", "ai-session", "correction", "retract"]>, Schema.String]>;
    readonly supersedes: Schema.optional<Schema.brand<Schema.String, "keiretsu/JournalEntryId">>;
    readonly provenance: Schema.Struct<{
        readonly origin: Schema.Literals<readonly ["human", "agent", "hook"]>;
        readonly actor: Schema.TaggedUnion<{
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
        readonly model: Schema.optional<Schema.NonEmptyString>;
        readonly promptVersion: Schema.optional<Schema.NonEmptyString>;
        readonly inputDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>;
    readonly links: Schema.$Array<Schema.Struct<{
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
    }>>;
    readonly workDate: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly effortMinutes: Schema.optional<Schema.Number>;
    readonly contentDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly computeEventIds: Schema.$Array<Schema.brand<Schema.String, "keiretsu/EventId">>;
    readonly affirmation: Schema.optional<Schema.Struct<{
        readonly by: Schema.TaggedUnion<{
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
        readonly at: Schema.brand<Schema.String, "keiretsu/Instant">;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type JournalEntry = typeof JournalEntry.Type;
declare const AlreadyAffirmed_base: Schema.Class<AlreadyAffirmed, Schema.TaggedStruct<"AlreadyAffirmed", {
    readonly entryId: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The entry already carries an affirmation.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class AlreadyAffirmed extends AlreadyAffirmed_base {
}
/**
 * The owner affirms an entry. Agents and other people cannot.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const affirm: (options: {
    readonly entry: JournalEntry;
    readonly by: HumanActor;
    readonly at: Instant;
}) => Effect.Effect<JournalEntry, HumanRequired | NotOwner | AlreadyAffirmed>;
/**
 * Whether an entry is affirmed by its owner.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isAffirmed: (entry: JournalEntry) => boolean;
export {};
//# sourceMappingURL=JournalEntry.d.ts.map