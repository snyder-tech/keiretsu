/** Pure record descriptors and discovery contracts. Schema identities are opaque; they are never fetched. */
import { Schema } from 'effect';
import { makeBundleSchema } from "./Bundle.js";
import { SpecVersion } from "./SpecVersion.js";
const DescriptorMetadata = Schema.Struct({ schemaId: Schema.NonEmptyString, description: Schema.NonEmptyString });
/** Define local metadata without changing codec channels or performing I/O. */
export const defineRecord = (descriptor) => {
    Schema.decodeUnknownSync(DescriptorMetadata)({ schemaId: descriptor.schemaId, description: descriptor.description }, { onExcessProperty: 'error' });
    return Object.freeze({
        ...descriptor,
        jsonCodec: Schema.toCodecJson(descriptor.codec),
        standardSchema: Schema.toStandardSchemaV1(descriptor.codec, { parseOptions: { onExcessProperty: 'error' } }),
    });
};
/** The operation a portal advertises for a record. */
export const DiscoveryDirection = Schema.Literals(['outbound-projection', 'inbound-projection', 'bundle-send', 'bundle-receive']);
/** One record capability; this does not grant authorization to invoke its surface. */
export const DiscoveryProfile = Schema.Struct({
    kind: Schema.NonEmptyString,
    schemaId: Schema.NonEmptyString,
    direction: DiscoveryDirection,
    surface: Schema.NonEmptyString,
}).annotate({ identifier: 'DiscoveryProfile', description: 'An advertised record identity, direction and invocation surface.' });
const unambiguousProfiles = Schema.makeFilter((profiles) => {
    const entries = new Set();
    const identities = new Map();
    const kinds = new Map();
    for (const profile of profiles) {
        const key = JSON.stringify([profile.kind, profile.direction, profile.surface]);
        if (entries.has(key))
            return 'duplicate discovery profile';
        const identity = identities.get(profile.kind);
        if (identity !== undefined && identity !== profile.schemaId)
            return 'a record kind has ambiguous schema identities';
        const kind = kinds.get(profile.schemaId);
        if (kind !== undefined && kind !== profile.kind)
            return 'a schema identity has ambiguous record kinds';
        entries.add(key);
        identities.set(profile.kind, profile.schemaId);
        kinds.set(profile.schemaId, profile.kind);
    }
    return undefined;
});
/** JSON-native, versioned discovery metadata. Empty manifests advertise no exchange capabilities. */
export const DiscoveryManifest = Schema.Struct({
    manifestVersion: Schema.Literal('1'),
    specVersion: SpecVersion,
    profiles: Schema.Array(DiscoveryProfile).check(unambiguousProfiles),
}).annotate({ identifier: 'DiscoveryManifest', description: 'Versioned record capabilities advertised by a corporate portal.' });
/** Strict unknown-input ingress: reject undeclared manifest and profile members. */
export const decodeDiscoveryManifest = Schema.decodeUnknownEffect(DiscoveryManifest, { onExcessProperty: 'error' });
/** Encode the same strict contract, including descriptor ambiguity checks. */
export const encodeDiscoveryManifest = Schema.encodeEffect(DiscoveryManifest, { onExcessProperty: 'error' });
/** Project a registration onto discovery without exposing its codec. */
export const describeRecord = (kind, descriptor, options) => Schema.decodeUnknownSync(DiscoveryProfile)({ kind, schemaId: descriptor.schemaId, ...options }, { onExcessProperty: 'error' });
/** Build an existing bundle codec with exact, locally registered schema identities. */
export const makeStrictBundleSchema = (descriptors) => {
    const identities = new Set();
    for (const [kind, descriptor] of Object.entries(descriptors)) {
        Schema.decodeUnknownSync(DiscoveryProfile)({ kind, schemaId: descriptor.schemaId, direction: 'bundle-receive', surface: kind }, { onExcessProperty: 'error' });
        if (identities.has(descriptor.schemaId))
            throw new Error('duplicate schema identity in descriptor map');
        identities.add(descriptor.schemaId);
    }
    const profile = Object.freeze(Object.fromEntries(Object.entries(descriptors).map(([kind, descriptor]) => [kind, descriptor.jsonCodec])));
    const schemaIds = Object.freeze(Object.fromEntries(Object.entries(descriptors).map(([kind, descriptor]) => [kind, descriptor.schemaId])));
    // Each mapped value is the exact JSON codec at the corresponding descriptor key.
    return { ...makeBundleSchema(profile), schemaIds };
};
//# sourceMappingURL=Profile.js.map