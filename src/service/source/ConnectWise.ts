/** ConnectWise board-specific service statuses remain scoped source facts. */
import { Effect, Schema } from 'effect';
import { SourceQuantity } from '../../work/WorkObservation.ts';
import { ProviderFields, SourceId, recordRef, sourceEnvelope, validateProjectionSource, type ProjectionContext, type SourceWorkProjection } from './SourceProjection.ts';
const Reference = Schema.Struct({ id: SourceId, name: Schema.optional(Schema.String) });
export const ConnectWiseTicket = Schema.Struct({ id: SourceId, summary: Schema.String, board: Reference, status: Reference, resources: Schema.Array(Reference), providerFields: ProviderFields });
export type ConnectWiseTicket = typeof ConnectWiseTicket.Type;
export const ConnectWiseTimeEntry = Schema.Struct({
  id: SourceId,
  chargeToId: SourceId,
  chargeToType: Schema.NonEmptyString,
  member: Reference,
  quantity: SourceQuantity,
  providerFields: ProviderFields,
});
export type ConnectWiseTimeEntry = typeof ConnectWiseTimeEntry.Type;
export const decodeConnectWiseTicket = Schema.decodeUnknownEffect(ConnectWiseTicket, { onExcessProperty: 'error' });
export const decodeConnectWiseTimeEntry = Schema.decodeUnknownEffect(ConnectWiseTimeEntry, { onExcessProperty: 'error' });
export const projectConnectWiseTicket = Effect.fn('keiretsu.projectConnectWiseTicket')(function* (row: ConnectWiseTicket, context: ProjectionContext) {
  yield* validateProjectionSource(context, 'service/tickets', row.id);
  return {
    ...sourceEnvelope(context),
    kind: 'service-case',
    title: row.summary,
    parents: [],
    assignees: row.resources.map((ref) => recordRef(context.mapping.source.installationId, 'member', ref.id)),
    state: { scope: `service-board:${row.board.id}`, code: String(row.status.id) },
    holds: ['source-state-is-not-approval-or-acceptance'],
  } satisfies SourceWorkProjection;
});
export const projectConnectWiseTimeEntry = Effect.fn('keiretsu.projectConnectWiseTimeEntry')(function* (row: ConnectWiseTimeEntry, context: ProjectionContext) {
  yield* validateProjectionSource(context, 'time/entries', row.id);
  return {
    ...sourceEnvelope(context),
    kind: 'observation',
    parents: [recordRef(context.mapping.source.installationId, row.chargeToType, row.chargeToId)],
    assignees: [recordRef(context.mapping.source.installationId, 'member', row.member.id)],
    quantity: row.quantity,
    holds: ['charge-target-type-requires-mapping', 'labour-attestation-required'],
  } satisfies SourceWorkProjection;
});
