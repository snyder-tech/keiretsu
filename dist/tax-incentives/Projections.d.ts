/** Projections from attested source records to the incentive ports. Decision support; professional review required. @since 0.1.0 @module */
import type { EventId } from '../core/Ids.ts';
import { Effect } from 'effect';
import type { TransferRoute } from '../commerce/TransferRoute.ts';
import type { Keiretsu, KeySpace } from '../entity/Keiretsu.ts';
import { type LabourEvent, type ComputeEvent } from '../work/EconomicEvent.ts';
import type { EmploymentFact } from '../work/Employment.ts';
import { EntityTaxProfile, type Registration } from './EntityTaxProfile.ts';
import { LabourFact } from './LabourFact.ts';
import type { TransferFact } from './TransferFact.ts';
declare const ProjectionError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "ProjectionError";
} & Readonly<A>;
/** @since 0.1.0 @category errors */
export declare class ProjectionError extends ProjectionError_base<{
    readonly adapter: string;
    readonly reason: string;
}> {
}
/** Source records still require complete work-set validation before tax screening. @since 0.1.0 @category projections */
export declare const labourFact: (event: LabourEvent, context: {
    readonly computeEvents: ReadonlyArray<ComputeEvent>;
}) => Effect.Effect<LabourFact, ProjectionError>;
/**
 * Commerce route legs between group entities → tax `TransferFact`s for one event (legs to
 * counterparties have no entity recipient and are omitted).
 *
 * @since 0.1.0
 * @category tax
 */
export declare const transferFacts: (route: TransferRoute, eventId: EventId) => ReadonlyArray<TransferFact>;
/**
 * Entity engagements → work `EmploymentFact` port (only engagements whose employer is a group entity).
 *
 * @since 0.1.0
 * @category entity
 */
export declare const employmentFacts: <K extends KeySpace>(group: Keiretsu<K>) => ReadonlyArray<EmploymentFact>;
/**
 * Entity → tax `EntityTaxProfile` port. Fiscal year must be month-end; 52–53-week years are refused.
 *
 * @since 0.1.0
 * @category entity
 */
export declare const entityTaxProfile: <K extends KeySpace>(group: Keiretsu<K>, options: {
    readonly entity: K["entity"];
    readonly date: string;
    readonly passThrough: boolean;
    readonly registrations: ReadonlyArray<Registration>;
}) => Effect.Effect<EntityTaxProfile, ProjectionError>;
export {};
//# sourceMappingURL=Projections.d.ts.map