/**
 * Pure bigint normalization shared by bounded current and frozen legacy math.
 * This kernel imposes no ingress profile; its owning caller enforces bounds.
 * Internal: never export through public package subpaths.
 */
export interface Parts {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
};

export const normalise = (numerator: bigint, denominator: bigint): Parts => {
  if (denominator === 0n) throw new RangeError('zero denominator');
  const divisor = gcd(numerator, denominator);
  const sign = denominator < 0n ? -1n : 1n;
  return { numerator: (numerator * sign) / divisor, denominator: (denominator * sign) / divisor };
};
