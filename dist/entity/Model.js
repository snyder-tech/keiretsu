import { extentOf, normalize } from "./Timeline.js";
const keyed = (record) => Object.entries(record ?? {}).map(([key, value]) => ({ ...value, key }));
const entityOf = (key, input) => {
    const lifecycle = normalize(input.lifecycle, { validFrom: input.lifecycle[0].validFrom });
    const extent = extentOf(lifecycle);
    return {
        key,
        id: input.id,
        formerKeys: input.formerKeys ?? [],
        legalName: normalize(input.legalName, extent),
        legalForm: input.legalForm,
        jurisdiction: input.jurisdiction,
        identifiers: input.identifiers ?? [],
        functionalCurrency: normalize(input.functionalCurrency, extent),
        reportingCurrency: input.reportingCurrency,
        fiscalYear: normalize(input.fiscalYear, extent),
        accountingBasis: normalize(input.accountingBasis, extent),
        booksSystem: input.booksSystem === undefined ? undefined : normalize(input.booksSystem, extent),
        lifecycle,
        workCalendar: input.workCalendar,
    };
};
/**
 * Normalize decoded config into the model.
 *
 * @since 0.1.0
 * @category constructors
 */
export const toModel = (input) => ({
    tenant: input.tenant,
    entities: Object.entries(input.entities).map(([key, entity]) => entityOf(key, entity)),
    counterparties: keyed(input.counterparties),
    brands: keyed(input.brands),
    systems: keyed(input.systems),
    ownership: input.ownership ?? [],
    control: input.control ?? [],
    taxGroups: keyed(input.taxGroups),
    people: keyed(input.people).map((person) => ({ key: person.key, id: person.id, subjects: person.subjects ?? [] })),
    engagements: input.engagements ?? [],
    workCalendars: keyed(input.workCalendars),
    holidayPacks: keyed(input.holidayPacks),
    currencies: input.currencies ?? [],
    countries: input.countries ?? [],
});
/**
 * Key sets of a model.
 *
 * @since 0.1.0
 * @category models
 */
export const keySets = (model) => {
    const entity = new Set(model.entities.map((record) => record.key));
    const counterparty = new Set(model.counterparties.map((record) => record.key));
    const person = new Set(model.people.map((record) => record.key));
    return {
        entity,
        counterparty,
        person,
        party: new Set([...entity, ...counterparty, ...person]),
        system: new Set(model.systems.map((record) => record.key)),
        calendar: new Set(model.workCalendars.map((record) => record.key)),
        holidayPack: new Set(model.holidayPacks.map((record) => record.key)),
    };
};
//# sourceMappingURL=Model.js.map