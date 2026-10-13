/** Qualification consumes the full admitted source cohort before visibility filters. */
import { Effect } from 'effect';
import { type ValidationIssue } from '../core/Issue.ts';
import { type SourceRecordRef } from '../mapping/SourceRecordRef.ts';
import type { ComputeEvent } from './EconomicEvent.ts';
import { type EmploymentFact } from './Employment.ts';
import { type WorkObservation, type WorkSourceCoverage } from './WorkObservation.ts';
export interface CohortQualification {
    readonly qualifiedIds: ReadonlySet<string>;
    readonly heldIds: ReadonlySet<string>;
    readonly issues: ReadonlyArray<ValidationIssue>;
}
export interface WorkCohortInput {
    readonly current: ReadonlyArray<WorkObservation>;
    readonly history: ReadonlyArray<WorkObservation>;
    readonly coverage: ReadonlyArray<WorkSourceCoverage>;
    readonly employments: ReadonlyArray<EmploymentFact>;
    readonly computeEvents: ReadonlyArray<ComputeEvent>;
    /** Host-selected canonical person namespace; discovery never supplies this authority. */
    readonly personNamespace: string;
}
export interface SourceRevisionRecord {
    readonly id: string;
    readonly revision: number;
    readonly digest: string;
    readonly supersedesDigest?: string | undefined;
}
/** Portable integrity gate for native host envelopes, preserving callback error/service types. */
export declare const validateSourceRevisionPopulation: <A extends SourceRevisionRecord, E, R>(input: {
    readonly current: ReadonlyArray<A>;
    readonly history: ReadonlyArray<A>;
    readonly identityKey: (row: A) => string;
    readonly digestFor: (row: A) => Effect.Effect<string, E, R>;
}) => Effect.Effect<Set<string>, E, R>;
export declare const coverageHoldsDate: (coverage: ReadonlyArray<WorkSourceCoverage>, date: string) => boolean;
/** Opaque source occurrence IDs remain valid; canonical UUIDs are never fabricated. */
export declare const sourceOccurrenceHolds: (history: ReadonlyArray<{
    readonly id: string;
    readonly source: SourceRecordRef;
    readonly qualifiedEvent?: {
        readonly id: string;
    } | undefined;
}>) => ReadonlySet<string>;
/** No missing population is silently treated as zero; unresolved performers hold the date. */
export declare const qualifyWorkCohort: (input: WorkCohortInput) => Effect.Effect<{
    heldIds: Set<string>;
    qualifiedIds: Set<string>;
    issues: {
        readonly message: string;
        readonly code: string;
        readonly severity: "error" | "warning" | "hold";
        readonly subject: string;
        readonly path?: string | undefined;
    }[];
}, import("../core/CanonicalJson.ts").CanonicalJsonError, never>;
//# sourceMappingURL=CohortQualification.d.ts.map