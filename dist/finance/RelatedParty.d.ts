/**
 * Related-party determinations per ordered pair and jurisdiction.
 *
 * Each control test (equity, board appointment, de facto control, loan or
 * supply dependence, common control) records its outcome, the jurisdiction
 * rule it applies (e.g. `in-s92A`, `pk-s85`, `us-482-control`, `oecd-art9`)
 * and evidence. The result is `associated`, `unrelated` or `undetermined`;
 * `undetermined` holds invoicing and close sign-off for the pair. The
 * result is a human determination — {@link candidateResult} only suggests one.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { Actor } from '../core/Actor.ts';
import { CountryCode } from '../core/Country.ts';
import { type ValidationIssue } from '../core/Issue.ts';
import { IsoDate } from '../core/Temporal.ts';
/** @since 0.1.0 @category schemas */
export declare const DeterminationId: Schema.brand<Schema.String, "keiretsu/RelatedPartyDeterminationId">;
export { PartyRef } from '../core/PartyRef.ts';
import { PartyRef } from '../core/PartyRef.ts';
/**
 * Kinds of control test. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ControlTestKind: Schema.Union<readonly [Schema.Literals<readonly ["equity", "board-appointment", "de-facto-control", "loan-dependence", "supply-dependence", "common-control"]>, Schema.String]>;
/**
 * One control test.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ControlTest: Schema.Struct<{
    readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["equity", "board-appointment", "de-facto-control", "loan-dependence", "supply-dependence", "common-control"]>, Schema.String]>;
    readonly outcome: Schema.Literals<readonly ["met", "not-met", "unknown"]>;
    /** Jurisdiction rule code from a cited data pack, e.g. `in-s92A`. */
    readonly rule: Schema.NonEmptyString;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
}>;
/** @since 0.1.0 @category models */
export type ControlTest = typeof ControlTest.Type;
/**
 * Determination result.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RelationResult: Schema.Literals<readonly ["associated", "unrelated", "undetermined"]>;
/** @since 0.1.0 @category models */
export type RelationResult = typeof RelationResult.Type;
/**
 * Candidate result from test outcomes: any `met` → associated; any `unknown` → undetermined; else unrelated.
 *
 * @since 0.1.0
 * @category derivations
 */
export declare const candidateResult: (tests: ReadonlyArray<ControlTest>) => RelationResult;
/**
 * Consistency of a result with its tests.
 *
 * Codes: `related-party.met-without-evidence`, `related-party.result-contradicts-tests`, `related-party.human-determination`.
 *
 * @since 0.1.0
 * @category checks
 */
export declare const validateDetermination: (determination: {
    readonly tests: ReadonlyArray<ControlTest>;
    readonly result: RelationResult;
    readonly determinedBy?: Actor | undefined;
}) => ReadonlyArray<ValidationIssue>;
/**
 * A related-party determination for an ordered pair in one jurisdiction.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const RelatedPartyDetermination: Schema.Struct<{
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly from: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly to: Schema.TaggedUnion<{
        readonly entity: Schema.TaggedStruct<"entity", {
            readonly entityId: Schema.brand<Schema.String, "keiretsu/EntityId">;
        }>;
        readonly counterparty: Schema.TaggedStruct<"counterparty", {
            readonly counterpartyId: Schema.brand<Schema.String, "keiretsu/CounterpartyId">;
        }>;
    }>;
    readonly jurisdiction: Schema.brand<Schema.String, "keiretsu/CountryCode">;
    readonly tests: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.Union<readonly [Schema.Literals<readonly ["equity", "board-appointment", "de-facto-control", "loan-dependence", "supply-dependence", "common-control"]>, Schema.String]>;
        readonly outcome: Schema.Literals<readonly ["met", "not-met", "unknown"]>;
        /** Jurisdiction rule code from a cited data pack, e.g. `in-s92A`. */
        readonly rule: Schema.NonEmptyString;
        readonly evidence: Schema.$Array<Schema.Struct<{
            readonly kind: Schema.NonEmptyString;
            readonly ref: Schema.NonEmptyString;
            readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
        }>>;
    }>>;
    readonly result: Schema.Literals<readonly ["associated", "unrelated", "undetermined"]>;
    readonly determinedBy: Schema.optional<Schema.TaggedUnion<{
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
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
    readonly recordedAt: Schema.brand<Schema.String, "keiretsu/Instant">;
    readonly revision: Schema.Number;
    readonly supersedesDigest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    readonly id: Schema.brand<Schema.String, "keiretsu/RelatedPartyDeterminationId">;
}>;
/** @since 0.1.0 @category models */
export type RelatedPartyDetermination = typeof RelatedPartyDetermination.Type;
/**
 * Status of a pair on a date, with a hold when undetermined or missing.
 *
 * Code: `related-party.undetermined` (hold).
 *
 * @since 0.1.0
 * @category lookups
 */
export declare const pairStatus: (options: {
    readonly determinations: ReadonlyArray<RelatedPartyDetermination>;
    readonly from: PartyRef;
    readonly to: PartyRef;
    readonly jurisdiction: CountryCode;
    readonly date: IsoDate;
}) => {
    readonly result: RelationResult;
    readonly issues: ReadonlyArray<ValidationIssue>;
};
//# sourceMappingURL=RelatedParty.d.ts.map