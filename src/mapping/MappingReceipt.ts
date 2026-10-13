import { Effect, Schema } from 'effect';

import { digestValueSync, Sha256 } from '../core/CanonicalJson.ts';
import { IsoDate } from '../core/Temporal.ts';
import { CanonicalRef } from './CanonicalRef.ts';
import { mapSource, type MapSourceInput } from './MapSource.ts';
import { MappingResult } from './MappingResult.ts';
import { SourceRecordRef } from './SourceRecordRef.ts';

/** Deterministic evidence of a computation, separate from approval/application. */
export const MappingReceipt = Schema.Struct({
  source: SourceRecordRef,
  sourceDigest: Sha256,
  sourceSnapshotDigest: Sha256,
  sourceConfigurationDigest: Sha256,
  direction: Schema.Literals(['source-to-canonical', 'canonical-to-source']),
  installationLifecycle: Schema.Literals(['active', 'archived', 'retired']),
  sourceRecordLifecycle: Schema.Literals(['active', 'archived', 'retired']),
  mappingId: Schema.NonEmptyString,
  mappingVersion: Schema.NonEmptyString,
  mappingDigest: Sha256,
  registryRevision: Schema.NonEmptyString,
  bindingsDigest: Sha256,
  asOf: IsoDate,
  companyContext: Schema.optional(CanonicalRef),
  candidateDigest: Sha256,
  resultDigest: Sha256,
  digest: Sha256,
});
export type MappingReceipt = typeof MappingReceipt.Type;

export interface MappingReceiptInput extends MapSourceInput {
  readonly registryRevision: string;
  readonly installationLifecycle: MappingReceipt['installationLifecycle'];
  readonly sourceRecordLifecycle: MappingReceipt['sourceRecordLifecycle'];
}

/** Receipt and result are computed together from one configuration-bound packet. */
export const MappingComputation = Schema.Struct({ result: MappingResult, receipt: MappingReceipt });
export type MappingComputation = typeof MappingComputation.Type;

export const createMappingReceipt = Effect.fnUntraced(function* (input: MappingReceiptInput) {
  const result = mapSource(input);
  const snapshot = {
    source: input.source,
    values: input.values,
    sourceConfiguration: input.sourceConfiguration,
    direction: input.direction,
    installationLifecycle: input.installationLifecycle,
    sourceRecordLifecycle: input.sourceRecordLifecycle,
    asOf: input.asOf,
    ...(input.companyContext === undefined ? {} : { companyContext: input.companyContext }),
  };
  const fields = {
    source: input.source,
    sourceDigest: yield* digestValueSync(snapshot),
    sourceSnapshotDigest: yield* digestValueSync(input.values),
    sourceConfigurationDigest: yield* digestValueSync(input.sourceConfiguration),
    direction: input.direction,
    installationLifecycle: input.installationLifecycle,
    sourceRecordLifecycle: input.sourceRecordLifecycle,
    mappingId: input.mapping.id,
    mappingVersion: input.mapping.version,
    mappingDigest: yield* digestValueSync(input.mapping),
    registryRevision: input.registryRevision,
    bindingsDigest: yield* digestValueSync(input.bindings),
    asOf: input.asOf,
    ...(input.companyContext === undefined ? {} : { companyContext: input.companyContext }),
    candidateDigest: yield* digestValueSync(result.candidates),
    resultDigest: yield* digestValueSync(result),
  };
  const receipt = yield* Schema.decodeUnknownEffect(MappingReceipt)({ ...fields, digest: yield* digestValueSync(fields) });
  return { result, receipt } satisfies MappingComputation;
});
