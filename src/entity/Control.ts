/**
 * Control edges: who controls a declared entity, to what extent and on what bases.
 *
 * Scope follows ASC 810 / IFRS 10 (full), IFRS 11 (joint) and IAS 28 / ASC 323
 * (significant influence). A control edge with an `equity` basis needs a
 * matching ownership edge; control is never inferred from brand, payer, books
 * system or shared staff.
 *
 * @since 0.1.0
 * @module
 */
import { Assurance, EvidenceRef } from '../core/Envelope.ts';
import { IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

/** @since 0.1.0 @category schemas */
export const ControlScope = Schema.Literals(['full', 'limited', 'joint', 'significant-influence']);
/** @since 0.1.0 @category models */
export type ControlScope = typeof ControlScope.Type;

/** @since 0.1.0 @category schemas */
export const ControlBasis = Schema.Literals(['equity', 'contractual', 'governance', 'operational', 'potential-voting']);

/**
 * A control edge as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ControlEdge = Schema.Struct({
  controller: Schema.NonEmptyString,
  controlled: Schema.NonEmptyString,
  scope: ControlScope,
  bases: Schema.NonEmptyArray(ControlBasis),
  assurance: Assurance,
  evidence: Schema.Array(EvidenceRef),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
});
/** @since 0.1.0 @category models */
export type ControlEdge = typeof ControlEdge.Type;
/** @since 0.1.0 @category models */
export type ControlEdgeInput = typeof ControlEdge.Encoded;
