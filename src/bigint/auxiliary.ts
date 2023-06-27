export function gcd(a: bigint, b: bigint): bigint  {
    if (a < b) {
        return gcd(b, a);
    }
    if (b === 0n) {
        return a;
    }

    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    
    return a;
}
export function egcd(a: bigint, b: bigint): bigint[] {
    if (a < b) {
        let result = egcd(b, a);
        return [result[1], result[0], result[2]];
    }

    if (b === 0n) {
        return [1n, 0n, a];
    }

    let [previous_r, r] = [a, b];
    let [previous_s, s] = [1n, 0n];
    let [previous_t, t] = [0n, 1n];

    while (r) {
        let q = previous_r / r;
        [previous_r, r] = [r, previous_r - q * r];
        [previous_s, s] = [s, previous_s - q * s];
        [previous_t, t] = [t, previous_t - q * t];
    }
    return [previous_s, previous_t, previous_r];
}
export function mod(a: bigint, b: bigint): bigint {
    return a >= 0n ? a % b : ((a % b) + b) % b;
}

export function array_sub(a: bigint[], b: bigint[], B: bigint): bigint[] {
    const alen = a.length;
    const blen = b.length;
    const len = Math.max(alen, blen);
    const result = new Array<bigint>(len).fill(0n);
    let borrow = 0n;
    for (let i = 0; i < len; i++) {
        const ai = i < alen ? a[i] : 0n;
        const bi = i < blen ? b[i] : 0n;

        let diff = ai - borrow;
        if (i < blen) {
            diff -= bi;
        }
        if (diff < 0n) {
            diff += BigInt(B);
            borrow = 1n;
        } else {
            borrow = 0n;
        }
        result[i] = diff;
    }
    return result;
}

export function split_at(x: bigint, n: bigint): [bigint, bigint] {
    return [x >> n, x & ((1n << n) - 1n)];
}

export function log2(x: bigint): number {
    if (x === 0n) return 0;

    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}
export function logB(x: bigint, B: bigint): number {
    if (x === 0n) return 0;

    let r = 0;
    while (x > 1n) {
        x = x / B;
        r += 1;
    }
    return r;
}

// assumes x is well-formed
export function bia2scalar(x: bigint[], B: bigint): bigint {
    let result = 0n;
    for (let i = x.length - 1; i >= 0; i--) {
        result = result * B + x[i];
    }
    return result;
}