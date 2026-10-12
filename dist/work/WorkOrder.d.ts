/**
 * Work orders: authorisation records for planned work. Scope lines carry
 * budget minutes; approval follows an adopter-declared chain with separation
 * of duties, or a standing authority a human granted. No prices: pricing
 * belongs to the commerce package.
 *
 * @since 0.1.0
 * @module
 */
import { type HumanActor, type HumanRequired } from '../core/Actor.ts';
import { Instant } from '../core/Temporal.ts';
import { Effect, Schema } from 'effect';
import { type ApprovalChain } from './ApprovalChain.ts';
/**
 * Non-negative integer minutes for budgets.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const BudgetMinutes: Schema.Number;
/**
 * One line of scope.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ScopeLine: Schema.Struct<{
    readonly lineId: Schema.NonEmptyString;
    readonly description: Schema.NonEmptyString;
    readonly budgetMinutes: Schema.Number;
    readonly activity: Schema.optional<Schema.String>;
    readonly expectedUnits: Schema.optional<Schema.Struct<{
        readonly valueUnit: Schema.String;
        readonly units: Schema.brand<Schema.String, "keiretsu/Decimal">;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type ScopeLine = typeof ScopeLine.Type;
/**
 * One stage approval.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const Approval: Schema.Struct<{
    readonly stage: Schema.String;
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
export type Approval = typeof Approval.Type;
/**
 * Pending, explicitly approved along a chain, or authorised under a standing authority.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkOrderAuthorization: Schema.TaggedUnion<{
    readonly explicit: Schema.TaggedStruct<"explicit", {
        readonly chain: Schema.String;
        readonly approvals: Schema.NonEmptyArray<Schema.Struct<{
            readonly stage: Schema.String;
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
    readonly pending: Schema.TaggedStruct<"pending", {}>;
    readonly standing: Schema.TaggedStruct<"standing", {
        readonly authorityId: Schema.brand<Schema.String, "keiretsu/StandingAuthorityId">;
        readonly authorityDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
        readonly appliedBy: Schema.TaggedUnion<{
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
}>;
/** @since 0.1.0 @category models */
export type WorkOrderAuthorization = typeof WorkOrderAuthorization.Type;
/**
 * A work order: who asks whom to do what, within what budget, judged by which criteria.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const WorkOrder: Schema.Struct<{
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
    readonly statementOfWork: Schema.optional<Schema.Struct<{
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
    readonly requester: Schema.TaggedUnion<{
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
    readonly draftedBy: Schema.optional<Schema.TaggedUnion<{
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
    }>>;
    readonly requestingParty: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly performer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly scope: Schema.NonEmptyArray<Schema.Struct<{
        readonly lineId: Schema.NonEmptyString;
        readonly description: Schema.NonEmptyString;
        readonly budgetMinutes: Schema.Number;
        readonly activity: Schema.optional<Schema.String>;
        readonly expectedUnits: Schema.optional<Schema.Struct<{
            readonly valueUnit: Schema.String;
            readonly units: Schema.brand<Schema.String, "keiretsu/Decimal">;
        }>>;
    }>>;
    readonly budgetMinutes: Schema.Number;
    readonly acceptanceCriteriaDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
    readonly authorization: Schema.TaggedUnion<{
        readonly explicit: Schema.TaggedStruct<"explicit", {
            readonly chain: Schema.String;
            readonly approvals: Schema.NonEmptyArray<Schema.Struct<{
                readonly stage: Schema.String;
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
        readonly pending: Schema.TaggedStruct<"pending", {}>;
        readonly standing: Schema.TaggedStruct<"standing", {
            readonly authorityId: Schema.brand<Schema.String, "keiretsu/StandingAuthorityId">;
            readonly authorityDigest: Schema.brand<Schema.String, "keiretsu/Sha256">;
            readonly appliedBy: Schema.TaggedUnion<{
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
    }>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/WorkOrderId">;
}>;
/** @since 0.1.0 @category models */
export type WorkOrder = typeof WorkOrder.Type;
declare const SeparationOfDuties_base: Schema.Class<SeparationOfDuties, Schema.TaggedStruct<"SeparationOfDuties", {
    readonly workOrderId: Schema.String;
    readonly personId: Schema.String;
    readonly reason: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * A person approved a work order they requested or drafted, or a second stage of it.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class SeparationOfDuties extends SeparationOfDuties_base {
}
declare const NothingToApprove_base: Schema.Class<NothingToApprove, Schema.TaggedStruct<"NothingToApprove", {
    readonly workOrderId: Schema.String;
}>, import("effect/Cause").YieldableError>;
/**
 * Every stage of the chain is already approved, or the order is under standing authority.
 *
 * @since 0.1.0
 * @category errors
 */
export declare class NothingToApprove extends NothingToApprove_base {
}
/**
 * People who may not approve an order: its requester and the person accountable for its drafting.
 *
 * @since 0.1.0
 * @category accessors
 */
export declare const conflictedPeople: (order: WorkOrder) => ReadonlyArray<string>;
/**
 * A human approves the next stage of the chain.
 *
 * @since 0.1.0
 * @category transitions
 */
export declare const approve: (options: {
    readonly order: WorkOrder;
    readonly chain: ApprovalChain;
    readonly by: HumanActor;
    readonly at: Instant;
}) => Effect.Effect<WorkOrder, HumanRequired | SeparationOfDuties | NothingToApprove>;
/**
 * Whether the order is fully approved along `chain`, in order, by distinct humans.
 *
 * @since 0.1.0
 * @category predicates
 */
export declare const isFullyApproved: (order: WorkOrder, chain: ApprovalChain) => boolean;
export {};
//# sourceMappingURL=WorkOrder.d.ts.map