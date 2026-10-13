/** Independent 0.3 contracts; the 0.1/0.2 wire remains frozen. */
import { Schema } from 'effect';
import { EntityId } from "../core/Actor.js";
import { Sha256 } from "../core/CanonicalJson.js";
import { BundleId } from "../core/Ids.js";
import { Instant, Period } from "../core/Temporal.js";
import { Header } from "./Bundle.js";
import { DetachedJws } from "./Jws.js";
import { PartyRef } from "./Party.js";
const Natural = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER));
const Positive = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER));
export const LimitsV03 = Schema.Struct({ maxBytes: Positive, maxDepth: Positive, maxRecords: Positive });
/** Explicit receiver ceilings, supplied by the host. */
export const CohortV03 = Schema.Struct({ id: Schema.NonEmptyString, mode: Schema.Literals(['atomic-correction', 'dependency']) });
export const RecordV03 = Schema.Struct({ kind: Schema.NonEmptyString, schema: Schema.NonEmptyString, record: Schema.Json, cohort: Schema.optional(CohortV03) });
const consistentCohortModes = Schema.makeFilter((value) => {
    const modes = new Map();
    for (const entry of value.records) {
        const cohort = entry.cohort;
        if (cohort === undefined)
            continue;
        const existing = modes.get(cohort.id);
        if (existing !== undefined && existing !== cohort.mode)
            return 'one cohort identity must declare one consistent mode';
        modes.set(cohort.id, cohort.mode);
    }
    return undefined;
});
export const EnvelopeV03 = Schema.Struct({
    ...Header.fields,
    specVersion: Schema.Literal('0.3'),
    records: Schema.Array(RecordV03).check(Schema.isMinLength(1)),
    contentDigest: Sha256,
    signature: Schema.optional(DetachedJws),
}).check(Schema.makeFilter((value) => (value.seq > 1 === (value.prevBundleDigest !== undefined) ? undefined : 'invalid chain link')), Schema.makeFilter((value) => (value.audience._tag === 'entity' && value.audience.entityId.toLowerCase() === value.issuer.toLowerCase() ? 'self-addressed bundle' : undefined)), consistentCohortModes);
const { records: _records, signature: _signature, ...contextFields } = EnvelopeV03.fields;
/** Persist envelope identity without retaining rejected or unauthorized payloads. */
export const BundleContextV03 = Schema.Struct(contextFields);
export const RecordIdentityV03 = Schema.Struct({ index: Natural, kind: Schema.NonEmptyString, schema: Schema.NonEmptyString, recordDigest: Sha256 });
export const RecordOutcomeV03 = Schema.Struct({
    ...RecordIdentityV03.fields,
    outcome: Schema.Literals(['classified', 'invalid', 'unauthorized', 'staged', 'held', 'applied', 'conflict', 'rejected']),
    reason: Schema.NonEmptyString.check(Schema.isMaxLength(512)),
});
const ReceiptFieldsV03 = {
    specVersion: Schema.Literal('0.3'),
    bundleId: BundleId,
    issuer: EntityId,
    receiver: PartyRef,
    seq: Positive,
    contentDigest: Sha256,
    phase: Schema.Literals(['classification', 'validation', 'application']),
    receivedAt: Instant,
    outcome: Schema.Literals(['complete', 'partial', 'rejected', 'held']),
    records: Schema.Array(RecordOutcomeV03).check(Schema.isMinLength(1)),
    originalReceiptDigest: Schema.optional(Sha256),
    applicationId: Schema.optional(Schema.NonEmptyString),
    receiverPeriod: Schema.optional(Period),
};
export const UnsealedReceiptV03 = Schema.Struct(ReceiptFieldsV03);
export const ReceiptV03 = Schema.Struct({ ...ReceiptFieldsV03, receiptDigest: Sha256, signature: Schema.optional(DetachedJws) });
/** Authentication comes from the host edge, never from bundle actor claims. */
export const AuthenticatedContextV03 = Schema.Struct({ principal: Schema.NonEmptyString, sessionId: Schema.NonEmptyString, installationId: Schema.NonEmptyString });
export const CommandV03 = Schema.Struct({
    ...RecordIdentityV03.fields,
    target: Schema.NonEmptyString,
    expectedRevision: Natural,
    operation: Schema.NonEmptyString,
    payload: Schema.Json,
    cohort: Schema.optional(CohortV03),
});
export const ChainV03 = Schema.Struct({ seq: Natural, digest: Schema.optional(Sha256), halted: Schema.Boolean });
export const StoredInboundV03 = Schema.Struct({
    key: Schema.NonEmptyString,
    envelope: BundleContextV03,
    identities: Schema.Array(RecordIdentityV03),
    classification: UnsealedReceiptV03,
    validation: UnsealedReceiptV03,
    commands: Schema.Array(CommandV03),
    application: Schema.optional(UnsealedReceiptV03),
});
/** Derive aggregates; callers cannot choose acceptance independently of rows. */
export const aggregateV03 = (rows) => {
    if (rows.every((row) => ['classified', 'staged', 'applied'].includes(row.outcome)))
        return 'complete';
    if (rows.every((row) => row.outcome === 'held'))
        return 'held';
    if (rows.some((row) => ['classified', 'staged', 'applied'].includes(row.outcome)))
        return 'partial';
    return 'rejected';
};
//# sourceMappingURL=V03Contracts.js.map