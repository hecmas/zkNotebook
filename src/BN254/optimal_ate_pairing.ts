import { assert } from "chai";
import {
    PointOverFp,
    PointOverFq,
    PointOverFqOverFq,
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    EllipticCurveOverFqOverFq,
    embedding_degree,
} from "../ellipticCurve";
import { ExtensionField, ExtensionFieldOverFq } from "../extensionField";
import { PrimeField } from "../primeField";
import { line } from "./common";
import { gamma12, gamma13 } from "./Frobenius_constants";

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
function Miller_loop_Ate_BN254(
    Q: PointOverFq,
    P: PointOverFq, // this point is actually over Fp
    Fq: ExtensionFieldOverFq,
    E: EllipticCurveOverFq
): bigint[][] {
    if (E.is_zero(Q) || E.is_zero(P)) {
        return Fq.one;
    }

    let R = Q;
    let f = Fq.one;
    for (let i = bound.length - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), line(R, R, P, Fq.Fq, E));
        R = E.add(R, R);
        if (bound[i] === 1) {
            f = Fq.mul(f, line(R, Q, P, Fq.Fq, E));
            R = E.add(R, Q);
        } else if (bound[i] === -1) {
            const nQ = E.neg(Q);
            f = Fq.mul(f, line(R, nQ, P, Fq.Fq, E));
            R = E.add(R, nQ);
        }
    }

    const xconjgugate = [Q.x[0], -Q.x[1]];
    const yconjugate = [Q.y[0], -Q.y[1]];
    const Qp: PointOverFq = { x: Fq.Fq.mul(gamma12,xconjgugate), y: Fq.Fq.mul(gamma13,yconjugate) };

    const xpconjugate = [Qp.x[0], -Qp.x[1]];
    const ypconjugate = [Qp.y[0], -Qp.y[1]];
    const S: PointOverFq = { x: Fq.Fq.mul(gamma12,xpconjugate), y: Fq.Fq.mul(gamma13,ypconjugate) };
    const Qpp = E.neg(S);
    f = Fq.mul(f, line(R, Qp, P, Fq.Fq, E));
    R = E.add(R, Qp);
    f = Fq.mul(f, line(R, Qpp, P, Fq.Fq, E));

    return f;
}

function Frobenius(P: PointOverFq, Fq: ExtensionField): PointOverFq {
    return { x: Fq.exp(P.x, p), y: Fq.exp(P.y, p) };
}

// Final exponentiation
function final_expontiation(
    Fq: ExtensionFieldOverFq,
    f: bigint[][]
): bigint[][] {
    const exponent = (p ** k - 1n) / r; // It should be divisible
    return Fq.exp(f, exponent);
}

// Optimal ate pairing computation over the BN12-254 curve
// https://hackmd.io/@jpw/bn254#Optimal-Ate-pairing
function optimal_ate_bn254(
    P: PointOverFq,
    Q: PointOverFq,
    Fq: ExtensionFieldOverFq,
    E: EllipticCurveOverFq
): bigint[][] {

    const f = Miller_loop_Ate_BN254(Q, P, Fq, E);

    return final_expontiation(Fq, f);
}


// This function sends points from E'(Fp2) to E(Fp12)
function twist(
    P: PointOverFq,
    E: EllipticCurveOverFq
): PointOverFqOverFq {
    if (E.is_zero(P)) return null;

    const x = [[0n],[0n],P.x,[0n],[0n],[0n]];
    const y = [[0n],[0n],[0n],P.y,[0n],[0n]];

    return { x,y };
}



// Test 1: Optimal Ate Pairing over BN254
// https://hackmd.io/@jpw/bn254
const x = 4965661367192848881n;
const t = 6n * x ** 2n + 1n; // This is not necessary at all
const p = 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n;
const r = 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n;
assert(r === p+1n-t)

// Field Extensions
const beta = -1n; // quadratic non-residue in Fp
const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
const Fp = new PrimeField(p);
const Fp2 = new ExtensionField(Fp, [-beta, 0n, 1n]);
const Fp12 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [0n], [0n], [0n], [0n], [1n,0n]]);

// Curve E: y² = x³ + 3 over Fp
const E = new EllipticCurveOverFp(0n, 3n, Fp);
// Generator of E(Fp)
let G1 = { x: 1n, y: 2n };
assert(E.is_on_curve(G1), "G1 is not on curve E: y² = x³ + 3");
assert(
    E.is_zero(E.escalarMul(G1, r)),
    "G1 is not a generator of the r-torsion"
);

// Twisted curve E': y² = x³ + 3/xi over Fp2
const a2 = [0n];
const b2 = Fp2.div([3n, 0n], xi);
const tE = new EllipticCurveOverFq(a2, b2, Fp2);
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
assert(tE.is_on_curve(G2), "G2 is not on curve E': y² = x³ + 3/xi");
assert(
    tE.is_zero(tE.escalarMul(G2, r)),
    "G2 is not a generator of the r-torsion"
);

// Curve y² = x³ + 3 over Fp12
const E12 = new EllipticCurveOverFqOverFq([[0n]], [[3n]], Fp12);

let tQ = twist(G2, tE);
const R = twist(tE.escalarMul(G2,77n),tE); // Just to play a little bit
assert(E12.is_on_curve(tQ), "The twist is not working");
assert(E12.is_on_curve(R), "The twist is not working");

const k = embedding_degree(Fp, r);
assert(k === 12n, "The embedding degree should be 12");

const P = { x: [1n], y: [2n] };
let Q = G2
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

assert(
    Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5),
    "The pairing is not bilinear"
);
