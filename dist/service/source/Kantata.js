/** Kantata source facts; approved includes the approval-not-required path. */
import { Effect, Schema } from 'effect';
import { SourceQuantity } from "../../work/WorkObservation.js";
import { ProviderFields, SourceId, recordRef, sourceEnvelope, validateProjectionSource } from "./SourceProjection.js";
export const KantataWork = Schema.Struct({ id: SourceId, title: Schema.String, workspace_id: SourceId, assignee_ids: Schema.Array(SourceId), status: Schema.String, providerFields: ProviderFields });
export const KantataTimeEntry = Schema.Struct({
    id: SourceId,
    story_id: Schema.optional(SourceId),
    workspace_id: SourceId,
    user_id: SourceId,
    approved: Schema.Boolean,
    time_in_minutes: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
    providerFields: ProviderFields,
});
export const decodeKantataWork = Schema.decodeUnknownEffect(KantataWork, { onExcessProperty: 'error' });
export const decodeKantataTimeEntry = Schema.decodeUnknownEffect(KantataTimeEntry, { onExcessProperty: 'error' });
export const projectKantataWork = Effect.fn('keiretsu.projectKantataWork')(function* (row, context) {
    yield* validateProjectionSource(context, 'story', row.id);
    return {
        ...sourceEnvelope(context),
        kind: 'work-item',
        title: row.title,
        parents: [recordRef(context.mapping.source.installationId, 'workspace', row.workspace_id)],
        assignees: row.assignee_ids.map((id) => recordRef(context.mapping.source.installationId, 'user', id)),
        state: { scope: `workspace:${row.workspace_id}`, code: row.status },
        holds: ['source-state-is-not-approval-or-acceptance'],
    };
});
export const projectKantataTimeEntry = Effect.fn('keiretsu.projectKantataTimeEntry')(function* (row, context) {
    yield* validateProjectionSource(context, 'time_entry', row.id);
    return {
        ...sourceEnvelope(context),
        kind: 'observation',
        parents: [
            recordRef(context.mapping.source.installationId, 'workspace', row.workspace_id),
            ...(row.story_id === undefined ? [] : [recordRef(context.mapping.source.installationId, 'story', row.story_id)]),
        ],
        assignees: [recordRef(context.mapping.source.installationId, 'user', row.user_id)],
        quantity: Schema.decodeSync(SourceQuantity)({ value: String(row.time_in_minutes), unit: 'minutes' }),
        state: { scope: 'time-entry', code: row.approved ? 'approved' : 'not-approved' },
        holds: ['approved-may-mean-approval-not-required', 'labour-attestation-required'],
    };
});
//# sourceMappingURL=Kantata.js.map