/** Bounded 0.3 ingress using the canonical JSON and signature implementation. */
import { Effect, Schema } from 'effect';
import { type SigningKey } from './Jws.ts';
import { EnvelopeV03, LimitsV03, type RecordIdentityV03 } from './V03Contracts.ts';
export declare const ExchangeErrorCodeV03: Schema.Literals<readonly ["core.json-duplicate-member", "core.json-lone-surrogate", "core.json-invalid", "v03.limits.invalid", "v03.limits.bytes", "v03.limits.depth", "v03.limits.records", "v03.number.invalid", "v03.bundle.invalid", "v03.bundle.digest", "v03.bundle.audience", "v03.bundle.signature", "v03.signature.failed", "v03.adapter.command", "v03.sequence.replay", "v03.authorization.context", "v03.authorization.installation", "v03.authorization.denied", "v03.application.identity", "v03.application.missing", "v03.outbox.limit", "v03.transport.limit", "v03.receipt.aggregate", "v03.receipt.phase", "v03.receipt.application-id", "v03.receipt.invalid", "v03.receipt.digest", "v03.receipt.coverage", "v03.receipt.record", "v03.receipt.duplicate", "v03.receipt.context", "v03.receipt.signature"]>;
declare const ExchangeErrorV03_base: Schema.Class<ExchangeErrorV03, Schema.TaggedStruct<"ExchangeErrorV03", {
    readonly code: Schema.Literals<readonly ["core.json-duplicate-member", "core.json-lone-surrogate", "core.json-invalid", "v03.limits.invalid", "v03.limits.bytes", "v03.limits.depth", "v03.limits.records", "v03.number.invalid", "v03.bundle.invalid", "v03.bundle.digest", "v03.bundle.audience", "v03.bundle.signature", "v03.signature.failed", "v03.adapter.command", "v03.sequence.replay", "v03.authorization.context", "v03.authorization.installation", "v03.authorization.denied", "v03.application.identity", "v03.application.missing", "v03.outbox.limit", "v03.transport.limit", "v03.receipt.aggregate", "v03.receipt.phase", "v03.receipt.application-id", "v03.receipt.invalid", "v03.receipt.digest", "v03.receipt.coverage", "v03.receipt.record", "v03.receipt.duplicate", "v03.receipt.context", "v03.receipt.signature"]>;
    readonly reason: Schema.NonEmptyString;
}>, import("effect/Cause").YieldableError>;
export declare class ExchangeErrorV03 extends ExchangeErrorV03_base {
}
export declare const failV03: (code: typeof ExchangeErrorCodeV03.Type, reason: string) => ExchangeErrorV03;
/** Scan before recursive strict parsing, bounding bytes and nesting without interpreting JSON. */
export declare const checkBoundsV03: (text: string, limits: LimitsV03) => Effect.Effect<void, ExchangeErrorV03>;
export interface OpenedV03 {
    readonly envelope: EnvelopeV03;
    readonly identities: ReadonlyArray<RecordIdentityV03>;
    readonly text: string;
}
export declare const openV03: (text: string, limits: LimitsV03) => Effect.Effect<OpenedV03, ExchangeErrorV03>;
/** Producers encode domain payloads before supplying this JSON wire input. */
export declare const sealV03: (input: Omit<EnvelopeV03, "contentDigest" | "signature">, limits: LimitsV03) => Effect.Effect<OpenedV03, ExchangeErrorV03>;
export declare const bindingOfV03: (envelope: EnvelopeV03) => Readonly<Record<string, string | number>>;
export declare const signBundleV03: (options: {
    readonly text: string;
    readonly key: SigningKey;
    readonly limits: LimitsV03;
}) => Effect.Effect<string, ExchangeErrorV03>;
export {};
//# sourceMappingURL=V03Bundle.d.ts.map