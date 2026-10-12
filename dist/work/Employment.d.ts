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
import { EntityId } from '../core/Ids.ts';
import { Schema } from 'effect';
/**
 * A person's employer over a half-open interval. Supplied by `keiretsu-entity` engagements.
 *
 * @since 0.1.0
 * @category ports
 */
export declare const EmploymentFact: Schema.Struct<{
    readonly person: Schema.brand<Schema.String, "keiretsu/PersonId">;
    readonly employer: Schema.brand<Schema.String, "keiretsu/EntityId">;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type EmploymentFact = typeof EmploymentFact.Type;
/**
 * The employers of a person on a date. Empty means unknown, not "none".
 *
 * @since 0.1.0
 * @category queries
 */
export declare const employersOn: (facts: ReadonlyArray<EmploymentFact>, person: string, date: string) => ReadonlyArray<EntityId>;
//# sourceMappingURL=Employment.d.ts.map