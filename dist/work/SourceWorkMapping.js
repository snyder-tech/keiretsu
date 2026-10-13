/** Source identity and mapping decisions remain separate from canonical work. */
import { Schema } from 'effect';
import { EvidenceRef } from "../core/Envelope.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { SourceRecordRef } from "../mapping/SourceRecordRef.js";
import { CanonicalRef } from "../mapping/CanonicalRef.js";
export const SourceWorkMapping = Schema.Struct({
    source: SourceRecordRef,
    targets: Schema.NonEmptyArray(CanonicalRef),
    mappingId: Schema.NonEmptyString,
    mappingVersion: Schema.NonEmptyString,
    mappingDigest: Sha256,
    sourceDigest: Sha256,
    evidence: Schema.NonEmptyArray(EvidenceRef),
}).check(Schema.makeFilter((row) => (new Set(row.targets.map((target) => JSON.stringify(target))).size === row.targets.length ? undefined : 'mapping targets are distinct')));
/** Lossless source state, including tenant/board scope; it asserts no authority. */
export const SourceWorkState = Schema.Struct({
    source: SourceRecordRef,
    profileId: Schema.NonEmptyString,
    profileVersion: Schema.NonEmptyString,
    scope: Schema.NonEmptyString,
    code: Schema.NonEmptyString,
    label: Schema.optional(Schema.NonEmptyString),
});
//# sourceMappingURL=SourceWorkMapping.js.map