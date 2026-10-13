/** Odoo 20 Community project/task and actual hr_timesheet analytic-line facts. */
import { Effect, Schema } from 'effect';
import { SourceQuantity } from "../../work/WorkObservation.js";
import { IsoDate } from "../../core/Temporal.js";
import { Sha256 } from "../../core/CanonicalJson.js";
import { EvidenceRef } from "../../core/Envelope.js";
import { SourceRecordRef, sourceRecordKey } from "../../mapping/SourceRecordRef.js";
import { ProviderFields, SourceId, recordRef, sourceEnvelope, validateProjectionSource } from "./SourceProjection.js";
const Many2One = Schema.Union([Schema.Literal(false), Schema.Tuple([SourceId, Schema.String])]);
const OdooQuantity = Schema.Number.check(Schema.isFinite(), Schema.isGreaterThanOrEqualTo(0));
export const OdooProject = Schema.Struct({ id: SourceId, name: Schema.NonEmptyString, user_id: Many2One, active: Schema.Boolean, providerFields: ProviderFields });
export const OdooTask = Schema.Struct({
    id: SourceId,
    name: Schema.NonEmptyString,
    project_id: Many2One,
    parent_id: Many2One,
    user_ids: Schema.Array(SourceId),
    stage_id: Many2One,
    state: Schema.NonEmptyString,
    providerFields: ProviderFields,
});
export const OdooTimesheetLine = Schema.Struct({
    id: SourceId,
    name: Schema.String,
    project_id: Many2One,
    task_id: Many2One,
    employee_id: Many2One,
    date: IsoDate,
    unit_amount: OdooQuantity,
    providerFields: ProviderFields,
});
export const decodeOdooProject = Schema.decodeUnknownEffect(OdooProject, { onExcessProperty: 'error' });
export const decodeOdooTask = Schema.decodeUnknownEffect(OdooTask, { onExcessProperty: 'error' });
export const decodeOdooTimesheetLine = Schema.decodeUnknownEffect(OdooTimesheetLine, { onExcessProperty: 'error' });
const relation = (value, installationId, model) => (value === false ? [] : [recordRef(installationId, model, value[0])]);
export const projectOdooProject = Effect.fn('keiretsu.projectOdooProject')(function* (row, context) {
    yield* validateProjectionSource(context, 'project.project', row.id);
    return {
        ...sourceEnvelope(context),
        kind: 'container',
        title: row.name,
        parents: [],
        assignees: relation(row.user_id, context.mapping.source.installationId, 'res.users'),
        holds: [],
    };
});
export const projectOdooTask = Effect.fn('keiretsu.projectOdooTask')(function* (row, context) {
    yield* validateProjectionSource(context, 'project.task', row.id);
    return {
        ...sourceEnvelope(context),
        kind: 'work-item',
        title: row.name,
        parents: [...relation(row.project_id, context.mapping.source.installationId, 'project.project'), ...relation(row.parent_id, context.mapping.source.installationId, 'project.task')],
        assignees: row.user_ids.map((id) => recordRef(context.mapping.source.installationId, 'res.users', id)),
        state: { scope: row.stage_id === false ? 'project.task' : `project.task/stage:${row.stage_id[0]}`, code: row.state },
        holds: ['source-state-is-not-customer-acceptance'],
    };
});
/** Caller supplies the configured timesheet UoM; unit_amount is not universally hours. */
export const OdooTimesheetClassification = Schema.Struct({ module: Schema.Literal('hr_timesheet'), source: SourceRecordRef, sourceDigest: Sha256, evidence: Schema.NonEmptyArray(EvidenceRef) });
export const projectOdooTimesheetLine = Effect.fn('keiretsu.projectOdooTimesheetLine')(function* (row, context, unit, classification) {
    yield* validateProjectionSource(context, 'account.analytic.line', row.id);
    const quantity = yield* Schema.decodeUnknownEffect(SourceQuantity)({ value: String(row.unit_amount), unit });
    const classified = classification !== undefined && sourceRecordKey(classification.source) === sourceRecordKey(context.mapping.source) && classification.sourceDigest === context.mapping.sourceDigest;
    return {
        ...sourceEnvelope(context),
        kind: 'observation',
        title: row.name,
        parents: [...relation(row.project_id, context.mapping.source.installationId, 'project.project'), ...relation(row.task_id, context.mapping.source.installationId, 'project.task')],
        assignees: relation(row.employee_id, context.mapping.source.installationId, 'hr.employee'),
        quantity,
        holds: [
            'labour-attestation-required',
            ...(!classified ? ['analytic-line-hr-timesheet-classification-unverified'] : []),
            ...(row.employee_id === false || row.project_id === false ? ['hr-timesheet-context-incomplete'] : []),
        ],
    };
});
/** Field Service uses Enterprise Planning shifts; no task/time equivalence is asserted. */
export const projectOdooFieldService = (context) => ({
    ...sourceEnvelope(context),
    kind: 'unsupported',
    parents: [],
    assignees: [],
    holds: ['odoo-20-enterprise-planning-shift-implementation-unverified'],
});
//# sourceMappingURL=Odoo.js.map