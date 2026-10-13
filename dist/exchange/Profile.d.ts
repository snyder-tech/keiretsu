/** Pure record descriptors and discovery contracts. Schema identities are opaque; they are never fetched. */
import { Schema } from 'effect';
import { type BundleCodec } from './Bundle.ts';
/** Service-free codecs retain their decoded and encoded views. */
export type RecordCodec = Schema.ConstraintCodec<unknown, unknown, never, never>;
/** Registration metadata and the exact codec supplied by its domain owner. */
export interface RecordDescriptor<C extends RecordCodec = RecordCodec> {
    readonly schemaId: string;
    readonly description: string;
    readonly codec: C;
    readonly jsonCodec: Schema.toCodecJson<C>;
    readonly standardSchema: ReturnType<typeof Schema.toStandardSchemaV1<C>>;
}
/** Define local metadata without changing codec channels or performing I/O. */
export declare const defineRecord: <C extends RecordCodec>(descriptor: Pick<RecordDescriptor<C>, "schemaId" | "description" | "codec">) => RecordDescriptor<C>;
/** The operation a portal advertises for a record. */
export declare const DiscoveryDirection: Schema.Literals<readonly ["outbound-projection", "inbound-projection", "bundle-send", "bundle-receive"]>;
export type DiscoveryDirection = typeof DiscoveryDirection.Type;
/** One record capability; this does not grant authorization to invoke its surface. */
export declare const DiscoveryProfile: Schema.Struct<{
    readonly kind: Schema.NonEmptyString;
    readonly schemaId: Schema.NonEmptyString;
    readonly direction: Schema.Literals<readonly ["outbound-projection", "inbound-projection", "bundle-send", "bundle-receive"]>;
    readonly surface: Schema.NonEmptyString;
}>;
export type DiscoveryProfile = typeof DiscoveryProfile.Type;
/** JSON-native, versioned discovery metadata. Empty manifests advertise no exchange capabilities. */
export declare const DiscoveryManifest: Schema.Struct<{
    readonly manifestVersion: Schema.Literal<"1">;
    readonly specVersion: Schema.brand<Schema.String, "keiretsu/SpecVersion">;
    readonly profiles: Schema.$Array<Schema.Struct<{
        readonly kind: Schema.NonEmptyString;
        readonly schemaId: Schema.NonEmptyString;
        readonly direction: Schema.Literals<readonly ["outbound-projection", "inbound-projection", "bundle-send", "bundle-receive"]>;
        readonly surface: Schema.NonEmptyString;
    }>>;
}>;
export type DiscoveryManifest = typeof DiscoveryManifest.Type;
export type DiscoveryManifestEncoded = typeof DiscoveryManifest.Encoded;
/** Strict unknown-input ingress: reject undeclared manifest and profile members. */
export declare const decodeDiscoveryManifest: (input: unknown, options?: import("effect/SchemaAST").ParseOptions) => import("effect/Effect").Effect<{
    readonly manifestVersion: "1";
    readonly specVersion: string & import("effect/Brand").Brand<"keiretsu/SpecVersion">;
    readonly profiles: readonly {
        readonly kind: string;
        readonly schemaId: string;
        readonly direction: "outbound-projection" | "inbound-projection" | "bundle-send" | "bundle-receive";
        readonly surface: string;
    }[];
}, Schema.SchemaError, never>;
/** Encode the same strict contract, including descriptor ambiguity checks. */
export declare const encodeDiscoveryManifest: (input: {
    readonly manifestVersion: "1";
    readonly specVersion: string & import("effect/Brand").Brand<"keiretsu/SpecVersion">;
    readonly profiles: readonly {
        readonly kind: string;
        readonly schemaId: string;
        readonly direction: "outbound-projection" | "inbound-projection" | "bundle-send" | "bundle-receive";
        readonly surface: string;
    }[];
}, options?: import("effect/SchemaAST").ParseOptions) => import("effect/Effect").Effect<{
    readonly manifestVersion: "1";
    readonly specVersion: string;
    readonly profiles: readonly {
        readonly kind: string;
        readonly schemaId: string;
        readonly direction: "outbound-projection" | "inbound-projection" | "bundle-send" | "bundle-receive";
        readonly surface: string;
    }[];
}, Schema.SchemaError, never>;
/** Project a registration onto discovery without exposing its codec. */
export declare const describeRecord: (kind: string, descriptor: RecordDescriptor, options: Pick<DiscoveryProfile, "direction" | "surface">) => DiscoveryProfile;
export type DescriptorMap = Readonly<Record<string, RecordDescriptor>>;
/** The derived JSON codec at each kind, preserving the record-kind/payload correlation. */
export type ProfileOf<D extends DescriptorMap> = {
    readonly [K in keyof D]: D[K]['jsonCodec'];
};
/** Build an existing bundle codec with exact, locally registered schema identities. */
export declare const makeStrictBundleSchema: <const D extends DescriptorMap>(descriptors: D) => BundleCodec<ProfileOf<D>>;
//# sourceMappingURL=Profile.d.ts.map