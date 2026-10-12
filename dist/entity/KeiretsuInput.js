/**
 * The adopter's group configuration, authored as data:
 *
 * ```ts
 * export const group = { tenant: 'northwind', entities: { … } } as const satisfies KeiretsuInput
 * ```
 *
 * Declaring config as a plain `as const` value keeps it declaration-safe, and
 * {@link KeySpaceOf} derives one flat literal key space from it, so downstream
 * APIs are generic over a small `KeySpace`, never over the whole config.
 *
 * @since 0.1.0
 * @module
 */
import { CountryCode } from "../core/Country.js";
import { CurrencyCode } from "../core/Currency.js";
import { Schema } from 'effect';
import { BrandInput } from "./Brand.js";
import { ControlEdge } from "./Control.js";
import { CounterpartyInput } from "./Counterparty.js";
import { EngagementInput } from "./Engagement.js";
import { LegalEntityInput } from "./LegalEntity.js";
import { OwnershipEdge } from "./Ownership.js";
import { PersonInput } from "./Person.js";
import { SystemInput } from "./SystemOfRecord.js";
import { TaxGroupInput } from "./TaxGroup.js";
import { HolidayPack, WorkCalendar } from "./WorkCalendar.js";
/**
 * Lower-kebab slug used for every config key.
 *
 * @since 0.1.0
 * @category patterns
 */
export const SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
/**
 * The configuration schema. Structural only; cross-record invariants run in `Invariants`.
 *
 * @since 0.1.0
 * @category schemas
 */
export const KeiretsuInput = Schema.Struct({
    tenant: Schema.String.check(Schema.isPattern(SLUG_PATTERN)),
    entities: Schema.Record(Schema.String, LegalEntityInput),
    counterparties: Schema.optional(Schema.Record(Schema.String, CounterpartyInput)),
    brands: Schema.optional(Schema.Record(Schema.String, BrandInput)),
    systems: Schema.optional(Schema.Record(Schema.String, SystemInput)),
    ownership: Schema.optional(Schema.Array(OwnershipEdge)),
    control: Schema.optional(Schema.Array(ControlEdge)),
    taxGroups: Schema.optional(Schema.Record(Schema.String, TaxGroupInput)),
    people: Schema.optional(Schema.Record(Schema.String, PersonInput)),
    engagements: Schema.optional(Schema.Array(EngagementInput)),
    workCalendars: Schema.optional(Schema.Record(Schema.String, WorkCalendar)),
    holidayPacks: Schema.optional(Schema.Record(Schema.String, HolidayPack)),
    currencies: Schema.optional(Schema.Array(CurrencyCode)),
    countries: Schema.optional(Schema.Array(CountryCode)),
});
//# sourceMappingURL=KeiretsuInput.js.map