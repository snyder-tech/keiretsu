/**
 * Related-party determinations per ordered pair and jurisdiction.
 *
 * Each control test (equity, board appointment, de facto control, loan or
 * supply dependence, common control) records its outcome, the jurisdiction
 * rule it applies (e.g. `in-s92A`, `pk-s85`, `us-482-control`, `oecd-art9`)
 * and evidence. The result is `associated`, `unrelated` or `undetermined`;
 * `undetermined` holds invoicing and close sign-off for the pair. The
 * result is a human determination — {@link candidateResult} only suggests one.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { Actor } from '../core/Actor.ts';
import { CountryCode } from '../core/Country.ts';
import { AssertionFields, EvidenceRef, revisionChain, RevisionFields, validInterval, verifiedHasEvidence } from '../core/Envelope.ts';
import { brand } from '../core/Id.ts';
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { contains, Instant, IsoDate } from '../core/Temporal.ts';

import { extensible } from './internal/Codes.ts';

/** @since 0.1.0 @category schemas */
export const DeterminationId = brand('keiretsu/RelatedPartyDeterminationId');

export { PartyRef } from '../core/PartyRef.ts';
import { PartyRef, partyKey } from '../core/PartyRef.ts';

/**
 * Kinds of control test. Open list.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ControlTestKind = extensible(['equity', 'board-appointment', 'de-facto-control', 'loan-dependence', 'supply-dependence', 'common-control']);

/**
 * One control test.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ControlTest = Schema.Struct({
  kind: ControlTestKind,
  outcome: Schema.Literals(['met', 'not-met', 'unknown']),
  /** Jurisdiction rule code from a cited data pack, e.g. `in-s92A`. */
  rule: Schema.NonEmptyString,
  evidence: Schema.Array(EvidenceRef),
});
/** @since 0.1.0 @category models */
export type ControlTest = typeof ControlTest.Type;

/**
 * Determination result.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelationResult = Schema.Literals(['associated', 'unrelated', 'undetermined']);
/** @since 0.1.0 @category models */
export type RelationResult = typeof RelationResult.Type;

/**
 * Candidate result from test outcomes: any `met` → associated; any `unknown` → undetermined; else unrelated.
 *
 * @since 0.1.0
 * @category derivations
 */
export const candidateResult = (tests: ReadonlyArray<ControlTest>): RelationResult => {
  if (tests.some((test) => test.outcome === 'met')) return 'associated';
  if (tests.length === 0 || tests.some((test) => test.outcome === 'unknown')) return 'undetermined';
  return 'unrelated';
};

/**
 * Consistency of a result with its tests.
 *
 * Codes: `related-party.met-without-evidence`, `related-party.result-contradicts-tests`, `related-party.human-determination`.
 *
 * @since 0.1.0
 * @category checks
 */
export const validateDetermination = (determination: {
  readonly tests: ReadonlyArray<ControlTest>;
  readonly result: RelationResult;
  readonly determinedBy?: Actor | undefined;
}): ReadonlyArray<ValidationIssue> => {
  const issues: Array<ValidationIssue> = [];
  if (determination.tests.some((test) => test.outcome === 'met' && test.evidence.length === 0)) {
    issues.push(issue('related-party.met-without-evidence', 'error', 'determination', 'a met control test needs evidence'));
  }
  const candidate = candidateResult(determination.tests);
  if (determination.result !== 'undetermined' && determination.result !== candidate) {
    issues.push(issue('related-party.result-contradicts-tests', 'error', 'determination', `tests indicate ${candidate}, result says ${determination.result}`));
  }
  if (determination.result !== 'undetermined' && determination.determinedBy?._tag !== 'human') {
    issues.push(issue('related-party.human-determination', 'error', 'determination', 'only a human determines associated or unrelated'));
  }
  return issues;
};

/**
 * A related-party determination for an ordered pair in one jurisdiction.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelatedPartyDetermination = Schema.Struct({
  id: DeterminationId,
  ...RevisionFields,
  from: PartyRef,
  to: PartyRef,
  jurisdiction: CountryCode,
  tests: Schema.Array(ControlTest),
  result: RelationResult,
  determinedBy: Schema.optional(Actor),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  recordedAt: Instant,
  ...AssertionFields,
}).check(
  revisionChain,
  validInterval,
  verifiedHasEvidence,
  Schema.makeFilter((determination) => {
    const found = validateDetermination(determination)[0];
    return found === undefined ? undefined : `${found.code}: ${found.message}`;
  }),
);
/** @since 0.1.0 @category models */
export type RelatedPartyDetermination = typeof RelatedPartyDetermination.Type;

/**
 * Status of a pair on a date, with a hold when undetermined or missing.
 *
 * Code: `related-party.undetermined` (hold).
 *
 * @since 0.1.0
 * @category lookups
 */
export const pairStatus = (options: {
  readonly determinations: ReadonlyArray<RelatedPartyDetermination>;
  readonly from: PartyRef;
  readonly to: PartyRef;
  readonly jurisdiction: CountryCode;
  readonly date: IsoDate;
}): { readonly result: RelationResult; readonly issues: ReadonlyArray<ValidationIssue> } => {
  const current = options.determinations
    .filter((entry) => partyKey(entry.from) === partyKey(options.from) && partyKey(entry.to) === partyKey(options.to) && entry.jurisdiction === options.jurisdiction && contains(entry, options.date))
    .sort((left, right) => right.revision - left.revision)[0];
  const result = current?.result ?? 'undetermined';
  const subject = `${partyKey(options.from)}→${partyKey(options.to)}@${options.jurisdiction}`;
  return {
    result,
    issues: result === 'undetermined' ? [issue('related-party.undetermined', 'hold', subject, 'relationship undetermined; invoicing and close sign-off for the pair are held')] : [],
  };
};
