import { assert } from "chai";
import {
    PointOverFp,
    PointOverFq,
    PointOverFqOverFq,
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    EllipticCurveOverFqOverFq,
} from "../ellipticCurve";
import { ExtensionField, ExtensionFieldOverFq } from "../extensionField";
import { PrimeField } from "../primeField";
import { line } from "./common";
import * as constants from "./constants";

// TODO: Implement cyclotomic subgroup squaring

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
    for (let i = constants.ate_loop_count.length - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), line(R, R, P, Fq.Fq, E));
        R = E.add(R, R);
        if (constants.ate_loop_count[i] === 1) {
            f = Fq.mul(f, line(R, Q, P, Fq.Fq, E));
            R = E.add(R, Q);
        } else if (constants.ate_loop_count[i] === -1) {
            const nQ = E.neg(Q);
            f = Fq.mul(f, line(R, nQ, P, Fq.Fq, E));
            R = E.add(R, nQ);
        }
    }

    const xconjgugate = conjugateFp2(Q.x);
    const yconjugate = conjugateFp2(Q.y);
    const Qp: PointOverFq = {
        x: Fq.Fq.mul(constants.gamma12, xconjgugate),
        y: Fq.Fq.mul(constants.gamma13, yconjugate),
    };

    const xpconjugate = [Qp.x[0], -Qp.x[1]];
    const ypconjugate = [Qp.y[0], -Qp.y[1]];
    const S: PointOverFq = {
        x: Fq.Fq.mul(constants.gamma12, xpconjugate),
        y: Fq.Fq.mul(constants.gamma13, ypconjugate),
    };
    const Qpp = E.neg(S);
    f = Fq.mul(f, line(R, Qp, P, Fq.Fq, E));
    R = E.add(R, Qp);
    f = Fq.mul(f, line(R, Qpp, P, Fq.Fq, E));

    return f;
}

function conjugateFp2(a: bigint[]): bigint[] {
    return [a[0], -a[1]];
}

function conjugateFp12(a: bigint[][], Fq: ExtensionField): bigint[][] {
    return [a[0], Fq.neg(a[1]), a[2], Fq.neg(a[3]), a[4], Fq.neg(a[5])];
}

function Frobenius_operator1(f: bigint[][], Fq: ExtensionField): bigint[][] {
    const conjugates: bigint[][] = [];
    for (let i = 0; i < f.length; i++) {
        conjugates.push(conjugateFp2(f[i]));
    }

    return [
        conjugates[0],
        Fq.mul(constants.gamma11, conjugates[1]),
        Fq.mul(constants.gamma12, conjugates[2]),
        Fq.mul(constants.gamma13, conjugates[3]),
        Fq.mul(constants.gamma14, conjugates[4]),
        Fq.mul(constants.gamma15, conjugates[5]),
    ];
}

function Frobenius_operator2(f: bigint[][], Fq: ExtensionField): bigint[][] {
    return [
        f[0],
        Fq.mul(constants.gamma21, f[1]),
        Fq.mul(constants.gamma22, f[2]),
        Fq.mul(constants.gamma23, f[3]),
        Fq.mul(constants.gamma24, f[4]),
        Fq.mul(constants.gamma25, f[5]),
    ];
}

function Frobenius_operator3(f: bigint[][], Fq: ExtensionField): bigint[][] {
    const conjugates: bigint[][] = [];
    for (let i = 0; i < f.length; i++) {
        conjugates.push(conjugateFp2(f[i]));
    }

    return [
        conjugates[0],
        Fq.mul(constants.gamma31, conjugates[1]),
        Fq.mul(constants.gamma32, conjugates[2]),
        Fq.mul(constants.gamma33, conjugates[3]),
        Fq.mul(constants.gamma34, conjugates[4]),
        Fq.mul(constants.gamma35, conjugates[5]),
    ];
}

// Final exponentiation
function final_expontiation(
    Fq: ExtensionFieldOverFq,
    f: bigint[][]
): bigint[][] {
    // a] easy part
    // first, compute f^(p^6-1)=conjugate(f) · f^-1
    let conjugatef = conjugateFp12(f, Fq.Fq);

    const feasy1 = Fq.mul(conjugatef, Fq.inv(f));

    // second, compute feasy1^(p^2+1) = feasy1^(p^2) · feasy1
    const feasy2 = Frobenius_operator2(feasy1, Fq.Fq);
    const feasy = Fq.mul(feasy1, feasy2);

    // b] hard part
    const mx = Fq.exp(feasy, constants.x);
    const mx2 = Fq.exp(mx, constants.x);
    const mx3 = Fq.exp(mx2, constants.x);
    const mp = Frobenius_operator1(feasy, Fq.Fq);
    const mp2 = Frobenius_operator2(feasy, Fq.Fq);
    const mp3 = Frobenius_operator3(feasy, Fq.Fq);
    const mxp = Frobenius_operator1(mx, Fq.Fq);
    const mxp2 = Frobenius_operator1(mx2, Fq.Fq);
    const mxp3 = Frobenius_operator1(mx3, Fq.Fq);
    const mx2p2 = Frobenius_operator2(mx2, Fq.Fq);

    const y0 = Fq.mul(Fq.mul(mp, mp2), mp3);
    const y1 = conjugateFp12(feasy, Fq.Fq);
    const y2 = mx2p2;
    const y3 = conjugateFp12(mxp, Fq.Fq);
    const y4 = conjugateFp12(Fq.mul(mx, mxp2), Fq.Fq);
    const y5 = conjugateFp12(mx2, Fq.Fq);
    const y6 = conjugateFp12(Fq.mul(mx3, mxp3), Fq.Fq);

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
function optimal_ate_bn254(
    P: PointOverFp,
    Q: PointOverFq,
    Fq: ExtensionFieldOverFq
): bigint[][] {
    if (E.is_zero(P) && tE.is_zero(Q) === false) {
        // Check that Q belongs to E'(Fp2)[r]
        const R = twist_endomorphism(Q);
        const S = tE.escalarMul(Q, 6n * constants.x ** 2n);
        assert(
            Fq.Fq.eq(R.x, S.x) && Fq.Fq.eq(R.y, S.y),
            "Q doest not belong to E'(Fp2)[r]"
        );

        return [[1n]];
    } else if (E.is_zero(P) === false && tE.is_zero(Q)) {
        assert(E.is_on_curve(P), "P doest not belong to E(Fp)[r]");

        return [[1n]];
    } else if (E.is_zero(P) && tE.is_zero(Q)) {
        return [[1n]];
    }

    // a] Check that P belongs to E(Fp)[r] = E(Fp)
    assert(E.is_on_curve(P), "P doest not belong to E(Fp)[r]");

    // b] Check that Q belongs to E'(Fp2)[r]
    const R = twist_endomorphism(Q);
    const S = tE.escalarMul(Q, 6n * constants.x ** 2n);
    assert(
        Fq.Fq.eq(R.x, S.x) && Fq.Fq.eq(R.y, S.y),
        "Q doest not belong to E'(Fp2)[r]"
    );

    const Pm = { x: [P.x], y: [P.y] };

    // c] Compute the pairing
    const f = Miller_loop_Ate_BN254(Q, Pm, Fq, tE);

    return final_expontiation(Fq, f);
}

// This function sends points from E'(Fp2) to E(Fp12)
function twist(P: PointOverFq, E: EllipticCurveOverFq): PointOverFqOverFq {
    if (E.is_zero(P)) return null;

    const x = [[0n], [0n], P.x, [0n], [0n], [0n]];
    const y = [[0n], [0n], [0n], P.y, [0n], [0n]];

    return { x, y };
}

// This function sends points from E'(Fp2) to E(Fp12)
function twist_endomorphism(P: PointOverFq): PointOverFq {
    if (tE.is_zero(P)) return null;

    const xconjgugate = conjugateFp2(P.x);
    const yconjugate = conjugateFp2(P.y);
    return {
        x: Fp2.mul(constants.twist1, xconjgugate),
        y: Fp2.mul(constants.twist2, yconjugate),
    };
}

// Test 1: Optimal Ate Pairing over BN254
// https://hackmd.io/kcEJAWISQ56eE6YpBnurgw
// Field Extensions
const beta = -1n; // quadratic non-residue in Fp
const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
const Fp = new PrimeField(constants.p);
const Fp2 = new ExtensionField(Fp, [-beta, 0n, 1n]);
const Fp12 = new ExtensionFieldOverFq(Fp2, [
    Fp2.neg(xi),
    [0n],
    [0n],
    [0n],
    [0n],
    [0n],
    [1n, 0n],
]);

// Curve E: y² = x³ + 3 over Fp
const E = new EllipticCurveOverFp(0n, 3n, Fp);
// Generator of E(Fp)[r] = E(Fp)
let G1 = { x: 1n, y: 2n };

// Twisted curve E': y² = x³ + 3/xi over Fp2
const a2 = [0n];
const b2 = Fp2.div([3n, 0n], xi);
const tE = new EllipticCurveOverFq(a2, b2, Fp2);
// Generator of E'(Fp2)[r]
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

// Curve y² = x³ + 3 over Fp12
const E12 = new EllipticCurveOverFqOverFq([[0n]], [[3n]], Fp12);

let tQ = twist(G2, tE);
const R = twist(tE.escalarMul(G2, 77n), tE); // Just to play a little bit
assert(E12.is_on_curve(tQ), "The twist is not working");
assert(E12.is_on_curve(R), "The twist is not working");

const P = G1;
const Q = G2;
const e = optimal_ate_bn254(P, Q, Fp12);

// Let's check the bilinearity of the pairing
const P2 = E.escalarMul(P, 2n);
const P12 = E.escalarMul(P, 12n);
const Q2 = tE.escalarMul(Q, 2n);
const Q12 = tE.escalarMul(Q, 12n);
const e1 = optimal_ate_bn254(P2, Q12, Fp12);
const e2 = Fp12.exp(optimal_ate_bn254(P, Q12, Fp12), 2n);
const e3 = Fp12.exp(optimal_ate_bn254(P2, Q, Fp12), 12n);
const e4 = Fp12.exp(optimal_ate_bn254(P, Q, Fp12), 24n);
const e5 = optimal_ate_bn254(P12, Q2, Fp12);

assert(
    Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5),
    "The pairing is not bilinear"
);

// More examples
const P1005 = E.escalarMul(P, 1005n);
const P1788 = E.escalarMul(P, 1788n);
const Q1005 = tE.escalarMul(Q, 1005n);
const Q1788 = tE.escalarMul(Q, 1788n);
const e6 = optimal_ate_bn254(P1005, Q1788, Fp12);
const e7 = Fp12.exp(optimal_ate_bn254(P, Q1788, Fp12), 1005n);
const e8 = Fp12.exp(optimal_ate_bn254(P1005, Q, Fp12), 1788n);
const e9 = Fp12.exp(optimal_ate_bn254(P, Q, Fp12), 1788n * 1005n);
const e10 = optimal_ate_bn254(P1788, Q1005, Fp12);

assert(
    Fp12.eq(e6, e7) && Fp12.eq(e6, e8) && Fp12.eq(e6, e9) && Fp12.eq(e6, e10),
    "The pairing is not bilinear"
);
