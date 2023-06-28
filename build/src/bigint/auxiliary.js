"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array_long_mul = exports.array_sub = exports.array_add = exports.shift_left = exports.bia2scalar = exports.logB = exports.log2 = exports.split_at = exports.mod = exports.egcd = exports.gcd = void 0;
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
// Array operations: I assume little-endian representation of numbers in some base B.
/**
 *
 * @param a
 * @param b
 * @returns 1 if a > b, -1 if a < b, 0 if a == b.
 */
function compare(a, b) {
    const alen = a.length;
    const blen = b.length;
    if (alen !== blen) {
        return alen >= blen ? 1 : -1;
    }
    for (let i = alen - 1; i >= 0; i--) {
        if (a[i] !== b[i]) {
            return a[i] > b[i] ? 1 : -1;
        }
    }
    return 0;
}
function trim(a) {
    let i = a.length - 1;
    while (i > 0 && a[i] === 0n) {
        i--;
    }
    return a.slice(0, i + 1);
}
function shift_left(a, n) {
    let result = [];
    while (n-- > 0) {
        result.push(0n);
    }
    return result.concat(a);
}
exports.shift_left = shift_left;
// Assumes a.length >= b.length
function _array_add(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    let result = new Array(alen);
    let sum = 0n;
    let carry = 0n;
    for (let i = 0; i < blen; i++) {
        sum = a[i] + b[i] + carry;
        carry = sum >= B ? 1n : 0n;
        result[i] = sum - carry * B;
    }
    for (let i = blen; i < alen; i++) {
        sum = a[i] + carry;
        carry = sum == B ? 1n : 0n; // the past carry is at most 1n
        result[i] = sum - carry * B;
    }
    if (carry === 1n) {
        result.push(carry);
    }
    return result;
}
function array_add(a, b, B) {
    if (a.length < b.length) {
        return _array_add(b, a, B);
    }
    return _array_add(a, b, B);
}
exports.array_add = array_add;
// Assumes a >= b
function _array_sub(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    let result = new Array(alen);
    let diff = 0n;
    let carry = 0n;
    let i = 0;
    for (i = 0; i < blen; i++) {
        diff = a[i] - b[i] - carry;
        carry = diff < 0n ? 1n : 0n;
        result[i] = diff + carry * B;
    }
    for (i = blen; i < alen; i++) {
        diff = a[i] - carry;
        if (diff < 0n) {
            diff += B;
        }
        else {
            result[i++] = diff;
            break;
        }
        result[i] = diff;
    }
    for (; i < alen; i++) {
        result[i] = a[i];
    }
    return result;
}
function array_sub(a, b, B) {
    let result;
    if (compare(a, b) >= 0) {
        result = _array_sub(a, b, B);
    }
    else {
        result = _array_sub(b, a, B);
        result[result.length - 1] = -result[result.length - 1];
    }
    return trim(result);
}
exports.array_sub = array_sub;
function array_long_mul(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    const len = alen + blen;
    const result = new Array(len).fill(0n);
    let product;
    let carry;
    let ai;
    let bj;
    for (let i = 0; i < alen; i++) {
        ai = a[i];
        for (let j = 0; j < blen; j++) {
            bj = b[j];
            product = ai * bj + result[i + j];
            carry = product / B;
            result[i + j] = product - carry * B;
            result[i + j + 1] += carry;
        }
    }
    return trim(result);
}
exports.array_long_mul = array_long_mul;
//# sourceMappingURL=auxiliary.js.map