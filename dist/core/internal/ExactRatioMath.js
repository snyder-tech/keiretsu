export const gcd = (left, right) => {
    let a = left < 0n ? -left : left;
    let b = right < 0n ? -right : right;
    while (b !== 0n)
        [a, b] = [b, a % b];
    return a;
};
export const normalise = (numerator, denominator) => {
    if (denominator === 0n)
        throw new RangeError('zero denominator');
    const divisor = gcd(numerator, denominator);
    const sign = denominator < 0n ? -1n : 1n;
    return { numerator: (numerator * sign) / divisor, denominator: (denominator * sign) / divisor };
};
//# sourceMappingURL=ExactRatioMath.js.map