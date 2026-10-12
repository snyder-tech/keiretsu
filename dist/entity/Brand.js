/**
 * Brands, trade names and DBAs. Brands are presentation only: the legal entity
 * named by `entity` always contracts (UBL `PartyLegalEntity`, not `PartyName`).
 *
 * @since 0.1.0
 * @module
 */
import { IsoDate } from "../core/Temporal.js";
import { Schema } from 'effect';
/**
 * A brand as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export const BrandInput = Schema.Struct({
    entity: Schema.NonEmptyString,
    name: Schema.NonEmptyString,
    kind: Schema.Literals(['dba', 'trade-name', 'product-brand']),
    validFrom: IsoDate,
    validTo: Schema.optional(IsoDate),
});
//# sourceMappingURL=Brand.js.map