/**
 * Invariant catalogue (memo P8): every issue code this package emits, how it
 * is surfaced, and whether a JSON Schema 2020-12 rendering can express it.
 * Codes that JSON Schema cannot express must be covered by conformance vectors
 * so non-TypeScript implementers do not silently accept invalid bundles.
 *
 * @since 0.1.0
 * @module
 */
/**
 * How a finding surfaces: a `ValidationIssue`, a schema decode failure, a
 * tagged error, a per-record receipt reason or a sequence admission.
 *
 * @since 0.1.0
 * @category models
 */
export type Surface = 'issue' | 'decode' | 'error' | 'record-reason' | 'admission';
/**
 * One catalogued invariant.
 *
 * @since 0.1.0
 * @category models
 */
export interface Invariant {
    readonly code: string;
    readonly severity: 'error' | 'hold' | 'warning';
    readonly surface: Surface;
    /** `structural` and `cross-field` invariants have a JSON Schema form; `semantic` ones need vectors. */
    readonly kind: 'structural' | 'cross-field' | 'semantic';
    readonly jsonSchemaExpressible: boolean;
    readonly description: string;
}
/**
 * Every code emitted by `@snyder-tech/keiretsu/exchange`.
 *
 * @since 0.1.0
 * @category catalogue
 */
export declare const catalogue: ReadonlyArray<Invariant>;
/**
 * Look up a catalogued invariant by code.
 *
 * @since 0.1.0
 * @category catalogue
 */
export declare const byCode: (code: string) => Invariant | undefined;
//# sourceMappingURL=Invariants.d.ts.map