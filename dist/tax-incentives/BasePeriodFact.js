/**
 * Base-period facts for regimes whose computation looks back at prior years.
 * A missing year is `unknown`, never zero; a year with no qualifying spend is
 * stated as `attested-none` with evidence.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { EvidenceRef } from "../core/Envelope.js";
import { RegimeId } from "../core/Ids.js";
import { Money } from "../core/Money.js";
import { TaxYearLabel } from "./TaxYear.js";
/**
 * One prior year's base amount status.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BasePeriodFact = Schema.Struct({
    claimant: EntityId,
    regimeId: RegimeId,
    taxYear: TaxYearLabel,
    status: Schema.Literals(['known', 'unknown', 'attested-none']),
    amount: Schema.optional(Money),
    evidence: Schema.Array(EvidenceRef),
}).check(Schema.makeFilter((fact) => (fact.status === 'known') === (fact.amount !== undefined) ? undefined : 'an amount is present exactly when the status is known'), Schema.makeFilter((fact) => (fact.status === 'attested-none' && fact.evidence.length === 0 ? 'attested-none requires evidence' : undefined)));
//# sourceMappingURL=BasePeriodFact.js.map