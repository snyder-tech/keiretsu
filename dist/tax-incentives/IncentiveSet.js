/**
 * The input set screened together: regimes, entity profiles, components,
 * labour/wage/transfer facts from other packages, slices, funding assessments,
 * controlled groups, attributions and base-period facts.
 *
 * @since 0.1.0
 * @module
 */
import { Schema } from 'effect';
import { IsoDate } from "../core/Temporal.js";
import { BasePeriodFact } from "./BasePeriodFact.js";
import { BusinessComponent } from "./BusinessComponent.js";
import { ClaimantAttribution } from "./ClaimantAttribution.js";
import { ControlledGroupYear } from "./ControlledGroupYear.js";
import { EntityTaxProfile } from "./EntityTaxProfile.js";
import { FundingAssessment } from "./FundingAssessment.js";
import { IncentiveRegime } from "./IncentiveRegime.js";
import { LabourFact } from "./LabourFact.js";
import { TaxActivitySlice } from "./TaxActivitySlice.js";
import { TransferFact } from "./TransferFact.js";
import { WageFact } from "./WageFact.js";
/**
 * An incentive screening set.
 *
 * @since 0.1.0
 * @category schemas
 */
export const IncentiveSet = Schema.Struct({
    /** The date the screen is run for (citation staleness is measured to it). */
    asOf: IsoDate,
    regimes: Schema.Array(IncentiveRegime),
    entities: Schema.Array(EntityTaxProfile),
    components: Schema.Array(BusinessComponent),
    labour: Schema.Array(LabourFact),
    wages: Schema.Array(WageFact),
    transfers: Schema.Array(TransferFact),
    slices: Schema.Array(TaxActivitySlice),
    fundings: Schema.Array(FundingAssessment),
    groups: Schema.Array(ControlledGroupYear),
    attributions: Schema.Array(ClaimantAttribution),
    basePeriods: Schema.Array(BasePeriodFact),
});
const byKey = (items, key) => {
    const map = new Map();
    for (const item of items)
        if (!map.has(key(item)))
            map.set(key(item), item);
    return map;
};
const groupBy = (items, key) => {
    const map = new Map();
    for (const item of items)
        map.set(key(item), [...(map.get(key(item)) ?? []), item]);
    return map;
};
/**
 * Build the lookup tables.
 *
 * @since 0.1.0
 * @category constructors
 */
export const indexSet = (set) => ({
    set,
    regimes: byKey(set.regimes, (regime) => regime.id),
    entities: byKey(set.entities, (entity) => entity.entityId),
    components: byKey(set.components, (component) => component.id),
    labour: byKey(set.labour, (fact) => fact.eventId),
    slices: byKey(set.slices, (slice) => slice.id),
    fundings: byKey(set.fundings, (funding) => funding.id),
    groups: byKey(set.groups, (group) => group.id),
    transfersByEvent: groupBy(set.transfers, (transfer) => transfer.eventId),
});
//# sourceMappingURL=IncentiveSet.js.map