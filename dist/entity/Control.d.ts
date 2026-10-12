import { Schema } from 'effect';
/** @since 0.1.0 @category schemas */
export declare const ControlScope: Schema.Literals<readonly ["full", "limited", "joint", "significant-influence"]>;
/** @since 0.1.0 @category models */
export type ControlScope = typeof ControlScope.Type;
/** @since 0.1.0 @category schemas */
export declare const ControlBasis: Schema.Literals<readonly ["equity", "contractual", "governance", "operational", "potential-voting"]>;
/**
 * A control edge as authored in config.
 *
 * @since 0.1.0
 * @category schemas
 */
export declare const ControlEdge: Schema.Struct<{
    readonly controller: Schema.NonEmptyString;
    readonly controlled: Schema.NonEmptyString;
    readonly scope: Schema.Literals<readonly ["full", "limited", "joint", "significant-influence"]>;
    readonly bases: Schema.NonEmptyArray<Schema.Literals<readonly ["equity", "contractual", "governance", "operational", "potential-voting"]>>;
    readonly assurance: Schema.Literals<readonly ["verified", "asserted", "unverified"]>;
    readonly evidence: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly ref: Schema.NonEmptyString;
        readonly digest: Schema.optional<Schema.brand<Schema.String, "keiretsu/Sha256">>;
    }>>;
    readonly validFrom: Schema.brand<Schema.String, "keiretsu/IsoDate">;
    readonly validTo: Schema.optional<Schema.brand<Schema.String, "keiretsu/IsoDate">>;
}>;
/** @since 0.1.0 @category models */
export type ControlEdge = typeof ControlEdge.Type;
/** @since 0.1.0 @category models */
export type ControlEdgeInput = typeof ControlEdge.Encoded;
//# sourceMappingURL=Control.d.ts.map