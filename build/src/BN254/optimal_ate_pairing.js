"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ellipticCurve_1 = require("../ellipticCurve");
const extensionField_1 = require("../extensionField");
const primeField_1 = require("../primeField");
const common_1 = require("./common");
const Frobenius_constants_1 = require("./Frobenius_constants");
const bound = [
    0, 0, 0, 1, 0, 1, 0, -1, 0, 0, 1, -1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1,
    0, -1, 0, 0, 0, 0, 1, 1, 1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 1,
    1, 0, 0, -1, 0, 0, 0, 1, 1, 0, -1, 0, 0, 1, 0, 1, 1,
]; // This is 6x+2 in base {-1,0,1}
/*
 This is the optimal ate pairing
 For sure, Q is assumed to be from the (only) subgroup of E'[r] over Fp2
 P is assumed to be from the (only) subgroup of E[r] over Fp. In fact, E[r]=E for the BN254
 Check https://hackmd.io/kcEJAWISQ56eE6YpBnurgw
*/
function Miller_loop_Ate_BN254(Q, P, // this point is actually over Fp
Fq, E) {
    if (E.is_zero(Q) || E.is_zero(P)) {
        return Fq.one;
    }
    let R = Q;
    let f = Fq.one;
    for (let i = bound.length - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), (0, common_1.line)(R, R, P, Fq.Fq, E));
        R = E.add(R, R);
        if (bound[i] === 1) {
            f = Fq.mul(f, (0, common_1.line)(R, Q, P, Fq.Fq, E));
            R = E.add(R, Q);
        }
        else if (bound[i] === -1) {
            const nQ = E.neg(Q);
            f = Fq.mul(f, (0, common_1.line)(R, nQ, P, Fq.Fq, E));
            R = E.add(R, nQ);
        }
    }
    const xconjgugate = conjugateFp2(Q.x);
    const yconjugate = conjugateFp2(Q.y);
    const Qp = {
        x: Fq.Fq.mul(Frobenius_constants_1.gamma12, xconjgugate),
        y: Fq.Fq.mul(Frobenius_constants_1.gamma13, yconjugate),
    };
    const xpconjugate = [Qp.x[0], -Qp.x[1]];
    const ypconjugate = [Qp.y[0], -Qp.y[1]];
    const S = {
        x: Fq.Fq.mul(Frobenius_constants_1.gamma12, xpconjugate),
        y: Fq.Fq.mul(Frobenius_constants_1.gamma13, ypconjugate),
    };
    const Qpp = E.neg(S);
    f = Fq.mul(f, (0, common_1.line)(R, Qp, P, Fq.Fq, E));
    R = E.add(R, Qp);
    f = Fq.mul(f, (0, common_1.line)(R, Qpp, P, Fq.Fq, E));
    return f;
}
function conjugateFp2(a) {
    return [a[0], -a[1]];
}
function conjugateFp12(a, Fq) {
    return [a[0], Fq.neg(a[1]), a[2], Fq.neg(a[3]), a[4], Fq.neg(a[5])];
}
function Frobenius_operator1(f, Fq) {
    const conjugates = [];
    for (let i = 0; i < f.length; i++) {
        conjugates.push(conjugateFp2(f[i]));
    }
    return [
        conjugates[0],
        Fq.mul(Frobenius_constants_1.gamma11, conjugates[1]),
        Fq.mul(Frobenius_constants_1.gamma12, conjugates[2]),
        Fq.mul(Frobenius_constants_1.gamma13, conjugates[3]),
        Fq.mul(Frobenius_constants_1.gamma14, conjugates[4]),
        Fq.mul(Frobenius_constants_1.gamma15, conjugates[5]),
    ];
}
function Frobenius_operator2(f, Fq) {
    return [
        f[0],
        Fq.mul(Frobenius_constants_1.gamma21, f[1]),
        Fq.mul(Frobenius_constants_1.gamma22, f[2]),
        Fq.mul(Frobenius_constants_1.gamma23, f[3]),
        Fq.mul(Frobenius_constants_1.gamma24, f[4]),
        Fq.mul(Frobenius_constants_1.gamma25, f[5]),
    ];
}
function Frobenius_operator3(f, Fq) {
    const conjugates = [];
    for (let i = 0; i < f.length; i++) {
        conjugates.push(conjugateFp2(f[i]));
    }
    return [
        conjugates[0],
        Fq.mul(Frobenius_constants_1.gamma31, conjugates[1]),
        Fq.mul(Frobenius_constants_1.gamma32, conjugates[2]),
        Fq.mul(Frobenius_constants_1.gamma33, conjugates[3]),
        Fq.mul(Frobenius_constants_1.gamma34, conjugates[4]),
        Fq.mul(Frobenius_constants_1.gamma35, conjugates[5]),
    ];
}
// Final exponentiation
function final_expontiation(Fq, f) {
    // a] easy part
    // first, compute f^(p^6-1)=conjugate(f) · f^-1
    let conjugatef = conjugateFp12(f, Fq.Fq);
    const feasy1 = Fq.mul(conjugatef, Fq.inv(f));
    // second, compute feasy1^(p^2+1) = feasy1^(p^2) · feasy1
    const feasy2 = Frobenius_operator2(feasy1, Fq.Fq);
    const feasy = Fq.mul(feasy1, feasy2);
    // b] hard part
    const mx = Fq.exp(feasy, x);
    const mx2 = Fq.exp(mx, x);
    const mx3 = Fq.exp(mx2, x);
    const mp = Frobenius_operator1(feasy, Fq.Fq);
    const mp2 = Frobenius_operator2(feasy, Fq.Fq);
    const mp3 = Frobenius_operator3(feasy, Fq.Fq);
    const mpx = Fq.exp(mp, x);
    const mpx2 = Fq.exp(mpx, x);
    const mpx3 = Fq.exp(mpx2, x);
    const mp2x2 = Fq.exp(Fq.exp(mp2, x), x);
    const y0 = Fq.mul(Fq.mul(mp, mp2), mp3);
    const y1 = conjugateFp12(feasy, Fq.Fq);
    const y2 = mp2x2;
    const y3 = conjugateFp12(mpx, Fq.Fq);
    const y4 = conjugateFp12(Fq.mul(mx, mpx2), Fq.Fq);
    const y5 = conjugateFp12(mx2, Fq.Fq);
    const y6 = conjugateFp12(Fq.mul(mx3, mpx3), Fq.Fq);
    // vectorial addition chain technique
    const T01 = Fq.mul(Fq.mul(Fq.exp(y6, 2n), y4), y5);
    const T11 = Fq.mul(T01, Fq.mul(y3, y5));
    const T02 = Fq.mul(T01, y2);
    const T12 = Fq.mul(Fq.exp(T11, 2n), T02);
    const T13 = Fq.exp(T12, 2n);
    const T03 = Fq.mul(T13, y1);
    const T14 = Fq.mul(T13, y0);
    const T04 = Fq.mul(Fq.exp(T03, 2n), T14);
    return T04;
}
// Optimal ate pairing computation over the BN12-254 curve
// https://hackmd.io/@jpw/bn254#Optimal-Ate-pairing
function optimal_ate_bn254(P, Q, Fq, E) {
    const f = Miller_loop_Ate_BN254(Q, P, Fq, E);
    return final_expontiation(Fq, f);
}
// This function sends points from E'(Fp2) to E(Fp12)
function twist(P, E) {
    if (E.is_zero(P))
        return null;
    const x = [[0n], [0n], P.x, [0n], [0n], [0n]];
    const y = [[0n], [0n], [0n], P.y, [0n], [0n]];
    return { x, y };
}
// Test 1: Optimal Ate Pairing over BN254
// https://hackmd.io/@jpw/bn254
const x = 4965661367192848881n;
const t = 6n * x ** 2n + 1n; // This is not necessary at all
const p = 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n;
const r = 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n;
(0, chai_1.assert)(r === p + 1n - t);
// Field Extensions
const beta = -1n; // quadratic non-residue in Fp
const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
const Fp = new primeField_1.PrimeField(p);
const Fp2 = new extensionField_1.ExtensionField(Fp, [-beta, 0n, 1n]);
const Fp12 = new extensionField_1.ExtensionFieldOverFq(Fp2, [
    Fp2.neg(xi),
    [0n],
    [0n],
    [0n],
    [0n],
    [0n],
    [1n, 0n],
]);
// Curve E: y² = x³ + 3 over Fp
const E = new ellipticCurve_1.EllipticCurveOverFp(0n, 3n, Fp);
// Generator of E(Fp)
let G1 = { x: 1n, y: 2n };
(0, chai_1.assert)(E.is_on_curve(G1), "G1 is not on curve E: y² = x³ + 3");
(0, chai_1.assert)(E.is_zero(E.escalarMul(G1, r)), "G1 is not a generator of the r-torsion");
// Twisted curve E': y² = x³ + 3/xi over Fp2
const a2 = [0n];
const b2 = Fp2.div([3n, 0n], xi);
const tE = new ellipticCurve_1.EllipticCurveOverFq(a2, b2, Fp2);
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
(0, chai_1.assert)(tE.is_on_curve(G2), "G2 is not on curve E': y² = x³ + 3/xi");
(0, chai_1.assert)(tE.is_zero(tE.escalarMul(G2, r)), "G2 is not a generator of the r-torsion");
// Curve y² = x³ + 3 over Fp12
const E12 = new ellipticCurve_1.EllipticCurveOverFqOverFq([[0n]], [[3n]], Fp12);
let tQ = twist(G2, tE);
const R = twist(tE.escalarMul(G2, 77n), tE); // Just to play a little bit
(0, chai_1.assert)(E12.is_on_curve(tQ), "The twist is not working");
(0, chai_1.assert)(E12.is_on_curve(R), "The twist is not working");
const k = (0, ellipticCurve_1.embedding_degree)(Fp, r);
(0, chai_1.assert)(k === 12n, "The embedding degree should be 12");
const P = { x: [1n], y: [2n] };
let Q = G2;
const e = optimal_ate_bn254(P, Q, Fp12, tE);
// Let's check the bilinearity of the pairing
const P2 = tE.escalarMul(P, 2n);
const P12 = tE.escalarMul(P, 12n);
const Q2 = tE.escalarMul(Q, 2n);
const Q12 = tE.escalarMul(Q, 12n);
const e1 = optimal_ate_bn254(P2, Q12, Fp12, tE);
const e2 = Fp12.exp(optimal_ate_bn254(P, Q12, Fp12, tE), 2n);
const e3 = Fp12.exp(optimal_ate_bn254(P2, Q, Fp12, tE), 12n);
const e4 = Fp12.exp(optimal_ate_bn254(P, Q, Fp12, tE), 24n);
const e5 = optimal_ate_bn254(P12, Q2, Fp12, tE);
(0, chai_1.assert)(Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5), "The pairing is not bilinear");
//# sourceMappingURL=optimal_ate_pairing.js.map