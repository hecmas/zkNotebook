"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.degree = exports.squareAndMultiply = exports.egcd = void 0;
// https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm#Pseudocode
function egcd(a, b) {
    // Not needed
    // if (a < b) {
    //     let result = egcd(b, a);
    //     return [result[1], result[0], result[2]];
    // }
    // Not needed
    // if (b === 0n) {
    //     return [1n, 0n, a];
    // }
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
function squareAndMultiply(a, e, p) {
    let result = a;
    let binary = e.toString(2);
    for (let i = 1; i < binary.length; i++) {
        result = (result * result) % p;
        if (binary[i] === "1") {
            result = (result * a) % p;
        }
    }
    return result;
}
exports.squareAndMultiply = squareAndMultiply;
function degree(a) {
    let d = a.length - 1;
    while (d && a[d] === 0n) {
        d--;
    }
    return d;
}
exports.degree = degree;
//# sourceMappingURL=utils.js.map