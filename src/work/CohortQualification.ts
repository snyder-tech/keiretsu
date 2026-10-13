/** Qualification consumes the full admitted source cohort before visibility filters. */
import { Effect } from 'effect';
import { digestValueSync } from '../core/CanonicalJson.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { sourceRecordKey, type SourceRecordRef } from '../mapping/SourceRecordRef.ts';
import type { ComputeEvent } from './EconomicEvent.ts';
import { employersOn, type EmploymentFact } from './Employment.ts';
import { personKey } from './PersonRef.ts';
import { validateWork } from './ValidateWork.ts';
import { workObjectKey } from './WorkObject.ts';
import { observationSourceFactsDigest, sourceQuantityToMinutes, type WorkObservation, type WorkSourceCoverage } from './WorkObservation.ts';

export interface CohortQualification {
  readonly qualifiedIds: ReadonlySet<string>;
  readonly heldIds: ReadonlySet<string>;
  readonly issues: ReadonlyArray<ValidationIssue>;
}
export interface WorkCohortInput {
  readonly current: ReadonlyArray<WorkObservation>;
  readonly history: ReadonlyArray<WorkObservation>;
  readonly coverage: ReadonlyArray<WorkSourceCoverage>;
  readonly employments: ReadonlyArray<EmploymentFact>;
  readonly computeEvents: ReadonlyArray<ComputeEvent>;
  /** Host-selected canonical person namespace; discovery never supplies this authority. */
  readonly personNamespace: string;
}
export interface SourceRevisionRecord {
  readonly id: string;
  readonly revision: number;
  readonly digest: string;
  readonly supersedesDigest?: string | undefined;
}
/** Portable integrity gate for native host envelopes, preserving callback error/service types. */
export const validateSourceRevisionPopulation = Effect.fn('keiretsu.validateSourceRevisionPopulation')(function* <A extends SourceRevisionRecord, E, R>(input: {
  readonly current: ReadonlyArray<A>;
  readonly history: ReadonlyArray<A>;
  readonly identityKey: (row: A) => string;
  readonly digestFor: (row: A) => Effect.Effect<string, E, R>;
}) {
  const held = new Set<string>();
  const groups = new Map<string, A[]>();
  for (const row of input.history) {
    const rows = groups.get(row.id) ?? [];
    rows.push(row);
    groups.set(row.id, rows);
    if ((yield* input.digestFor(row)) !== row.digest) held.add(row.id);
  }
  for (const id of sourcePopulationMembershipHolds(input.current, groups, input.identityKey)) held.add(id);
  for (const row of input.current) {
    if (!groups.has(row.id) || (yield* input.digestFor(row)) !== row.digest) held.add(row.id);
  }
  return held;
});
const sourcePopulationMembershipHolds = <A extends SourceRevisionRecord>(current: ReadonlyArray<A>, groups: ReadonlyMap<string, ReadonlyArray<A>>, identityKey: (row: A) => string) => {
  const held = new Set<string>();
  for (const [id, rows] of groups) {
    if (!sourceRevisionChainValid(rows, identityKey)) held.add(id);
    const selected = current.filter((row) => row.id === id);
    const latest = [...rows].sort((a, b) => b.revision - a.revision)[0];
    if (selected.length !== 1 || selected[0]?.digest !== latest?.digest || selected[0]?.revision !== latest?.revision) held.add(id);
  }
  return held;
};
const sourceRevisionChainValid = <A extends SourceRevisionRecord>(rows: ReadonlyArray<A>, identityKey: (row: A) => string): boolean => {
  const ordered = [...rows].sort((a, b) => a.revision - b.revision);
  for (let index = 0; index < ordered.length; index += 1) {
    const row = ordered[index]!;
    if (row.revision !== index + 1) return false;
    const previous = ordered[index - 1];
    if (previous === undefined) {
      if (row.supersedesDigest !== undefined) return false;
      continue;
    }
    if (row.supersedesDigest !== previous.digest || identityKey(row) !== identityKey(previous)) return false;
  }
  return true;
};
export const coverageHoldsDate = (coverage: ReadonlyArray<WorkSourceCoverage>, date: string): boolean =>
  coverage.some((row) => row.from <= date && date < row.toExclusive && (row.state !== 'complete' || row.unresolvedRows > 0));
const dayKey = (person: Parameters<typeof personKey>[0], date: string): string => `${personKey(person)}|${date}`;
const groupedHistory = (history: ReadonlyArray<WorkObservation>) => {
  const groups = new Map<string, WorkObservation[]>();
  for (const row of history) {
    const rows = groups.get(row.id) ?? [];
    rows.push(row);
    groups.set(row.id, rows);
  }
  return groups;
};
const sourceStable = (row: WorkObservation, previous: WorkObservation): boolean =>
  sourceRecordKey(row.source) === sourceRecordKey(previous.source) && sourceRecordKey(row.performer.sourceSubject) === sourceRecordKey(previous.performer.sourceSubject);
const checkObservationChain = Effect.fnUntraced(function* (chain: ReadonlyArray<WorkObservation>) {
  const rows = [...chain].sort((a, b) => a.revision - b.revision);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const { digest, ...content } = row;
    if ((yield* digestValueSync(content)) !== digest || row.revision !== index + 1) return false;
    const previous = rows[index - 1];
    if (previous === undefined) {
      if (!initialEventValid(row)) return false;
      continue;
    }
    if (row.supersedesDigest !== previous.digest || !sourceStable(row, previous)) return false;
    if (!(yield* eventContinuity(row, previous))) return false;
  }
  return true;
});
const initialEventValid = (row: WorkObservation): boolean => row.qualifiedEvent === undefined || row.qualifiedEvent.revision === 1;
/** Opaque source occurrence IDs remain valid; canonical UUIDs are never fabricated. */
export const sourceOccurrenceHolds = (
  history: ReadonlyArray<{ readonly id: string; readonly source: SourceRecordRef; readonly qualifiedEvent?: { readonly id: string } | undefined }>,
): ReadonlySet<string> => {
  const owners = new Map<string, Set<string>>();
  const held = new Set<string>();
  for (const row of history) {
    const sourceKey = `source:${sourceRecordKey(row.source)}`;
    const sourceOwners = owners.get(sourceKey) ?? new Set<string>();
    sourceOwners.add(row.id);
    owners.set(sourceKey, sourceOwners);
    const event = row.qualifiedEvent;
    if (event === undefined) continue;
    const ids = owners.get(`event:${event.id}`) ?? new Set<string>();
    ids.add(row.id);
    owners.set(`event:${event.id}`, ids);
  }
  for (const ids of owners.values()) if (ids.size > 1) for (const id of ids) held.add(id);
  return held;
};
const identityMapped = (row: WorkObservation, personNamespace: string): boolean => {
  if (row.performer._tag !== 'resolved') return false;
  const person = row.performer.person;
  if (person._tag !== 'identified') return false;
  if (row.performer.sourceSubject.installationId !== row.source.installationId) return false;
  if (sourceRecordKey(row.performer.sourceSubject) !== sourceRecordKey(row.performer.mapping.source)) return false;
  const people = row.performer.mapping.targets.filter((target) => target.namespace === personNamespace && target.kind === 'person');
  return people.length === 1 && people[0]?.id === person.personId;
};
const labourBound = (row: WorkObservation, employments: ReadonlyArray<EmploymentFact>): boolean => {
  const event = row.qualifiedEvent;
  if (event?._tag !== 'labour' || row.performer._tag !== 'resolved') return false;
  if (event.workDate !== row.workDate || personKey(event.person) !== personKey(row.performer.person)) return false;
  if (!row.work.some((work) => workObjectKey(work) === workObjectKey(event.workObject))) return false;
  if (event.person._tag !== 'identified') return false;
  return employersOn(employments, event.person.personId, event.workDate).includes(event.employer);
};
const sourceCovered = (row: WorkObservation, coverage: ReadonlyArray<WorkSourceCoverage>): boolean =>
  coverage.some((source) => source.installationId === row.source.installationId && source.from <= row.workDate && row.workDate < source.toExclusive);
const currentBound = (row: WorkObservation, chain: ReadonlyArray<WorkObservation>, current: ReadonlyArray<WorkObservation>): boolean => {
  if (current.filter((candidate) => candidate.id === row.id).length !== 1) return false;
  const latest = [...chain].sort((a, b) => b.revision - a.revision)[0];
  return latest?.digest === row.digest && latest.revision === row.revision;
};
const observationAdmitted = Effect.fnUntraced(function* (row: WorkObservation, input: WorkCohortInput) {
  const { digest, ...content } = row;
  if ((yield* digestValueSync(content)) !== digest) return false;
  if (row.mappingIssues.length > 0 || !identityMapped(row, input.personNamespace) || !labourBound(row, input.employments)) return false;
  if (!sourceCovered(row, input.coverage) || row.qualifiedEvent === undefined || row.eventAdmission === undefined) return false;
  if (!(yield* conversionAdmitted(row))) return false;
  return row.eventAdmission.eventDigest === (yield* digestValueSync(row.qualifiedEvent));
});
const conversionAdmitted = Effect.fnUntraced(function* (row: WorkObservation) {
  if (row.eventAdmission === undefined) return false;
  if (row.eventAdmission.sourceFactsDigest !== (yield* observationSourceFactsDigest(row))) return false;
  if (!admissionConversionBound(row)) return false;
  const converted = yield* sourceQuantityToMinutes(row.quantity, row.eventAdmission.conversion.policy).pipe(Effect.result);
  return converted._tag === 'Success' && converted.success === BigInt(row.eventAdmission.conversion.minutes);
});
const admissionConversionBound = (row: WorkObservation): boolean => {
  if (row.eventAdmission === undefined || row.qualifiedEvent?._tag !== 'labour' || row.performer._tag !== 'resolved') return false;
  const conversion = row.eventAdmission.conversion;
  if (conversion.source.value !== row.quantity.value || conversion.source.unit !== row.quantity.unit || conversion.minutes !== row.qualifiedEvent.minutes) return false;
  return row.eventAdmission.mappingDigest === row.performer.mapping.mappingDigest;
};
const eventContinuity = Effect.fnUntraced(function* (row: WorkObservation, previous: WorkObservation) {
  const before = previous.qualifiedEvent,
    after = row.qualifiedEvent;
  if (before === undefined) return after === undefined || after.revision === 1;
  if (after === undefined || before.id !== after.id || before._tag !== after._tag) return false;
  if (!sameEventOrigin(after, before)) return false;
  const beforeDigest = yield* digestValueSync(before);
  if (before.revision === after.revision) return beforeDigest === (yield* digestValueSync(after));
  return after.revision === before.revision + 1 && after.supersedesDigest === beforeDigest;
});
const sameEventOrigin = (after: NonNullable<WorkObservation['qualifiedEvent']>, before: NonNullable<WorkObservation['qualifiedEvent']>): boolean =>
  after._tag !== 'labour' || before._tag !== 'labour' || JSON.stringify(after.origin) === JSON.stringify(before.origin);
const uncertainCohorts = (input: WorkCohortInput, held: ReadonlySet<string>) => {
  const days = new Set<string>();
  const dates = new Set<string>();
  const candidates = [...input.current, ...input.history.filter((row) => held.has(row.id))];
  for (const row of candidates) {
    if (!held.has(row.id)) continue;
    if (row.performer._tag === 'resolved' && identityMapped(row, input.personNamespace)) days.add(dayKey(row.performer.person, row.workDate));
    else dates.add(row.workDate);
  }
  return { days, dates };
};
const collectiveHolds = (row: WorkObservation, validation: ReadonlyArray<ValidationIssue>, input: WorkCohortInput, uncertain: ReturnType<typeof uncertainCohorts>): boolean => {
  const event = row.qualifiedEvent;
  if (event?._tag !== 'labour') return true;
  const key = dayKey(event.person, event.workDate);
  if (uncertain.dates.has(row.workDate) || uncertain.days.has(key) || coverageHoldsDate(input.coverage, row.workDate)) return true;
  return validation.some((entry) => entry.severity !== 'warning' && [event.id, `${event.id}@${event.revision}`, key].includes(entry.subject));
};
const computeChainValid = Effect.fnUntraced(function* (rows: ReadonlyArray<ComputeEvent>) {
  const ordered = [...rows].sort((a, b) => a.revision - b.revision);
  for (let index = 0; index < ordered.length; index += 1) {
    const row = ordered[index]!;
    if (row._tag !== 'compute' || row.revision !== index + 1) return false;
    const previous = ordered[index - 1];
    if (previous !== undefined && row.supersedesDigest !== (yield* digestValueSync(previous))) return false;
  }
  return true;
});
const qualifiedCompute = Effect.fnUntraced(function* (input: WorkCohortInput) {
  const groups = new Map<string, ComputeEvent[]>();
  const observationIds = new Set<string>(input.history.flatMap((row) => (row.qualifiedEvent === undefined ? [] : [row.qualifiedEvent.id])));
  for (const row of input.computeEvents) {
    const group = groups.get(row.id) ?? [];
    group.push(row);
    groups.set(row.id, group);
  }
  const events: ComputeEvent[] = [];
  const collisions = new Set<string>();
  for (const [id, rows] of groups) {
    if (observationIds.has(id)) {
      collisions.add(id);
      continue;
    }
    if (!(yield* computeChainValid(rows))) continue;
    const latest = [...rows].sort((a, b) => b.revision - a.revision)[0];
    if (latest !== undefined) events.push(latest);
  }
  return { events, collisions };
});

const historyHolds = Effect.fnUntraced(function* (input: WorkCohortInput) {
  const heldIds = new Set(sourceOccurrenceHolds(input.history));
  const compute = yield* qualifiedCompute(input);
  for (const row of input.history) if (row.qualifiedEvent !== undefined && compute.collisions.has(row.qualifiedEvent.id)) heldIds.add(row.id);
  const chains = groupedHistory(input.history);
  for (const [id, chain] of chains) if (!(yield* checkObservationChain(chain))) heldIds.add(id);
  for (const [id, chain] of chains) {
    const current = input.current.find((row) => row.id === id);
    if (current === undefined || !currentBound(current, chain, input.current)) heldIds.add(id);
  }
  return { heldIds, compute, chains };
});
const admissionHolds = Effect.fnUntraced(function* (input: WorkCohortInput, state: { readonly heldIds: Set<string>; readonly chains: ReadonlyMap<string, ReadonlyArray<WorkObservation>> }) {
  for (const row of input.current) {
    const bound = currentBound(row, state.chains.get(row.id) ?? [], input.current);
    if (!bound || !(yield* observationAdmitted(row, input))) state.heldIds.add(row.id);
  }
});
/** No missing population is silently treated as zero; unresolved performers hold the date. */
export const qualifyWorkCohort = Effect.fn('keiretsu.qualifyWorkCohort')(function* (input: WorkCohortInput) {
  const state = yield* historyHolds(input);
  yield* admissionHolds(input, state);
  const { heldIds, compute } = state;
  const uncertain = uncertainCohorts(input, heldIds);
  const events = input.current.flatMap((row) => (row.qualifiedEvent === undefined ? [] : [row.qualifiedEvent]));
  const validation = validateWork({ events: [...events, ...compute.events], employments: input.employments }).issues;
  const qualifiedIds = new Set<string>();
  for (const row of input.current) {
    if (collectiveHolds(row, validation, input, uncertain)) heldIds.add(row.id);
    if (!heldIds.has(row.id)) qualifiedIds.add(row.id);
  }
  const issues = [...validation, ...[...heldIds].map((id) => issue('work.cohort.held', 'hold', id, 'Source coverage, identity, event lineage or collective qualification is unresolved.'))];
  return { heldIds, qualifiedIds, issues } satisfies CohortQualification;
});
