/**
 * Ownership edges: who holds equity in a declared entity, in basis points.
 *
 * Ownership and control are separate edges and neither is inferred from the
 * other (ASC 810, IFRS 10). Owners may be entities, counterparties or people,
 * so trusts and individuals can hold equity and joint 50/50 ownership is
 * representable.
 *
 * @since 0.1.0
 * @module
 */
import { Assurance } from '../core/Envelope.ts';
import { Schema } from 'effect';
/**
 * Basis points, 0–10,000.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ShareBps: Schema.Number;
/**
 * An ownership edge as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const OwnershipEdge: Schema.Struct<{
    readonly owner: Schema.NonEmptyString;
    readonly owned: Schema.NonEmptyString;
    readonly shareBps: Schema.Number;
    readonly votingBps: Schema.optional<Schema.Number>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type OwnershipEdge = typeof OwnershipEdge.Type;
/** @since 0.1.0 @category models */
export type OwnershipEdgeInput = typeof OwnershipEdge.Encoded;
/**
 * Edges in force on `date`, excluding `unverified` ones unless asked.
 *
 * @since 0.1.0
 * @category queries
 */
export declare const activeEdges: <E extends {
    readonly validFrom: string;
    readonly validTo?: string | undefined;
    readonly assurance: Assurance;
}>(edges: ReadonlyArray<E>, options: {
    readonly date: string;
    readonly includeUnverified?: boolean | undefined;
}) => ReadonlyArray<E>;
//# sourceMappingURL=Ownership.d.ts.map