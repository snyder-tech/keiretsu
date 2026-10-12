/**
 * The economic event spine (REA; ISO/IEC 15944-4).
 *
 * Labour, compute, delivery and licence use are one kind of record: something
 * that happened, witnessed once by the party that saw it. Charges, cost,
 * revenue, journals and tax attributions are derivations that cite events by
 * id and digest; they never edit them. Re-routing money never changes where
 * work happened, who did it or who employed them.
 *
 * Every event is bitemporal (valid time + recorded time) and revisioned: a
 * correction is a new revision naming the digest it supersedes.
 *
 * @since 0.1.0
 * @module
 */
import { Actor } from '../core/Actor.ts';
import { Sha256 } from '../core/CanonicalJson.ts';
import { Situs } from '../core/Country.ts';
import { Decimal } from '../core/Decimal.ts';
import { AssertionFields, BitemporalFields, RevisionFields, revisionChain, validInterval, verifiedHasEvidence } from '../core/Envelope.ts';
import { Uuid7 } from '../core/Id.ts';
import { AgreementId, EngagementId, EntityId, EventId, OfferingId, WorkOrderId } from '../core/Ids.ts';
import { Money } from '../core/Money.ts';
import { contains, Instant, IsoDate } from '../core/Temporal.ts';
import { Match, Schema } from 'effect';

import { ExtensionCode, OpenCode, openVocabulary } from './Code.ts';
import { PartyRef } from './PartyRef.ts';
import { PersonRef } from './PersonRef.ts';
import { IanaTimeZone } from './TimeZone.ts';
import { WorkObjectRef, WorkSystem } from './WorkObject.ts';
import { TimeProposalId } from './WorkIds.ts';

/**
 * Minutes in one civil day: an integer from 1 to 1,440.
 *
 * @since 0.1.0
 * @category schemas
 */
export const DayMinutes = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 1440 }));

/**
 * A non-negative safe integer count (tokens, requests, units). Never minutes.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Count = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }));

/**
 * A strictly positive canonical decimal.
 *
 * @since 0.1.0
 * @category schemas
 */
export const PositiveDecimal = Decimal.check(Schema.makeFilter((value: string) => (value.startsWith('-') || value === '0' ? 'must be positive' : undefined)));

/**
 * Quantity of a declared value unit (e.g. `test-case`, `migration-object`).
 *
 * @since 0.1.0
 * @category schemas
 */
export const ValueQuantity = Schema.Struct({ valueUnit: OpenCode, units: PositiveDecimal });
/** @since 0.1.0 @category models */
export type ValueQuantity = typeof ValueQuantity.Type;

/**
 * Legal relationship between performer and employer. Declared, never defaulted.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Relationship = openVocabulary(['employee', 'independent-contractor', 'eor-worker', 'secondee']);

/**
 * How the work location is known. A payroll or invoice address never proves it.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LocationEvidence = openVocabulary(['attested', 'device-telemetry', 'office-badge', 'engagement-default']);

/**
 * Why the minutes are being recorded (a commercial intent, not a billing decision).
 *
 * @since 0.1.0
 * @category schemas
 */
export const BillableIntent = openVocabulary(['billable', 'non-billable', 'internal', 'investment', 'business-development']);

/**
 * Lineage of attested minutes: typed by the person, promoted from an agent or
 * system proposal by its owner, or imported from a source system. Lineage is
 * immutable across revisions.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LabourOrigin = Schema.TaggedUnion({
  human: {},
  'agent-proposal': { proposalId: TimeProposalId, proposalDigest: Sha256, promotedBy: Actor, promotedAt: Instant },
  import: { system: WorkSystem, sourceRecordId: Schema.NonEmptyString },
});
/** @since 0.1.0 @category models */
export type LabourOrigin = typeof LabourOrigin.Type;

/**
 * Fields every economic event carries.
 *
 * @since 0.1.0
 * @category fields
 */
export const EventFields = {
  id: EventId,
  ...RevisionFields,
  ...BitemporalFields,
  ...AssertionFields,
  workObject: WorkObjectRef,
  extensions: Schema.optional(Schema.Record(ExtensionCode, Schema.Unknown)),
} as const;

const EventUnion = Schema.TaggedUnion({
  /** Attested human minutes. AI work is never recorded here. */
  labour: {
    ...EventFields,
    person: PersonRef,
    engagementId: EngagementId,
    employer: EntityId,
    relationship: Relationship,
    situs: Situs,
    locationEvidence: LocationEvidence,
    workDate: IsoDate,
    timeZone: IanaTimeZone,
    startedAt: Schema.optional(Instant),
    minutes: DayMinutes,
    assistedBy: Schema.Array(EventId),
    activity: OpenCode,
    billableIntent: BillableIntent,
    origin: LabourOrigin,
    attestedBy: Actor,
    attestedAt: Instant,
    evidenceDigests: Schema.Array(Sha256),
    workOrderId: Schema.optional(WorkOrderId),
  },
  /** AI or tool usage, measured in integer units (tokens, requests), never minutes. */
  compute: {
    ...EventFields,
    operator: PersonRef,
    agentId: Schema.NonEmptyString,
    sessionId: Schema.optional(Uuid7),
    capability: Schema.optional(Schema.Struct({ id: OfferingId, version: Schema.NonEmptyString })),
    model: Schema.NonEmptyString,
    usageDate: IsoDate,
    usage: Schema.NonEmptyArray(Schema.Struct({ unit: OpenCode, count: Count })),
    cost: Money,
    costBearer: EntityId,
  },
  /** A deliverable handed over, measured in value units. */
  delivery: {
    ...EventFields,
    provider: EntityId,
    receiver: PartyRef,
    deliveredOn: IsoDate,
    valueUnits: Schema.NonEmptyArray(ValueQuantity),
    producedBy: Schema.Array(EventId),
    workOrderId: Schema.optional(WorkOrderId),
    deliverableDigest: Schema.optional(Sha256),
  },
  /** Metered use of a licensed offering over a half-open interval. */
  'licence-use': {
    ...EventFields,
    offeringId: OfferingId,
    agreementId: Schema.optional(AgreementId),
    licensor: EntityId,
    licensee: PartyRef,
    meter: OpenCode,
    quantity: PositiveDecimal,
    usageFrom: IsoDate,
    usageTo: IsoDate,
  },
});

type AnyEvent = typeof EventUnion.Type;

/**
 * The civil date on which an event happened (licence use: its first day).
 *
 * @since 0.1.0
 * @category accessors
 */
export const occurredOn = (event: AnyEvent): IsoDate =>
  Match.value(event).pipe(
    Match.tagsExhaustive({
      labour: (labour) => labour.workDate,
      compute: (compute) => compute.usageDate,
      delivery: (delivery) => delivery.deliveredOn,
      'licence-use': (use) => use.usageFrom,
    }),
  );

const unitsUnique = (event: AnyEvent): boolean => event._tag !== 'compute' || new Set(event.usage.map((entry) => entry.unit)).size === event.usage.length;

const usageOrdered = (event: AnyEvent): boolean => event._tag !== 'licence-use' || event.usageFrom < event.usageTo;

/**
 * An economic event: `labour`, `compute`, `delivery` or `licence-use`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const EconomicEvent = EventUnion.check(
  revisionChain,
  validInterval,
  verifiedHasEvidence,
  Schema.makeFilter((event) => (contains(event, occurredOn(event)) ? undefined : 'the event date lies within its valid interval')),
  Schema.makeFilter((event) => (unitsUnique(event) ? undefined : 'compute usage lists each unit once')),
  Schema.makeFilter((event) => (usageOrdered(event) ? undefined : 'usageTo must follow usageFrom')),
  Schema.makeFilter((event) => (event._tag === 'delivery' && event.producedBy.includes(event.id) ? 'a delivery cannot be produced by itself' : undefined)),
);
/** @since 0.1.0 @category models */
export type EconomicEvent = typeof EconomicEvent.Type;
/** @since 0.1.0 @category models */
export type LabourEvent = Extract<EconomicEvent, { readonly _tag: 'labour' }>;
/** @since 0.1.0 @category models */
export type ComputeEvent = Extract<EconomicEvent, { readonly _tag: 'compute' }>;
/** @since 0.1.0 @category models */
export type DeliveryEvent = Extract<EconomicEvent, { readonly _tag: 'delivery' }>;
/** @since 0.1.0 @category models */
export type LicenceUseEvent = Extract<EconomicEvent, { readonly _tag: 'licence-use' }>;

/**
 * The current revision of each event id (highest revision wins). Digest-chain
 * verification of `supersedesDigest` belongs to the exchange receiver.
 *
 * @since 0.1.0
 * @category queries
 */
export const currentRevisions = (events: ReadonlyArray<EconomicEvent>): ReadonlyArray<EconomicEvent> => {
  const latest = new Map<string, EconomicEvent>();
  for (const event of events) {
    const seen = latest.get(event.id);
    if (seen === undefined || seen.revision < event.revision) latest.set(event.id, event);
  }
  return [...latest.values()];
};

/**
 * Narrow to labour events.
 *
 * @since 0.1.0
 * @category queries
 */
export const labourEvents = (events: ReadonlyArray<EconomicEvent>): ReadonlyArray<LabourEvent> => events.filter((event): event is LabourEvent => event._tag === 'labour');
