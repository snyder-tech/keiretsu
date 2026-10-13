/**
 * Synchronous SHA-256 (FIPS 180-4) over bytes. Used where Web Crypto's async
 * digest cannot be awaited (pure validators). Verified against Web Crypto in tests.
 *
 * @internal
 */
const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const rotr = (value, bits) => (value >>> bits) | (value << (32 - bits));
const pad = (bytes) => {
    const length = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(length);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(length - 8, Math.floor((bytes.length * 8) / 0x1_0000_0000));
    view.setUint32(length - 4, (bytes.length * 8) >>> 0);
    return padded;
};
const messageSchedule = (view, offset, w) => {
    for (let t = 0; t < 16; t += 1)
        w[t] = view.getUint32(offset + t * 4);
    for (let t = 16; t < 64; t += 1) {
        const w15 = w[t - 15] ?? 0;
        const w2 = w[t - 2] ?? 0;
        const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
        const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
        w[t] = ((w[t - 16] ?? 0) + s0 + (w[t - 7] ?? 0) + s1) >>> 0;
    }
};
const initialWorkingState = (state) => {
    const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0] = state;
    return { a, b, c, d, e, f, g, h };
};
const compressionRound = (working, w, t) => {
    const t1 = (working.h + (rotr(working.e, 6) ^ rotr(working.e, 11) ^ rotr(working.e, 25)) + ((working.e & working.f) ^ (~working.e & working.g)) + (K[t] ?? 0) + (w[t] ?? 0)) >>> 0;
    const t2 = ((rotr(working.a, 2) ^ rotr(working.a, 13) ^ rotr(working.a, 22)) + ((working.a & working.b) ^ (working.a & working.c) ^ (working.b & working.c))) >>> 0;
    working.h = working.g;
    working.g = working.f;
    working.f = working.e;
    working.e = (working.d + t1) >>> 0;
    working.d = working.c;
    working.c = working.b;
    working.b = working.a;
    working.a = (t1 + t2) >>> 0;
};
const accumulateState = (state, working) => {
    const next = [working.a, working.b, working.c, working.d, working.e, working.f, working.g, working.h];
    for (let index = 0; index < 8; index += 1)
        state[index] = ((state[index] ?? 0) + (next[index] ?? 0)) >>> 0;
};
const compress = (state, view, offset, w) => {
    messageSchedule(view, offset, w);
    const working = initialWorkingState(state);
    for (let t = 0; t < 64; t += 1)
        compressionRound(working, w, t);
    accumulateState(state, working);
};
export const sha256Hex = (bytes) => {
    const state = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const padded = pad(bytes);
    const view = new DataView(padded.buffer);
    const w = new Uint32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64)
        compress(state, view, offset, w);
    return [...state].map((word) => word.toString(16).padStart(8, '0')).join('');
};
//# sourceMappingURL=sha256.js.map