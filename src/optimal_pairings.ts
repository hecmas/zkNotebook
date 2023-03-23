import { assert } from "chai";
import {
    PointOverFp,
    PointOverFq,
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    embedding_degree,
} from "./ellipticCurve";
import { ExtensionField } from "./extensionField";
import { PrimeField } from "./primeField";
import { line, log2 } from "./common";

/* 
 This is the ate pairing obtained with loop shortening optimizations
 Note: It only works for even embedding degrees k
 For sure, Q is assumed to be from the trace zero subgroup of E[r] over F_{q**k}
 P is assumed to be from the (only) subgroup of E[r] over F_q
 i.e., a (reversed) Type 3 pairing is assumed
 Note: Since the loop goes only until |t-1| < r, we cannot save the last "add"
       in the "double-and-add" as in the Tate pairing 
*/
function Miller_loop_Ate(
    Q: PointOverFq,
    P: PointOverFq, // this point is actually over Fp
    loop_length: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    if (E.is_zero(Q) || E.is_zero(P)) {
        return Fq.one;
    }

    let R = Q;
    let f = Fq.one;
    for (let i = log2(loop_length) - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), line(R, R, P, Fq, E));
        R = E.add(R, R);
        if (loop_length & (1n << BigInt(i))) {
            f = Fq.mul(f, line(R, Q, P, Fq, E));
            R = E.add(R, Q);
        }
    }

    return f;
}

// Final exponentiation
function final_expontiation(
    r: bigint,
    Fq: ExtensionField,
    f: bigint[]
): bigint[] {
    const k = embedding_degree(Fq.Fp, r);
    const exponent = (Fq.Fp.p ** k - 1n) / r; // It should be divisible
    return Fq.exp(f, exponent);
}

// Ate pairing computation
// https://eprint.iacr.org/2008/096.pdf
function optimal_ate_bn12_271(
    x: bigint,
    P: PointOverFq,
    Q: PointOverFq,
    r: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    let c: bigint[] = [];
    c[0] = 6n * x + 2n;
    c[1] = 1n;
    c[2] = -1n;
    c[3] = 1n;

    let s: bigint[] = [];
    // s0 = c0 + c1*p + c2*p^2 + c3*p^3
    s[0] = 0n;
    for (let i = 3; i >= 0; i--) {
        s[0] = s[0] * Fq.Fp.p + c[i];
    }

    // s1 = c1*p + c2*p^2 + c3*p^3
    s[1] = s[0] - c[0];

    // s2 = c2*p^2 + c3*p^3
    s[2] = s[1] - c[1] * Fq.Fp.p;

    // s3 = c3*p^3
    s[3] = s[2] - c[2] * Fq.Fp.p ** 2n;

    const f1 = Miller_loop_Ate(Q, P, c[0], Fq, E);
    const l1 = line(E.escalarMul(Q, s[1]), E.escalarMul(Q, c[0]), P, Fq, E);
    const l2 = line(
        E.escalarMul(Q, s[2]),
        E.escalarMul(Q, c[1] * Fq.Fp.p),
        P,
        Fq,
        E
    );
    const l3 = line(
        E.escalarMul(Q, s[3]),
        E.escalarMul(Q, c[2] * Fq.Fp.p ** 2n),
        P,
        Fq,
        E
    );

    const result = Fq.mul(f1, Fq.mul(l1, Fq.mul(l2, l3)));
    return final_expontiation(r, Fq, result);
}

// Section 3 of https://www.cryptojedi.org/papers/pfcpo.pdf
// and https://github.com/ethereum/py_pairing/blob/master/py_ecc/bn128/bn128_curve.py#L86
function twist(
    P: PointOverFq,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): PointOverFq {
    if (E.is_zero(P)) return P;

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
const t = 6n * x ** 2n + 1n;
const p = 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n;
const r = 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n;

// Field Extensions
const beta = -1n; // quadratic non-residue in Fp
const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
const Fp = new PrimeField(p);
const Fp2 = new ExtensionField(Fp, [-beta, 0n, 1n]);
const Fp12 = new ExtensionField(Fp, [
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
const E = new EllipticCurveOverFp(0n, 3n, Fp);
// Generator of E(Fp)
const G1 = { x: 1n, y: 2n };

// Twisted curve E': y² = x³ + 3/xi over Fp2
const a2 = [0n];
const b2 = Fp2.div([3n, 0n], xi);
const E2 = new EllipticCurveOverFq(a2, b2, Fp2);
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

// Curve y² = x³ + 3 over Fp12
const E12 = new EllipticCurveOverFq([0n], [3n], Fp12);

const G12 = twist(G2, Fp12, E2);
assert(E12.is_on_curve(G12), "The twist is not working");

const k = embedding_degree(Fp, r);
assert(k === 12n, "The embedding degree should be 12");

// let P1 = { x: 45n, y: 23n };
// assert(E.is_zero(E.escalarMul(P1, r)), "P is not in the r-torsion subgroup");

// // To define Q, we need to move to the extension field F_{p**k}
// const Fq = new ExtensionField(Fp, [5n, 0n, -4n, 0n, 1n]);
// const eE = new EllipticCurveOverFq([21n], [15n], Fq);

// const Q = { x: [29n, 0n, 31n], y: [0n, 11n, 0n, 35n] };
// assert(eE.is_zero(eE.escalarMul(Q, r)), "Q is not in the r-torsion subgroup");

// const P = { x: [45n], y: [23n] };
