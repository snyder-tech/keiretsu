/**
 * Port: a payroll-register wage fact. Supplied by the adopter's payroll source
 * through `@snyder-tech/keiretsu/finance`. Regime cost bases are built from
 * these facts, never from loaded cost rates.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId, PersonId } from "../core/Actor.js";
import { EvidenceRef } from "../core/Envelope.js";
import { Money } from "../core/Money.js";
import { Period } from "../core/Temporal.js";
/**
 * Known wage kinds. `loaded-rate` exists so that a loaded cost arriving by
 * mistake is named and excluded rather than silently summed.
 *
 * @since 0.1.0
 * @category schemas
 */
export const KnownWageKind = Schema.Literals([
    'us-3401-box1',
    'statutory',
    'bonus',
    'benefits',
    'employer-tax',
    'overhead',
    'contractor-payment',
    'foreign-local-payroll',
    'loaded-rate',
]);
/**
 * Wage kind on the wire: a known kind or an `x-` extension.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WageKind = Schema.Union([KnownWageKind, Schema.String.check(Schema.isPattern(/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/))]);
/**
 * Wage fact port.
 *
 * @since 0.1.0
 * @category schemas
 */
export const WageFact = Schema.Struct({
    personId: PersonId,
    /** Legal payer of the wages (the employer of record for the period). */
    payer: EntityId,
    period: Period,
    wageKind: WageKind,
    amount: Money,
    evidence: Schema.Array(EvidenceRef),
});
/**
 * Stable reference text for a wage fact (used in derivation inputs).
 *
 * @since 0.1.0
 * @category accessors
 */
export const refOf = (fact) => `${fact.personId}/${fact.payer}/${fact.period}/${fact.wageKind}`;
//# sourceMappingURL=WageFact.js.map