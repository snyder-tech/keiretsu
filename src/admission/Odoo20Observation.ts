import { Effect, Schema } from 'effect';
import { SourceRecordRef } from '../mapping/SourceRecordRef.ts';

/** Source semantics pinned for synthetic fixtures; this is not installed-tenant qualification. */
export const odoo20SourceCommit = '99e83fca911ac2d69b44e86219860077bdf8ebc8';
const RecordId = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1));
const OptionalRelation = Schema.Union([RecordId, Schema.Literal(false)]);
const Count = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));

/** Bounded read projection, not an Odoo RPC implementation or complete vendor schema. */
export const Odoo20Row = Schema.TaggedUnion({
  'event.event.ticket': { id: RecordId, event_id: RecordId, name: Schema.NonEmptyString, entry_limit: Count },
  'event.registration': {
    id: RecordId,
    event_id: RecordId,
    event_ticket_id: OptionalRelation,
    partner_id: OptionalRelation,
    name: Schema.String,
    email: Schema.String,
    state: Schema.Literals(['draft', 'open', 'done', 'cancel']),
    event_slot_id: Schema.optional(OptionalRelation),
    ticket_entry_limit: Schema.optional(Count),
    main_registration_id: Schema.optional(OptionalRelation),
    sale_order_id: Schema.optional(OptionalRelation),
  },
  'sale.order': { id: RecordId, partner_id: RecordId, state: Schema.Literals(['draft', 'sent', 'sale', 'cancel']) },
  'payment.transaction': {
    id: RecordId,
    state: Schema.Literals(['draft', 'pending', 'authorized', 'done', 'cancel', 'error']),
    operation: Schema.Literals(['online_redirect', 'online_direct', 'online_token', 'validation', 'offline', 'refund']),
  },
});
export type Odoo20Row = typeof Odoo20Row.Type;

export const Odoo20AdmissionObservation = Schema.TaggedUnion({
  tier: { source: SourceRecordRef, event: SourceRecordRef, label: Schema.String, entryLimit: Count, capability: Schema.Literals(['single-entry', 'hold-multi-entry']) },
  registration: {
    source: SourceRecordRef,
    event: SourceRecordRef,
    tier: Schema.optional(SourceRecordRef),
    bookedBy: Schema.optional(SourceRecordRef),
    attendee: Schema.Struct({ name: Schema.String, email: Schema.String }),
    sourceState: Schema.Literals(['draft', 'open', 'done', 'cancel']),
    slot: Schema.optional(SourceRecordRef),
    order: Schema.optional(SourceRecordRef),
    capability: Schema.Literals(['single-entry', 'hold-multi-entry', 'hold-entry-policy-unknown']),
  },
  order: {
    source: SourceRecordRef,
    buyer: SourceRecordRef,
    sourceState: Schema.Literals(['draft', 'sent', 'sale', 'cancel']),
    confirmedSale: Schema.Boolean,
    paymentStatus: Schema.Literal('unestablished'),
  },
  payment: {
    source: SourceRecordRef,
    sourceState: Schema.Literals(['draft', 'pending', 'authorized', 'done', 'cancel', 'error']),
    sourceOperation: Schema.Literals(['online_redirect', 'online_direct', 'online_token', 'validation', 'offline', 'refund']),
    settlementStatus: Schema.Literal('unestablished'),
    entitlementEffect: Schema.Literal('none'),
  },
});
export type Odoo20AdmissionObservation = typeof Odoo20AdmissionObservation.Type;

const source = (installationId: string, model: string, id: number): SourceRecordRef => ({ installationId, model, recordKey: String(id) });
const relation = (installationId: string, model: string, id: number | false | undefined): SourceRecordRef | undefined =>
  id === false || id === undefined ? undefined : source(installationId, model, id);

const registrationObservation = (installationId: string, row: Extract<Odoo20Row, { readonly _tag: 'event.registration' }>): Odoo20AdmissionObservation => ({
  _tag: 'registration',
  source: source(installationId, row._tag, row.id),
  event: source(installationId, 'event.event', row.event_id),
  tier: relation(installationId, 'event.event.ticket', row.event_ticket_id),
  bookedBy: relation(installationId, 'res.partner', row.partner_id),
  attendee: { name: row.name, email: row.email },
  sourceState: row.state,
  slot: relation(installationId, 'event.slot', row.event_slot_id),
  order: relation(installationId, 'sale.order', row.sale_order_id),
  capability:
    row.main_registration_id || (row.ticket_entry_limit !== undefined && row.ticket_entry_limit > 1)
      ? 'hold-multi-entry'
      : row.ticket_entry_limit === undefined
        ? 'hold-entry-policy-unknown'
        : 'single-entry',
});

/** No source state creates an entitlement, credential, authorized redemption or settlement. */
export const observeOdoo20Admission = Effect.fnUntraced(function* (options: { readonly installationId: unknown; readonly row: unknown }) {
  const installationId = yield* Schema.decodeUnknownEffect(Schema.NonEmptyString)(options.installationId);
  const row = yield* Schema.decodeUnknownEffect(Odoo20Row, { onExcessProperty: 'error' })(options.row);
  let observation: Odoo20AdmissionObservation;
  switch (row._tag) {
    case 'event.event.ticket':
      observation = {
        _tag: 'tier',
        source: source(installationId, row._tag, row.id),
        event: source(installationId, 'event.event', row.event_id),
        label: row.name,
        entryLimit: row.entry_limit,
        capability: row.entry_limit > 1 ? 'hold-multi-entry' : 'single-entry',
      };
      break;
    case 'event.registration':
      observation = registrationObservation(installationId, row);
      break;
    case 'sale.order':
      observation = {
        _tag: 'order',
        source: source(installationId, row._tag, row.id),
        buyer: source(installationId, 'res.partner', row.partner_id),
        sourceState: row.state,
        confirmedSale: row.state === 'sale',
        paymentStatus: 'unestablished',
      };
      break;
    case 'payment.transaction':
      observation = {
        _tag: 'payment',
        source: source(installationId, row._tag, row.id),
        sourceState: row.state,
        sourceOperation: row.operation,
        settlementStatus: 'unestablished',
        entitlementEffect: 'none',
      };
      break;
  }
  return yield* Schema.decodeUnknownEffect(Odoo20AdmissionObservation)(observation);
});
