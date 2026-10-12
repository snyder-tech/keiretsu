/**
 * Disclosure levels and per-record-kind disclosure policy.
 *
 * A bundle declares one disclosure level. Each domain package registers a
 * {@link RecordKindPolicy} for every record kind it ships: the most revealing
 * level the kind may travel at, how to find the person references inside a
 * record, and whether the kind may leave the issuer's control group. The
 * exchange package enforces these generically; it never imports a domain.
 *
 * A kind without a registered policy fails closed (`disclosure.undeclared`).
 *
 * @since 0.1.0
 * @module
 */
import type { Actor } from '../core/Actor.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { Schema } from 'effect';

import { type ControlGroup, crossesGroup, type PartyRef } from './Party.ts';

/**
 * What the audience may see about people: `identified` (person ids),
 * `pseudonymous` (per-audience pseudonyms) or `aggregate` (no per-person rows).
 *
 * @since 0.1.0
 * @category schemas
 */
export const Disclosure = Schema.Literals(['identified', 'pseudonymous', 'aggregate']);
/** @since 0.1.0 @category models */
export type Disclosure = typeof Disclosure.Type;

const DISCLOSURE_RANK: Readonly<Record<Disclosure, number>> = { aggregate: 0, pseudonymous: 1, identified: 2 };

/**
 * Order disclosure levels from least (`aggregate`, 0) to most revealing (`identified`, 2).
 *
 * @since 0.1.0
 * @category ordering
 */
export const rank = (level: Disclosure): number => DISCLOSURE_RANK[level];

/**
 * How a person appears inside a record. Port: the entity package owns the full
 * `PersonRef` union; exchange needs only its level.
 *
 * @since 0.1.0
 * @category models
 */
export interface PersonRefView {
  readonly level: 'identified' | 'pseudonymous' | 'role-only';
}

const PERSON_RANK: Readonly<Record<PersonRefView['level'], number>> = { 'role-only': 0, pseudonymous: 1, identified: 2 };

/**
 * Person references carried by a core {@link Actor}: humans and agent
 * operators are identified; systems carry none.
 *
 * @since 0.1.0
 * @category constructors
 */
export const fromActor = (actor: Actor): ReadonlyArray<PersonRefView> => (actor._tag === 'system' ? [] : [{ level: 'identified' }]);

/**
 * Whether a kind may leave the issuer's control group: `allowed`; only as a
 * redacted view kind (`view-required`); or `never`.
 *
 * @since 0.1.0
 * @category models
 */
export type CrossGroup = 'allowed' | 'view-required' | 'never';

/**
 * Disclosure policy a domain registers for one record kind.
 *
 * @since 0.1.0
 * @category models
 */
export interface RecordKindPolicy<R> {
  readonly kind: string;
  /** Most revealing bundle level this kind may travel at. */
  readonly maxDisclosure: Disclosure;
  /** Least revealing bundle level this kind is meaningful at (e.g. engagements need `identified`). */
  readonly minDisclosure?: Disclosure;
  /** Extractors returning every person reference in a record. */
  readonly personRefPaths: ReadonlyArray<(record: R) => ReadonlyArray<PersonRefView>>;
  readonly crossesControlGroup: CrossGroup;
}

/**
 * One policy per record kind of a profile, keyed by kind.
 *
 * @since 0.1.0
 * @category models
 */
export type PolicySet<P extends { readonly [kind: string]: { readonly Type: unknown } }> = {
  readonly [K in keyof P & string]: RecordKindPolicy<P[K]['Type']> & { readonly kind: K };
};

/**
 * The parts of a bundle disclosure checking reads (decoded, known-kind records only).
 *
 * @since 0.1.0
 * @category models
 */
export interface DisclosureSubject {
  readonly disclosure: Disclosure;
  readonly issuer: string;
  readonly audience: PartyRef;
  readonly records: ReadonlyArray<{ readonly index: number; readonly kind: string; readonly record: unknown }>;
}

/**
 * A disclosure finding on one record.
 *
 * @since 0.1.0
 * @category models
 */
export interface RecordIssue {
  readonly index: number;
  readonly issue: ValidationIssue;
}

/** Policy with its record type erased for lookup by kind. */
interface ErasedPolicy {
  readonly maxDisclosure: Disclosure;
  readonly minDisclosure?: Disclosure;
  readonly personRefPaths: ReadonlyArray<(record: unknown) => ReadonlyArray<PersonRefView>>;
  readonly crossesControlGroup: CrossGroup;
}

const lookup = (policies: { readonly [kind: string]: RecordKindPolicy<never> }, kind: string): ErasedPolicy | undefined => {
  if (!Object.hasOwn(policies, kind)) return undefined;
  // SAFETY: the policy is looked up by the record's own kind, and the record was
  // decoded with that kind's schema, so its extractors accept the record.
  return policies[kind] as unknown as ErasedPolicy;
};

interface Context {
  readonly disclosure: Disclosure;
  readonly crossesGroup: boolean;
}

const levelIssues = (subject: Context, policy: ErasedPolicy, at: string): ReadonlyArray<ValidationIssue> => {
  const level = rank(subject.disclosure);
  return [
    ...(level > rank(policy.maxDisclosure) ? [issue('disclosure.kind-exceeds-max', 'error', at, `this kind travels at most ${policy.maxDisclosure}; the bundle is ${subject.disclosure}`)] : []),
    ...(policy.minDisclosure !== undefined && level < rank(policy.minDisclosure)
      ? [issue('disclosure.kind-below-min', 'error', at, `this kind needs at least ${policy.minDisclosure}; the bundle is ${subject.disclosure}`)]
      : []),
  ];
};

const groupIssues = (subject: Context, policy: ErasedPolicy, at: string): ReadonlyArray<ValidationIssue> => {
  if (!subject.crossesGroup || policy.crossesControlGroup === 'allowed') return [];
  return policy.crossesControlGroup === 'never'
    ? [issue('disclosure.never-crosses', 'error', at, 'this kind never leaves the issuer control group')]
    : [issue('disclosure.view-required', 'error', at, 'outside the control group send the redacted view kind instead')];
};

const personIssues = (subject: Context, policy: ErasedPolicy, entry: DisclosureSubject['records'][number], at: string): ReadonlyArray<ValidationIssue> => {
  const ceiling = rank(subject.disclosure);
  return policy.personRefPaths
    .flatMap((extract) => extract(entry.record))
    .filter((person) => PERSON_RANK[person.level] > ceiling)
    .map((person) => issue('disclosure.person-ref', 'error', at, `a ${subject.disclosure} bundle cannot carry a ${person.level} person reference`));
};

/**
 * Check every known record against its kind's policy, the bundle level and the
 * audience's position relative to the control group.
 *
 * @since 0.1.0
 * @category checks
 */
export const checkDisclosure = (
  subject: DisclosureSubject,
  policies: { readonly [kind: string]: RecordKindPolicy<never> },
  controlGroup: ControlGroup,
): ReadonlyArray<RecordIssue> => {
  const context: Context = { disclosure: subject.disclosure, crossesGroup: crossesGroup(subject, controlGroup) };
  return subject.records.flatMap((entry) => {
    const at = `records[${entry.index}]`;
    const policy = lookup(policies, entry.kind);
    const issues =
      policy === undefined
        ? [issue('disclosure.undeclared', 'error', at, `no disclosure policy is registered for kind ${entry.kind}`)]
        : [...levelIssues(context, policy, at), ...groupIssues(context, policy, at), ...personIssues(context, policy, entry, at)];
    return issues.map((found) => ({ index: entry.index, issue: found }));
  });
};
