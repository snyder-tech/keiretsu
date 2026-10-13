import { Effect, Schema } from 'effect';
import { digestValueSync, Sha256 } from "../core/CanonicalJson.js";
import { IsoDate } from "../core/Temporal.js";
import { CanonicalRef, canonicalRefKey } from "./CanonicalRef.js";
import { createMappingReceipt, MappingComputation } from "./MappingReceipt.js";
import {} from "./MappingResult.js";
import { SourceRecordRef, sourceRecordKey } from "./SourceRecordRef.js";
export const FieldAuthority = Schema.Struct({
    canonical: CanonicalRef,
    field: Schema.NonEmptyString,
    source: SourceRecordRef,
    policyRevision: Schema.NonEmptyString,
});
/** Fresh host-resolved pins. Explicit null means no company context; no defaults. */
export const MappingCurrentPins = Schema.Struct({
    source: SourceRecordRef,
    mappingDigest: Sha256,
    sourceSnapshotDigest: Sha256,
    sourceConfigurationDigest: Sha256,
    registryRevision: Schema.NonEmptyString,
    bindingsDigest: Sha256,
    companyContext: Schema.NullOr(CanonicalRef),
    installationLifecycle: Schema.Literals(['active', 'archived', 'retired']),
    sourceRecordLifecycle: Schema.Literals(['active', 'archived', 'retired']),
    asOf: IsoDate,
    policyRevision: Schema.NonEmptyString,
});
export const ApplicationHoldReason = Schema.Literals([
    'mapping-not-mapped',
    'computation-mismatch',
    'mapping-drift',
    'registry-drift',
    'bindings-drift',
    'configuration-drift',
    'company-context-drift',
    'source-drift',
    'source-snapshot-drift',
    'installation-inactive',
    'source-record-inactive',
    'effective-date-drift',
    'policy-drift',
    'field-provenance-mismatch',
    'field-authority-missing',
]);
export const ApplicationAssessment = Schema.TaggedUnion({
    held: { reason: ApplicationHoldReason },
    conflict: { reason: Schema.Literal('stale-revision') },
    eligible: { fields: Schema.Array(Schema.NonEmptyString), expectedRevision: Schema.NonEmptyString, computation: MappingComputation },
});
const artifactPinIssue = (input, receipt) => {
    if (input.currentPins.sourceSnapshotDigest !== receipt.sourceSnapshotDigest)
        return 'source-snapshot-drift';
    if (input.currentPins.mappingDigest !== receipt.mappingDigest)
        return 'mapping-drift';
    if (input.currentPins.registryRevision !== receipt.registryRevision)
        return 'registry-drift';
    if (input.currentPins.bindingsDigest !== receipt.bindingsDigest)
        return 'bindings-drift';
    if (input.currentPins.sourceConfigurationDigest !== receipt.sourceConfigurationDigest)
        return 'configuration-drift';
    if (input.currentPins.policyRevision !== input.policyRevision)
        return 'policy-drift';
    return undefined;
};
const contextKey = (context) => (context === null || context === undefined ? undefined : canonicalRefKey(context));
const scopePinIssue = (pins, receipt) => {
    if (sourceRecordKey(pins.source) !== sourceRecordKey(receipt.source))
        return 'source-drift';
    if (contextKey(pins.companyContext) !== contextKey(receipt.companyContext))
        return 'company-context-drift';
    if (pins.installationLifecycle !== 'active' || receipt.installationLifecycle !== 'active')
        return 'installation-inactive';
    if (pins.sourceRecordLifecycle !== 'active' || receipt.sourceRecordLifecycle !== 'active')
        return 'source-record-inactive';
    if (pins.asOf !== receipt.asOf)
        return 'effective-date-drift';
    return undefined;
};
const candidateFieldIssue = (input, result, candidate, field) => {
    const provenance = result.fields.filter((entry) => entry.targetField === field);
    const source = input.mappingInput.source;
    if (provenance.length !== 1 || provenance.some((entry) => entry.state !== 'mapped' || sourceRecordKey(entry.source) !== sourceRecordKey(source)))
        return 'field-provenance-mismatch';
    const evidence = input.authority.find((authority) => canonicalRefKey(authority.canonical) === canonicalRefKey(candidate.canonical) &&
        authority.field === field &&
        sourceRecordKey(authority.source) === sourceRecordKey(source) &&
        authority.policyRevision === input.policyRevision);
    return evidence === undefined ? 'field-authority-missing' : undefined;
};
const assessFields = (input, computation) => {
    if (computation.result._tag !== 'mapped')
        return { _tag: 'held', reason: 'mapping-not-mapped' };
    const fields = [];
    for (const candidate of computation.result.candidates) {
        for (const field of Object.keys(candidate.values)) {
            const issue = candidateFieldIssue(input, computation.result, candidate, field);
            if (issue !== undefined)
                return { _tag: 'held', reason: issue };
            fields.push(field);
        }
    }
    return { _tag: 'eligible', fields, expectedRevision: input.expectedRevision, computation };
};
/**
 * Recomputes claimed evidence, checks fresh host pins and field authority,
 * then returns the exact candidate eligible for a separate authorized atomic CAS.
 * Eligibility is neither authorization nor evidence of an executed write.
 */
export const assessMappingApplication = Effect.fnUntraced(function* (input) {
    const recomputed = yield* createMappingReceipt(input.mappingInput);
    const claimedDigest = yield* digestValueSync(input.computation);
    const actualDigest = yield* digestValueSync(recomputed);
    if (claimedDigest !== actualDigest)
        return { _tag: 'held', reason: 'computation-mismatch' };
    const drift = artifactPinIssue(input, recomputed.receipt) ?? scopePinIssue(input.currentPins, recomputed.receipt);
    if (drift !== undefined)
        return { _tag: 'held', reason: drift };
    if (input.expectedRevision !== input.currentRevision)
        return { _tag: 'conflict', reason: 'stale-revision' };
    return assessFields(input, recomputed);
});
//# sourceMappingURL=FieldAuthority.js.map