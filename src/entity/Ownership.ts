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
import { Assurance, EvidenceRef } from '../core/Envelope.ts';
import { contains, IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

/**
 * Basis points, 0–10,000.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ShareBps = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10_000 }));

/**
 * An ownership edge as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export const OwnershipEdge = Schema.Struct({
  owner: Schema.NonEmptyString,
  owned: Schema.NonEmptyString,
  shareBps: ShareBps,
  votingBps: Schema.optional(ShareBps),
  assurance: Assurance,
  evidence: Schema.Array(EvidenceRef),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
});
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
export const activeEdges = <E extends { readonly validFrom: string; readonly validTo?: string | undefined; readonly assurance: Assurance }>(
  edges: ReadonlyArray<E>,
  options: { readonly date: string; readonly includeUnverified?: boolean | undefined },
): ReadonlyArray<E> => edges.filter((edge) => contains(edge, options.date) && (options.includeUnverified === true || edge.assurance !== 'unverified'));
