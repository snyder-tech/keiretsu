/**
 * Employment port: who employs a person on a date.
 *
 * The authoritative engagement record (relationship, payer, host, work country
 * and its evidence) belongs to `@snyder-tech/keiretsu/entity`. The work package
 * needs only this narrow projection to screen human approvals for
 * permanent-establishment risk (a person acting for an entity other than their
 * employer) and to confirm the employer named on labour events.
 *
 * @since 0.1.0
 * @module
 */
import { EntityId, PersonId } from "../core/Ids.js";
import { contains, IsoDate } from "../core/Temporal.js";
import { Schema } from 'effect';
/**
 * A person's employer over a half-open interval. Supplied by `keiretsu-entity` engagements.
 *
 * @since 0.1.0
 * @category ports
 */
export const EmploymentFact = Schema.Struct({
    person: PersonId,
    employer: EntityId,
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
});
/**
 * The employers of a person on a date. Empty means unknown, not "none".
 *
 * @since 0.1.0
 * @category queries
 */
export const employersOn = (facts, person, date) => facts.filter((fact) => fact.person === person && contains(fact, date)).map((fact) => fact.employer);
//# sourceMappingURL=Employment.js.map