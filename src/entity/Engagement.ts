/**
 * Engagements: a person working for an employer, with the legal relationship,
 * who contracts, who pays, who bears the cost, who hosts the work and where
 * payroll, tax residence and work happen.
 *
 * The legal relationship is a human determination with evidence; there is no
 * default and this package never classifies anyone. Withholding and
 * social-security regimes are open codes checked against a data pack after
 * decode. Decision support; professional review required.
 *
 * @since 0.1.0
 * @module
 */
import { HumanActorSchema } from '../core/Actor.ts';
import { Situs, CountryCode } from '../core/Country.ts';
import { EvidenceRef } from '../core/Envelope.ts';
import { AgreementId, EngagementId } from '../core/Ids.ts';
import { Instant, IsoDate } from '../core/Temporal.ts';
import { Schema } from 'effect';

import { RegimeCode } from './RegimePack.ts';

/**
 * Legal relationship kinds. `eor-placed` means an employer of record is the legal employer.
 *
 * @since 0.1.0
 * @category schemas
 */
export const RelationshipKind = Schema.Literals(['employee', 'contractor', 'secondee', 'officer', 'eor-placed']);
/** @since 0.1.0 @category models */
export type RelationshipKind = typeof RelationshipKind.Type;

/**
 * A human decider, structurally the core `HumanActor`: agents and systems cannot classify.
 *
 * @since 0.1.0
 * @category schemas
 */
export const HumanDecider = HumanActorSchema;

/**
 * The legal relationship, its evidence and who determined it.
 *
 * @since 0.1.0
 * @category schemas
 */
export const LegalRelationship = Schema.Struct({
  kind: RelationshipKind,
  evidence: Schema.Array(EvidenceRef),
  decidedBy: HumanDecider,
  decidedAt: Instant,
});

/**
 * IANA time zone name.
 *
 * @since 0.1.0
 * @category schemas
 */
export const TimeZone = Schema.String.check(Schema.isPattern(/^(?:UTC|[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+)$/));

/**
 * Full-time equivalence in basis points (10,000 = full time).
 *
 * @since 0.1.0
 * @category schemas
 */
export const FteBps = Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 10_000 }));

/**
 * An engagement as authored in config. Party fields name declared keys.
 *
 * @since 0.1.0
 * @category schemas
 */
export const EngagementInput = Schema.Struct({
  id: EngagementId,
  person: Schema.NonEmptyString,
  employer: Schema.NonEmptyString,
  contractingParty: Schema.NonEmptyString,
  payingAgent: Schema.optional(Schema.NonEmptyString),
  reimbursementAgreementId: Schema.optional(AgreementId),
  costBearer: Schema.NonEmptyString,
  host: Schema.optional(Schema.NonEmptyString),
  relationship: LegalRelationship,
  payrollCountry: CountryCode,
  taxResidence: Situs,
  workLocation: Situs,
  timeZone: Schema.optional(TimeZone),
  withholdingRegime: RegimeCode,
  socialSecurityRegimes: Schema.Array(RegimeCode),
  fteBps: FteBps,
  workCalendar: Schema.optional(Schema.NonEmptyString),
  validFrom: IsoDate,
  validTo: Schema.optional(IsoDate),
});
/** @since 0.1.0 @category models */
export type EngagementInput = typeof EngagementInput.Encoded;
/** @since 0.1.0 @category models */
export type Engagement = typeof EngagementInput.Type;
