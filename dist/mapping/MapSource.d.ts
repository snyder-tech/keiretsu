import { type IsoDate } from '../core/Temporal.ts';
import { type CanonicalRef } from './CanonicalRef.ts';
import { type MappingDefinition, MappingValue, type SourceConfiguration } from './MappingDefinition.ts';
import { type MappingResult } from './MappingResult.ts';
import { type SourceBinding } from './SourceBinding.ts';
import { type SourceRecordRef } from './SourceRecordRef.ts';
export interface MapSourceInput {
    readonly source: SourceRecordRef;
    readonly values: Readonly<Record<string, unknown>>;
    readonly sourceConfiguration: SourceConfiguration;
    readonly mapping: MappingDefinition;
    readonly bindings: ReadonlyArray<SourceBinding>;
    readonly asOf: IsoDate;
    readonly direction: MappingDefinition['direction'];
    readonly companyContext?: CanonicalRef | undefined;
}
/** Pure candidate projection; source claims are never trusted binding or field authority. */
export declare const mapSource: (input: MapSourceInput) => MappingResult;
/** Compare candidates to current facts without selecting authority or mutating records. */
export declare const mappingConflicts: (result: MappingResult, current: Readonly<Record<string, MappingValue>>) => MappingResult;
//# sourceMappingURL=MapSource.d.ts.map