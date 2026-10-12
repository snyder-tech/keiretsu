import { Data, Effect, Schema } from 'effect';
import { digestValue } from "../core/CanonicalJson.js";
import { EconomicEvent } from "../work/EconomicEvent.js";
import { EntityTaxProfile } from "./EntityTaxProfile.js";
import { LabourFact } from "./LabourFact.js";
/** @since 0.1.0 @category errors */
export class ProjectionError extends Data.TaggedError('ProjectionError') {
}
const refuse = (adapter, reason) => Effect.fail(new ProjectionError({ adapter, reason }));
/** Source records still require complete work-set validation before tax screening. @since 0.1.0 @category projections */
export const labourFact = (event, context) => Effect.gen(function* () {
    if (event.person._tag !== 'identified')
        return yield* refuse('labourFact', 'a pseudonymous labour event cannot feed a tax slice; the employer re-identifies it');
    if (event.attestedBy._tag !== 'human')
        return yield* refuse('labourFact', 'labour requires human attestation');
    const unresolved = event.assistedBy.filter((id) => !context.computeEvents.some((source) => source._tag === 'compute' && source.id === id));
    if (unresolved.length > 0)
        return yield* refuse('labourFact', `unresolved compute references: ${unresolved.join(', ')}`);
    return yield* Schema.decodeUnknownEffect(LabourFact)({
        eventId: event.id,
        eventDigest: yield* Schema.encodeEffect(EconomicEvent)(event).pipe(Effect.flatMap(digestValue)),
        personId: event.person.personId,
        engagementId: event.engagementId,
        employer: event.employer,
        situs: event.situs,
        workDate: event.workDate,
        minutes: event.minutes,
        aiAssisted: event.assistedBy.length > 0,
    });
}).pipe(Effect.mapError((error) => (error instanceof ProjectionError ? error : new ProjectionError({ adapter: 'labourFact', reason: String(error) }))));
const LEG_KINDS = {
    'cost-plus': 'cost-plus',
    'cost-reimbursement': 'pass-through',
    'pass-through-disbursement': 'pass-through',
    'time-and-materials': 'time-and-materials',
    'fixed-fee': 'fixed-fee',
    'value-based': 'value-based',
};
/**
 * Commerce route legs between group entities → tax `TransferFact`s for one event (legs to
 * counterparties have no entity recipient and are omitted).
 *
 * @since 0.1.0
 * @category tax
 */
export const transferFacts = (route, eventId) => route.legs.flatMap((leg) => {
    if (leg.provider._tag !== 'entity' || leg.recipient._tag !== 'entity')
        return [];
    const legKind = LEG_KINDS[leg.billingMode._tag] ?? `x-${leg.billingMode._tag}`;
    return [{ eventId, legId: leg.id, agreementId: leg.agreementId, fromEntity: leg.provider.entityId, toEntity: leg.recipient.entityId, legKind }];
});
/**
 * Entity engagements → work `EmploymentFact` port (only engagements whose employer is a group entity).
 *
 * @since 0.1.0
 * @category entity
 */
export const employmentFacts = (group) => group.model.engagements.flatMap((engagement) => {
    const person = group.model.people.find((entry) => entry.key === engagement.person);
    const employer = group.model.entities.find((entry) => entry.key === engagement.employer);
    if (person === undefined || employer === undefined)
        return [];
    return [{ person: person.id, employer: employer.id, validFrom: engagement.validFrom, ...(engagement.validTo === undefined ? {} : { validTo: engagement.validTo }) }];
});
/**
 * Entity → tax `EntityTaxProfile` port. Fiscal year must be month-end; 52–53-week years are refused.
 *
 * @since 0.1.0
 * @category entity
 */
export const entityTaxProfile = (group, options) => {
    const entity = group.entity(options.entity);
    const fiscal = entity.fiscalYear.find((span) => span.validFrom <= options.date && (span.validTo === undefined || options.date < span.validTo))?.value;
    const currency = group.functionalCurrency(options.entity, options.date);
    if (fiscal === undefined || fiscal._tag !== 'month-end' || currency === undefined)
        return refuse('entityTaxProfile', `${options.entity} has no month-end fiscal year or functional currency on ${options.date}`);
    return Schema.decodeUnknownEffect(EntityTaxProfile)({
        entityId: entity.id,
        situs: entity.jurisdiction,
        functionalCurrency: currency,
        fiscalYearEndMonth: fiscal.endMonth,
        passThrough: options.passThrough,
        registrations: options.registrations,
    }).pipe(Effect.mapError((error) => new ProjectionError({ adapter: 'entityTaxProfile', reason: String(error) })));
};
//# sourceMappingURL=Projections.js.map