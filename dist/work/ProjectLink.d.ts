/**
 * Bilateral project links: a work object owned by one entity joined to a work
 * object owned by another. A link becomes `active` only once a human acting for
 * each owner has accepted it.
 *
 * @since 0.1.0
 * @module
 */
import { type HumanActor, type HumanRequired } from '../core/Actor.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
/**
 * How the provider's work object relates to the recipient's.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ProjectLinkRelation: Schema.Union<readonly [Schema.Literals<readonly ["delivers-to", "subcontracts", "co-delivers"]>, Schema.String]>;
/** @since 0.1.0 @category models */
export type ProjectLinkRelation = typeof ProjectLinkRelation.Type;
/**
 * One owner's acceptance, by a person acting for that owner.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const LinkAcceptance: Schema.Struct<{
    readonly party: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
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
export type LinkAcceptance = typeof LinkAcceptance.Type;
/**
 * A bilateral link between two entities' work objects.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ProjectLink: Schema.Struct<{
    readonly provider: Schema.Struct<{
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
    readonly recipient: Schema.Struct<{
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
    readonly relation: Schema.Union<readonly [Schema.Literals<readonly ["delivers-to", "subcontracts", "co-delivers"]>, Schema.String]>;
    readonly state: Schema.Literals<readonly ["proposed", "active", "suspended", "revoked"]>;
    readonly acceptances: Schema.$Array<Schema.Struct<{
        readonly party: Schema.TaggedUnion<{
            readonly entity: Schema.TaggedStruct<"entity", {
                readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
            }>;
            readonly counterparty: Schema.TaggedStruct<"counterparty", {
                readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
            }>;
        }>;
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
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/ProjectLinkId">;
}>;
/** @since 0.1.0 @category models */
export type ProjectLink = typeof ProjectLink.Type;
declare const NotLinkParty_base: Schema.Class<NotLinkParty, Schema.TaggedStruct<"NotLinkParty", {
    readonly actingFor: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * The accepting person does not act for either owner.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NotLinkParty extends NotLinkParty_base {
}
/**
 * Record one owner's acceptance; the link activates when both owners have accepted.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const acceptLink: (options: {
    readonly link: ProjectLink;
    readonly by: HumanActor;
    readonly at: Instant;
}) => Effect.Effect<ProjectLink, HumanRequired | NotLinkParty>;
export {};
//# sourceMappingURL=ProjectLink.d.ts.map