"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commit_polynomial = exports.srs_mock = void 0;
const polynomials_1 = require("../polynomials");
const primeField_1 = require("../primeField");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
// INSECURE: the srs should be obtained through a MPC protocol
/**
 * @input n: the upper bound of the polynomial degree. I.e. the polynomials that can be committed
 * under this srs have degree in [0, n-1].
 * @returns It outputs `[[1]_1,[s]_1,[s^2]_1,...,[s^{n-1}]_1,[1]_2,[s]_2]`, the srs used in the KZG PCS.
 */
function srs_mock(E, tE, G1, G2, r, n) {
    const Fr = new primeField_1.PrimeField(r); // the scalar field of E
    const s = bigintRnd(r);
    let srs1 = [];
    for (let i = 0; i < n; i++) {
        const powerofs = Fr.exp(s, BigInt(i));
        srs1.push(E.escalarMul(G1, powerofs));
    }
    let srs2 = [];
    srs2.push(G2);
    srs2.push(tE.escalarMul(G2, s));
    return [srs1, srs2];
}
exports.srs_mock = srs_mock;
// Assume polynomial p(x) = a0 + a1·x + a2·x^2 + ... + ad·x^d
// is given as an array of its coefficients [a0, a1, a2, ..., ad]
/**
 * @input pol: a polynomial [a0, a1, a2, ..., ad] of appropriate degree.
 * @returns It outputs the E point `[f(s)]_1 = a0[1]_1 + a1[s]_1 + ... + ad[s^d]_1`.
 */
function commit_polynomial(E, srs, pol) {
    const [srs1] = srs;
    const d = (0, polynomials_1.degree)(pol);
    if (d >= srs1.length) {
        throw new Error("The polynomial degree is too large");
    }
    let com = E.zero;
    for (let i = 0; i <= d; i++) {
        com = E.add(com, E.escalarMul(srs1[i], pol[i]));
    }
    return com;
}
exports.commit_polynomial = commit_polynomial;
//# sourceMappingURL=common.js.map