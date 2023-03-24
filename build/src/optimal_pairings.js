"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ellipticCurve_1 = require("./ellipticCurve");
const extensionField_1 = require("./extensionField");
const primeField_1 = require("./primeField");
const common_1 = require("./common");
/*
 This is the ate pairing obtained with loop shortening optimizations
 Note: It only works for even embedding degrees k
 For sure, Q is assumed to be from the trace zero subgroup of E[r] over F_{q**k}
 P is assumed to be from the (only) subgroup of E[r] over F_q
 i.e., a (reversed) Type 3 pairing is assumed
 Note: Since the loop goes only until |t-1| < r, we cannot save the last "add"
       in the "double-and-add" as in the Tate pairing
 Check https://hackmd.io/@jpw/bn254#Optimal-Ate-pairing
*/
function Miller_loop_Ate_BN12_254(Q, P, // this point is actually over Fp
loop_length, Fq, E) {
    if (E.is_zero(Q) || E.is_zero(P)) {
        return Fq.one;
    }
    let R = Q;
    let f = Fq.one;
    for (let i = (0, common_1.log2)(loop_length) - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), (0, common_1.line)(R, R, P, Fq, E));
        R = E.add(R, R);
        if (loop_length & (1n << BigInt(i))) {
            f = Fq.mul(f, (0, common_1.line)(R, Q, P, Fq, E));
            R = E.add(R, Q);
        }
    }
    const Q1 = (0, common_1.FrobeniusMap)(Q, Fq);
    const nQ2 = E.neg((0, common_1.FrobeniusMap)(Q1, Fq));
    f = Fq.mul(f, (0, common_1.line)(R, Q1, P, Fq, E));
    R = E.add(R, Q1);
    f = Fq.mul(f, (0, common_1.line)(R, nQ2, P, Fq, E));
    return f;
}
// Final exponentiation
function final_expontiation(r, Fq, f) {
    const k = (0, ellipticCurve_1.embedding_degree)(Fq.Fp, r);
    const exponent = (Fq.Fp.p ** k - 1n) / r; // It should be divisible
    return Fq.exp(f, exponent);
}
// Optimal ate pairing computation over the BN12-254 curve
// https://hackmd.io/@jpw/bn254#Optimal-Ate-pairing
function optimal_ate_bn12_254(x, P, Q, r, Fq, E) {
    const f = Miller_loop_Ate_BN12_254(Q, P, 6n * x + 2n, Fq, E);
    return final_expontiation(r, Fq, f);
}
// Section 3 of https://www.cryptojedi.org/papers/pfcpo.pdf
// and https://github.com/ethereum/py_pairing/blob/master/py_ecc/bn128/bn128_curve.py#L86
function twist(P, Fq, E) {
    if (E.is_zero(P))
        return P;
    // 1) Apply a field isomorphism phi between Fp[u]/<u²+1> and Fp[u]/<u²-18·u+82>
    const phix = [Fq.Fp.sub(P.x[0], Fq.Fp.mul(9n, P.x[1])), P.x[1]];
    const phiy = [Fq.Fp.sub(P.y[0], Fq.Fp.mul(9n, P.y[1])), P.y[1]];
    // 2) Apply a field isomorphism gamma between Fp[u]/<u²-18·u+82> and
    // a subfield of degree 2 of Fp[w]/<w¹²-18·w⁶+82>, with w⁶ = u
    const gammax = [phix[0], 0n, 0n, 0n, 0n, 0n, phix[1], 0n, 0n, 0n, 0n, 0n];
    const gammay = [phiy[0], 0n, 0n, 0n, 0n, 0n, phiy[1], 0n, 0n, 0n, 0n, 0n];
    // 3) Finally, perform the twist through w
    const x = Fq.mul(gammax, Fq.exp(w, 2n));
    const y = Fq.mul(gammay, Fq.exp(w, 3n));
    return { x, y };
}
// Test 1: Optimal Ate Pairing over BN12-254
// https://hackmd.io/@jpw/bn254
const x = 4965661367192848881n;
const t = 6n * x ** 2n + 1n; // This is not necessary at all
const p = 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n;
const r = 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n;
// Field Extensions
const beta = -1n; // quadratic non-residue in Fp
const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
const Fp = new primeField_1.PrimeField(p);
const Fp2 = new extensionField_1.ExtensionField(Fp, [-beta, 0n, 1n]);
const Fp12 = new extensionField_1.ExtensionField(Fp, [
    82n,
    0n,
    0n,
    0n,
    0n,
    0n,
    -18n,
    0n,
    0n,
    0n,
    0n,
    0n,
    1n,
]);
const w = [0n, 1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
// Curve E: y² = x³ + 3 over Fp
const E = new ellipticCurve_1.EllipticCurveOverFp(0n, 3n, Fp);
// Generator of E(Fp)
let G1 = { x: 1n, y: 2n };
(0, chai_1.assert)(E.is_on_curve(G1), "G1 is not on curve E: y² = x³ + 3");
(0, chai_1.assert)(E.is_zero(E.escalarMul(G1, r)), "G1 is not a generator of the r-torsion");
// Twisted curve E': y² = x³ + 3/xi over Fp2
const a2 = [0n];
const b2 = Fp2.div([3n, 0n], xi);
const E2 = new ellipticCurve_1.EllipticCurveOverFq(a2, b2, Fp2);
// Generator of E'(Fp2)
const G2 = {
    x: [
        10857046999023057135944570762232829481370756359578518086990519993285655852781n,
        11559732032986387107991004021392285783925812861821192530917403151452391805634n,
    ],
    y: [
        8495653923123431417604973247489272438418190587263600148770280649306958101930n,
        4082367875863433681332203403145435568316851327593401208105741076214120093531n,
    ],
};
(0, chai_1.assert)(E2.is_on_curve(G2), "G2 is not on curve E': y² = x³ + 3/xi");
(0, chai_1.assert)(E2.is_zero(E2.escalarMul(G2, r)), "G2 is not a generator of the r-torsion");
// Curve y² = x³ + 3 over Fp12
const E12 = new ellipticCurve_1.EllipticCurveOverFq([0n], [3n], Fp12);
const Q = twist(G2, Fp12, E2);
(0, chai_1.assert)(E12.is_on_curve(Q), "The twist is not working");
const k = (0, ellipticCurve_1.embedding_degree)(Fp, r);
(0, chai_1.assert)(k === 12n, "The embedding degree should be 12");
const P = { x: [1n], y: [2n] };
const e = optimal_ate_bn12_254(x, P, Q, r, Fp12, E12);
// Let's check the bilinearity of the pairing
const P2 = E12.escalarMul(P, 2n);
const P12 = E12.escalarMul(P, 12n);
const Q2 = E12.escalarMul(Q, 2n);
const Q12 = E12.escalarMul(Q, 12n);
const e1 = optimal_ate_bn12_254(x, P2, Q12, r, Fp12, E12);
const e2 = Fp12.exp(optimal_ate_bn12_254(x, P, Q12, r, Fp12, E12), 2n);
const e3 = Fp12.exp(optimal_ate_bn12_254(x, P2, Q, r, Fp12, E12), 12n);
const e4 = Fp12.exp(optimal_ate_bn12_254(x, P, Q, r, Fp12, E12), 24n);
const e5 = optimal_ate_bn12_254(x, P12, Q2, r, Fp12, E12);
(0, chai_1.assert)(Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5), "The pairing is not bilinear");
//# sourceMappingURL=optimal_pairings.js.map