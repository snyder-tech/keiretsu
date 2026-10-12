import { actsForEntity } from '../core/PartyRef.ts';
/**
 * Invariants over people, engagements and work calendars.
 *
 * | Code | Severity | Rule |
 * | --- | --- | --- |
 * | `person.subject-duplicate` | error | (issuer, system, subject) is unique |
 * | `engagement.paying-agent-agreement` | error | a paying agent is present exactly when a reimbursement agreement is |
 * | `engagement.paying-agent-is-employer` | warning | the paying agent differs from the employer |
 * | `engagement.secondee-host` | error | a secondee has a host different from the employer |
 * | `engagement.overlap` | error | one active engagement per person, employer and date |
 * | `engagement.relationship-evidence-missing` | error | the legal relationship cites evidence |
 * | `engagement.eor-employer` | warning | an `eor-placed` engagement names a counterparty employer |
 * | `engagement.cost-bearer` | error | the cost bearer is a declared entity |
 * | `engagement.decider-unknown` | warning | the decider acts for a declared entity |
 * | `engagement.withholding-unknown` | hold | the withholding regime is in the regime pack |
 * | `engagement.social-security-unknown` | hold | each social-security regime is in the regime pack |
 * | `engagement.withholding-country` | warning | the withholding regime's country is the payroll country |
 * | `calendar.holiday-duplicate` | error | a pack lists a (date, name) once |
 * | `calendar.weekend-duplicate` | error | weekend days are listed once |
 * | `calendar.pack-jurisdiction` | warning | a calendar's packs are for its country |
 *
 * @since 0.1.0
 * @module
 */
import { issue, type ValidationIssue } from '../core/Issue.ts';
import { overlaps } from '../core/Temporal.ts';

import type { Engagement } from './Engagement.ts';
import type { KeiretsuModel, KeySets } from './Model.ts';
import { lookup, type RegimeCodePack } from './RegimePack.ts';

const subjectOf = (index: number): string => `engagements[${index}]`;

const subjectDuplicates = (model: KeiretsuModel): ReadonlyArray<ValidationIssue> => {
  const seen = new Set<string>();
  return model.people.flatMap((person) =>
    person.subjects.flatMap((ref) => {
      const key = `${ref.issuer}|${ref.system ?? ''}|${ref.subject}`;
      if (seen.has(key)) return [issue('person.subject-duplicate', 'error', `people.${person.key}`, `subject ${ref.subject} at ${ref.issuer} is already mapped`)];
      seen.add(key);
      return [];
    }),
  );
};

const agentIssues = (engagement: Engagement, subject: string): ReadonlyArray<ValidationIssue> => {
  if ((engagement.payingAgent === undefined) !== (engagement.reimbursementAgreementId === undefined)) {
    return [issue('engagement.paying-agent-agreement', 'error', subject, 'a paying agent requires a reimbursement agreement and vice versa')];
  }
  return engagement.payingAgent !== undefined && engagement.payingAgent === engagement.employer
    ? [issue('engagement.paying-agent-is-employer', 'warning', subject, 'the paying agent is the employer itself')]
    : [];
};

const relationshipIssues = (engagement: Engagement, subject: string, keys: KeySets): ReadonlyArray<ValidationIssue> => {
  const kind = engagement.relationship.kind;
  return [
    ...(engagement.relationship.evidence.length === 0 ? [issue('engagement.relationship-evidence-missing', 'error', subject, 'the legal relationship must cite evidence')] : []),
    ...(kind === 'secondee' && (engagement.host === undefined || engagement.host === engagement.employer)
      ? [issue('engagement.secondee-host', 'error', subject, 'a secondee needs a host other than the employer')]
      : []),
    ...(kind === 'eor-placed' && !keys.counterparty.has(engagement.employer) ? [issue('engagement.eor-employer', 'warning', subject, 'an employer of record is normally a counterparty')] : []),
  ];
};

const referenceIssues = (engagement: Engagement, subject: string, keys: KeySets): ReadonlyArray<ValidationIssue> => {
  const parties: ReadonlyArray<readonly [string, string | undefined]> = [
    ['employer', engagement.employer],
    ['contractingParty', engagement.contractingParty],
    ['payingAgent', engagement.payingAgent],
    ['host', engagement.host],
  ];
  return [
    ...(keys.person.has(engagement.person) ? [] : [issue('ref.unresolved', 'error', subject, `person ${engagement.person} is not declared`)]),
    ...parties.flatMap(([field, key]) => (key === undefined || keys.party.has(key) ? [] : [issue('ref.unresolved', 'error', subject, `${field} ${key} is not declared`)])),
    ...(keys.entity.has(engagement.costBearer) ? [] : [issue('engagement.cost-bearer', 'error', subject, `cost bearer ${engagement.costBearer} is not a declared entity`)]),
    ...(engagement.workCalendar === undefined || keys.calendar.has(engagement.workCalendar)
      ? []
      : [issue('ref.unresolved', 'error', subject, `work calendar ${engagement.workCalendar} is not declared`)]),
  ];
};

const regimeIssues = (engagement: Engagement, subject: string, pack: RegimeCodePack): ReadonlyArray<ValidationIssue> => {
  const withholding = lookup(pack, engagement.withholdingRegime);
  return [
    ...(withholding === undefined || withholding.kind !== 'withholding'
      ? [issue('engagement.withholding-unknown', 'hold', subject, `withholding regime ${engagement.withholdingRegime} is not in pack ${pack.edition}`)]
      : []),
    ...(withholding !== undefined && withholding.country !== engagement.payrollCountry
      ? [issue('engagement.withholding-country', 'warning', subject, `regime ${withholding.code} is for ${withholding.country}, payroll is in ${engagement.payrollCountry}`)]
      : []),
    ...engagement.socialSecurityRegimes.flatMap((code) =>
      lookup(pack, code)?.kind === 'social-security' ? [] : [issue('engagement.social-security-unknown', 'hold', subject, `social-security regime ${code} is not in pack ${pack.edition}`)],
    ),
  ];
};

const overlapIssues = (engagements: ReadonlyArray<Engagement>): ReadonlyArray<ValidationIssue> =>
  engagements.flatMap((engagement, index) =>
    engagements
      .slice(index + 1)
      .filter((other) => other.person === engagement.person && other.employer === engagement.employer && overlaps(engagement, other))
      .map(() => issue('engagement.overlap', 'error', subjectOf(index), `${engagement.person} has overlapping engagements with ${engagement.employer}`)),
  );

const deciderIssues = (engagement: Engagement, subject: string, model: KeiretsuModel): ReadonlyArray<ValidationIssue> =>
  model.entities.some((entity) => actsForEntity(engagement.relationship.decidedBy.actingFor, entity.id))
    ? []
    : [issue('engagement.decider-unknown', 'warning', subject, 'the decider acts for an entity outside this group')];

const calendarIssues = (model: KeiretsuModel, keys: KeySets): ReadonlyArray<ValidationIssue> => [
  ...model.holidayPacks.flatMap((pack) => {
    const dates = pack.entries.map((entry) => `${entry.date}|${entry.name}`);
    return new Set(dates).size === dates.length ? [] : [issue('calendar.holiday-duplicate', 'error', `holidayPacks.${pack.key}`, 'a holiday is listed twice')];
  }),
  ...model.workCalendars.flatMap((calendar) => {
    const subject = `workCalendars.${calendar.key}`;
    const packs = model.holidayPacks.filter((pack) => calendar.holidayPacks.includes(pack.key));
    return [
      ...(new Set(calendar.weekendDays).size === calendar.weekendDays.length ? [] : [issue('calendar.weekend-duplicate', 'error', subject, 'a weekend day is listed twice')]),
      ...calendar.holidayPacks.flatMap((key) => (keys.holidayPack.has(key) ? [] : [issue('ref.unresolved', 'error', subject, `holiday pack ${key} is not declared`)])),
      ...packs.flatMap((pack) =>
        pack.jurisdiction.country === calendar.jurisdiction.country ? [] : [issue('calendar.pack-jurisdiction', 'warning', subject, `pack ${pack.key} is for ${pack.jurisdiction.country}`)],
      ),
    ];
  }),
];

/**
 * Validate people, engagements and calendars.
 *
 * @since 0.1.0
 * @category validation
 */
export const validatePeople = (options: { readonly model: KeiretsuModel; readonly keys: KeySets; readonly regimePack: RegimeCodePack }): ReadonlyArray<ValidationIssue> => [
  ...subjectDuplicates(options.model),
  ...options.model.engagements.flatMap((engagement, index) => {
    const subject = subjectOf(index);
    return [
      ...referenceIssues(engagement, subject, options.keys),
      ...agentIssues(engagement, subject),
      ...relationshipIssues(engagement, subject, options.keys),
      ...regimeIssues(engagement, subject, options.regimePack),
      ...deciderIssues(engagement, subject, options.model),
    ];
  }),
  ...overlapIssues(options.model.engagements),
  ...calendarIssues(options.model, options.keys),
];
