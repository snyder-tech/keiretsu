/** Halo ticket and action facts; one action may combine effort, status and message. */
import { Effect, Schema } from 'effect';
import { SourceQuantity } from "../../work/WorkObservation.js";
import { ProviderFields, SourceId, recordRef, sourceEnvelope, validateProjectionSource } from "./SourceProjection.js";
export const HaloTicket = Schema.Struct({
    id: SourceId,
    summary: Schema.String,
    status_id: SourceId,
    agent_id: Schema.optional(SourceId),
    team_id: Schema.optional(SourceId),
    providerFields: ProviderFields,
});
export const HaloAction = Schema.Struct({
    id: SourceId,
    ticket_id: SourceId,
    note: Schema.optional(Schema.String),
    outcome_id: Schema.optional(SourceId),
    new_status: Schema.optional(SourceId),
    effort: Schema.optional(SourceQuantity),
    agent_id: Schema.optional(SourceId),
    providerFields: ProviderFields,
});
export const decodeHaloTicket = Schema.decodeUnknownEffect(HaloTicket, { onExcessProperty: 'error' });
export const decodeHaloAction = Schema.decodeUnknownEffect(HaloAction, { onExcessProperty: 'error' });
export const projectHaloTicket = Effect.fn('keiretsu.projectHaloTicket')(function* (row, context) {
    yield* validateProjectionSource(context, 'ticket', row.id);
    return {
        ...sourceEnvelope(context),
        kind: 'service-case',
        title: row.summary,
        parents: [],
        assignees: row.agent_id === undefined ? [] : [recordRef(context.mapping.source.installationId, 'agent', row.agent_id)],
        state: { scope: 'ticket', code: String(row.status_id) },
        holds: ['source-state-is-not-approval-or-acceptance'],
    };
});
export const projectHaloAction = Effect.fn('keiretsu.projectHaloAction')(function* (row, context) {
    yield* validateProjectionSource(context, 'action', row.id);
    return {
        ...sourceEnvelope(context),
        kind: 'observation',
        ...(row.note === undefined ? {} : { title: row.note }),
        parents: [recordRef(context.mapping.source.installationId, 'ticket', row.ticket_id)],
        assignees: row.agent_id === undefined ? [] : [recordRef(context.mapping.source.installationId, 'agent', row.agent_id)],
        ...(row.effort === undefined ? {} : { quantity: row.effort }),
        ...(row.new_status === undefined ? {} : { state: { scope: 'ticket', code: String(row.new_status) } }),
        holds: ['action-components-not-independent-events', 'labour-attestation-required'],
    };
});
//# sourceMappingURL=Halo.js.map