/**
 * The normalized group model: decoded config with every timeline expanded and
 * every keyed record carrying its key.
 *
 * @since 0.1.0
 * @module
 */
import type { CountryCode } from '../core/Country.ts';
import type { CurrencyCode } from '../core/Currency.ts';
import type { Brand } from './Brand.ts';
import type { ControlEdge } from './Control.ts';
import type { Counterparty } from './Counterparty.ts';
import type { Engagement } from './Engagement.ts';
import type { DecodedInput } from './KeiretsuInput.ts';
import type { LegalEntity } from './LegalEntity.ts';
import type { OwnershipEdge } from './Ownership.ts';
import type { Person } from './Person.ts';
import type { SystemOfRecord } from './SystemOfRecord.ts';
import type { TaxGroup } from './TaxGroup.ts';
import type { HolidayPack, WorkCalendar } from './WorkCalendar.ts';
/**
 * A keyed record.
 *
 * @since 0.1.0
 * @category models
 */
export type Keyed<A> = A & {
    readonly key: string;
};
/**
 * The normalized model.
 *
 * @since 0.1.0
 * @category models
 */
export interface KeiretsuModel {
    readonly tenant: string;
    readonly entities: ReadonlyArray<LegalEntity>;
    readonly counterparties: ReadonlyArray<Counterparty>;
    readonly brands: ReadonlyArray<Brand>;
    readonly systems: ReadonlyArray<SystemOfRecord>;
    readonly ownership: ReadonlyArray<OwnershipEdge>;
    readonly control: ReadonlyArray<ControlEdge>;
    readonly taxGroups: ReadonlyArray<TaxGroup>;
    readonly people: ReadonlyArray<Person>;
    readonly engagements: ReadonlyArray<Engagement>;
    readonly workCalendars: ReadonlyArray<Keyed<WorkCalendar>>;
    readonly holidayPacks: ReadonlyArray<Keyed<HolidayPack>>;
    readonly currencies: ReadonlyArray<CurrencyCode>;
    readonly countries: ReadonlyArray<CountryCode>;
}
/**
 * Normalize decoded config into the model.
 *
 * @since 0.1.0
 * @category constructors
 */
export declare const toModel: (input: DecodedInput) => KeiretsuModel;
/**
 * Declared key sets, for reference checks.
 *
 * @since 0.1.0
 * @category models
 */
export interface KeySets {
    readonly entity: ReadonlySet<string>;
    readonly counterparty: ReadonlySet<string>;
    readonly person: ReadonlySet<string>;
    readonly party: ReadonlySet<string>;
    readonly system: ReadonlySet<string>;
    readonly calendar: ReadonlySet<string>;
    readonly holidayPack: ReadonlySet<string>;
}
/**
 * Key sets of a model.
 *
 * @since 0.1.0
 * @category models
 */
export declare const keySets: (model: KeiretsuModel) => KeySets;
//# sourceMappingURL=Model.d.ts.map