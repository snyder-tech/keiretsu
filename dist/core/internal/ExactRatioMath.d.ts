/**
 * Pure bigint normalization shared by bounded current and frozen legacy math.
 * This kernel imposes no ingress profile; its owning caller enforces bounds.
 * Internal: never export through public package subpaths.
 */
export interface Parts {
    readonly numerator: bigint;
    readonly denominator: bigint;
}
export declare const gcd: (left: bigint, right: bigint) => bigint;
export declare const normalise: (numerator: bigint, denominator: bigint) => Parts;
//# sourceMappingURL=ExactRatioMath.d.ts.map