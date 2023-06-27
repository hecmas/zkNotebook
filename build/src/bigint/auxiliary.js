"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bia2scalar = exports.logB = exports.log2 = exports.split_at = exports.array_sub = exports.mod = exports.egcd = exports.gcd = void 0;
function gcd(a, b) {
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
exports.gcd = gcd;
function egcd(a, b) {
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
exports.egcd = egcd;
function mod(a, b) {
    return a >= 0n ? a % b : ((a % b) + b) % b;
}
exports.mod = mod;
function array_sub(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    const len = Math.max(alen, blen);
    const result = new Array(len).fill(0n);
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
        }
        else {
            borrow = 0n;
        }
        result[i] = diff;
    }
    return result;
}
exports.array_sub = array_sub;
function split_at(x, n) {
    return [x >> n, x & ((1n << n) - 1n)];
}
exports.split_at = split_at;
function log2(x) {
    if (x === 0n)
        return 0;
    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}
exports.log2 = log2;
function logB(x, B) {
    if (x === 0n)
        return 0;
    let r = 0;
    while (x > 1n) {
        x = x / B;
        r += 1;
    }
    return r;
}
exports.logB = logB;
// assumes x is well-formed
function bia2scalar(x, B) {
    let result = 0n;
    for (let i = x.length - 1; i >= 0; i--) {
        result = result * B + x[i];
    }
    return result;
}
exports.bia2scalar = bia2scalar;
//# sourceMappingURL=auxiliary.js.map