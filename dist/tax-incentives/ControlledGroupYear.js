/**
 * Controlled-group context per taxable year. Membership whose ownership is
 * not verified stays `undetermined` and blocks group-level outputs instead of
 * being guessed. Supplied by `@snyder-tech/keiretsu/entity` control edges and
 * confirmed by a human.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { EvidenceRef } from "../core/Envelope.js";
import { AttributionId } from "../core/Ids.js";
import { TaxYearLabel } from "./TaxYear.js";
/**
 * Controlled group for one taxable year.
 *
 * @since 0.1.0
 * @category schemas
 */
export const ControlledGroupYear = Schema.Struct({
    id: AttributionId,
    taxYear: TaxYearLabel,
    members: Schema.NonEmptyArray(EntityId),
    status: Schema.Literals(['established', 'undetermined']),
    evidence: Schema.Array(EvidenceRef),
});
/**
 * The group record for a tax year that contains every listed entity, if any.
 *
 * @since 0.1.0
 * @category accessors
 */
export const groupContaining = (groups, taxYear, entities) => groups.find((group) => group.taxYear === taxYear && entities.every((entity) => group.members.some((member) => member === entity)));
//# sourceMappingURL=ControlledGroupYear.js.map