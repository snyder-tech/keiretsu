/**
 * Agreements: masters and their bilateral schedules, for customer and
 * intercompany trade alike.
 *
 * Commerce owns the commercial terms (parties, kind, invoice currency, rate
 * clause reference, settlement terms, execution evidence). Transfer-pricing
 * methods, benchmarks and cost-base definitions belong to
 * `@snyder-tech/keiretsu/finance` and are referenced by id and digest.
 *
 * A schedule counts as **executed** only when its status is `executed` and it
 * carries signed evidence pinned by digest; a status alone proves nothing.
 *
 * Capacity terms (`holdRights`, `leadTimeClasses`, see `CapacityTerms`) are
 * optional: a capacity hold is valid only under a hold right of an executed
 * agreement, and a lead-time class claimed by a hold or charge is checked
 * against the agreement's classes.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';

import { CurrencyCode } from '../core/Currency.ts';
import { AssertionFields, type EvidenceRef, revisionChain, RevisionFields, validInterval, verifiedHasEvidence } from '../core/Envelope.ts';
import { AgreementId } from '../core/Ids.ts';
import type { ValidationIssue } from '../core/Issue.ts';
import { contains, Instant, IsoDate } from '../core/Temporal.ts';

import { HoldRight, LeadTimeClass, leadTimeClassProblem } from './CapacityTerms.ts';
import { openVocabulary } from './Code.ts';
import { RateClauseRef } from './FxPort.ts';
import { rule, runRules, toCheck } from './Invariant.ts';
import { PartyRef, partyKey } from './Party.ts';

/**
 * Normative agreement kinds (open with `x-` extensions).
 *
 * @since 0.1.0
 * @category schemas
 */
export const AgreementKind = openVocabulary(['services', 'ip-license', 'cost-contribution', 'resale', 'referral'] as const);
/** @since 0.1.0 @category models */
export type AgreementKind = typeof AgreementKind.Type;

/**
 * Evidence kind that proves execution: a signed copy pinned by digest.
 *
 * @since 0.1.0
 * @category constants
 */
export const SIGNED_EVIDENCE_KIND = 'signed-copy';

/**
 * Master (common terms) or schedule (bilateral terms under a master).
 *
 * @since 0.1.0
 * @category schemas
 */
export const AgreementLevel = Schema.TaggedUnion({
  master: {},
  schedule: { masterId: AgreementId, scheduleRef: Schema.NonEmptyString.check(Schema.isMaxLength(64)) },
});
/** @since 0.1.0 @category models */
export type AgreementLevel = typeof AgreementLevel.Type;

/**
 * When and how invoices are settled.
 *
 * @since 0.1.0
 * @category schemas
 */
export const SettlementTerms = Schema.Struct({
  cycle: openVocabulary(['per-invoice', 'weekly', 'monthly', 'quarterly'] as const),
  netDays: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 365 })),
  /** Whether set-off against reciprocal balances is permitted by the agreement (law may still forbid it). */
  nettingPermitted: Schema.Boolean,
});
/** @since 0.1.0 @category models */
export type SettlementTerms = typeof SettlementTerms.Type;

interface AgreementShape {
  readonly level: AgreementLevel;
  readonly parties: ReadonlyArray<PartyRef>;
  readonly invoiceCurrency?: string | undefined;
  readonly status: string;
  readonly evidence: ReadonlyArray<EvidenceRef>;
  readonly holdRights?: ReadonlyArray<HoldRight> | undefined;
  readonly leadTimeClasses?: ReadonlyArray<LeadTimeClass> | undefined;
}

const holdRightPartyProblem = (agreement: AgreementShape): string | undefined => {
  const parties = new Set(agreement.parties.map(partyKey));
  const stray = (agreement.holdRights ?? []).find(
    (right) => !parties.has(partyKey(right.holder)) || !parties.has(partyKey(right.provider)) || partyKey(right.holder) === partyKey(right.provider),
  );
  return stray === undefined ? undefined : `hold right ${stray.key} must name two different parties to the agreement`;
};

const hasSignedEvidence = (agreement: Pick<AgreementShape, 'evidence'>): boolean =>
  agreement.evidence.some((entry) => entry.kind === SIGNED_EVIDENCE_KIND && entry.digest !== undefined);

/**
 * Agreement invariants.
 *
 * @since 0.1.0
 * @category invariants
 */
export const agreementRules = {
  distinctParties: rule<AgreementShape>('agreement.duplicate-party', (agreement) =>
    new Set(agreement.parties.map(partyKey)).size === agreement.parties.length ? undefined : 'each party appears once',
  ),
  scheduleBilateral: rule<AgreementShape>('agreement.schedule-not-bilateral', (agreement) =>
    agreement.level._tag === 'schedule' && agreement.parties.length !== 2 ? 'a schedule binds exactly two parties' : undefined,
  ),
  scheduleCurrency: rule<AgreementShape>('agreement.schedule-without-currency', (agreement) =>
    agreement.level._tag === 'schedule' && agreement.invoiceCurrency === undefined ? 'a schedule states its invoice currency' : undefined,
  ),
  executedSigned: rule<AgreementShape>('agreement.executed-without-signature', (agreement) =>
    agreement.status === 'executed' && !hasSignedEvidence(agreement) ? `executed requires ${SIGNED_EVIDENCE_KIND} evidence pinned by digest` : undefined,
  ),
  uniqueHoldRights: rule<AgreementShape>('agreement.duplicate-hold-right', (agreement) => {
    const keys = (agreement.holdRights ?? []).map((right) => right.key);
    return new Set(keys).size === keys.length ? undefined : 'hold-right keys are unique within an agreement';
  }),
  holdRightParties: rule<AgreementShape>('agreement.hold-right-parties', holdRightPartyProblem),
  leadTimeClasses: rule<AgreementShape>('agreement.lead-time-classes-invalid', (agreement) => leadTimeClassProblem(agreement.leadTimeClasses ?? [])),
} as const;

/**
 * A master agreement or schedule.
 *
 * @since 0.1.0
 * @category schemas
 */
export const Agreement = Schema.Struct({
  id: AgreementId,
  ...RevisionFields,
  level: AgreementLevel,
  kind: AgreementKind,
  title: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
  parties: Schema.Array(PartyRef).check(Schema.isMinLength(2)),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
  recordedAt: Instant,
  invoiceCurrency: Schema.optional(CurrencyCode),
  rateClause: Schema.optional(RateClauseRef),
  settlement: SettlementTerms,
  status: openVocabulary(['proposed', 'executed', 'terminated'] as const),
  /** Rights to reserve another party's capacity (capacity holds). */
  holdRights: Schema.optional(Schema.Array(HoldRight)),
  /** Lead-time price classes for capacity booked under this agreement. */
  leadTimeClasses: Schema.optional(Schema.Array(LeadTimeClass)),
  ...AssertionFields,
}).check(
  revisionChain,
  validInterval,
  verifiedHasEvidence,
  toCheck(agreementRules.distinctParties),
  toCheck(agreementRules.scheduleBilateral),
  toCheck(agreementRules.scheduleCurrency),
  toCheck(agreementRules.executedSigned),
  toCheck(agreementRules.uniqueHoldRights),
  toCheck(agreementRules.holdRightParties),
  toCheck(agreementRules.leadTimeClasses),
);
/** @since 0.1.0 @category models */
export type Agreement = typeof Agreement.Type;

/**
 * Whether the agreement is executed (status plus signed, digested evidence) and in force on `date`.
 *
 * @since 0.1.0
 * @category predicates
 */
export const isExecutedOn = (agreement: Agreement, date: string): boolean =>
  agreement.status === 'executed' && hasSignedEvidence(agreement) && contains(agreement, date);

/**
 * Cross-record checks: a schedule's master exists, is a master, and covers the schedule's parties.
 *
 * @since 0.1.0
 * @category validators
 */
export const validateAgreements = (agreements: ReadonlyArray<Agreement>): ReadonlyArray<ValidationIssue> => {
  const byId = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  return agreements.flatMap((agreement) => {
    const base = runRules({ rules: Object.values(agreementRules), value: agreement, subject: agreement.id });
    if (agreement.level._tag !== 'schedule') return base;
    const master = byId.get(agreement.level.masterId);
    if (master === undefined) return [...base, { code: 'agreement.master-unresolved', severity: 'warning' as const, subject: agreement.id, message: 'master is not in the set' }];
    const masterParties = new Set(master.parties.map(partyKey));
    return [
      ...base,
      ...(master.level._tag === 'master' ? [] : [{ code: 'agreement.master-not-master', severity: 'error' as const, subject: agreement.id, message: 'a schedule hangs from a master' }]),
      ...(agreement.parties.every((party) => masterParties.has(partyKey(party)))
        ? []
        : [{ code: 'agreement.schedule-party-not-in-master', severity: 'error' as const, subject: agreement.id, message: 'schedule parties are parties to the master' }]),
    ];
  });
};
