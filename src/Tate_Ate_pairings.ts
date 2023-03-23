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

// Find line y = mx + c passing through two points P and Q
// or vertical line y = x0 if Q = -P
// and evaluate it at a point T
function line(
    P: PointOverFq,
    Q: PointOverFq,
    T: PointOverFq,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    // Should we check that P, Q, T are on the curve?

    if (E.is_zero(P) || E.is_zero(Q) || E.is_zero(T)) {
        throw new Error("Cannot evaluate line at zero");
    }

    // First case: P and Q are distinct and not on the same vertical line
    if (P.x !== Q.x) {
        const m = Fq.div(Fq.sub(Q.y, P.y), Fq.sub(Q.x, P.x));
        const c = Fq.sub(P.y, Fq.mul(m, P.x));
        return Fq.sub(T.y, Fq.add(Fq.mul(m, T.x), c));

        // Second case: P and Q are the same point
    } else if (P.y === Q.y) {
        const m = Fq.div(
            Fq.add(Fq.mul([3n], Fq.mul(P.x, P.x)), E.a),
            Fq.mul([2n], P.y)
        );
        const c = Fq.sub(P.y, Fq.mul(m, P.x));
        return Fq.sub(T.y, Fq.add(Fq.mul(m, T.x), c));

        // Third case: P and Q are distinct and on the same vertical line
        // The line is y = P.x
    } else {
        return Fq.sub(T.y, P.x);
    }
}

// This is the BKLS-GHS version of Miller's algorithm for computing the Weil and Tate pairings
// Note: It only works for even embedding degrees k
// r is assumed to be in binary form as r[i]
// For sure, P is assumed to be from the (only) subgroup of E[r] over F_q
// Q is assumed to be from the trace zero subgroup of E[r] over F_{q**k}
// i.e., a Type 3 pairing is assumed
function Miller_loop_Tate(
    P: PointOverFq, // this point is actually over Fp
    Q: PointOverFq,
    r: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    if (E.is_zero(P) || E.is_zero(Q)) {
        return Fq.one;
    }

    let R = P;
    let f = Fq.one;
    // Only loop until the second to last bit of r
    for (let i = log2(r) - 2; i > 0; i--) {
        f = Fq.mul(Fq.mul(f, f), line(R, R, Q, Fq, E));
        R = E.add(R, R);
        if (r & (1n << BigInt(i))) {
            f = Fq.mul(f, line(R, P, Q, Fq, E));
            R = E.add(R, P);
        }
    }

    f = Fq.mul(Fq.mul(f, f), line(R, R, Q, Fq, E));

    return f;
}

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
    T: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    if (E.is_zero(Q) || E.is_zero(P)) {
        return Fq.one;
    }

    let R = Q;
    let f = Fq.one;
    for (let i = log2(T) - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), line(R, R, P, Fq, E));
        R = E.add(R, R);
        if (T & (1n << BigInt(i))) {
            f = Fq.mul(f, line(R, Q, P, Fq, E));
            R = E.add(R, Q);
        }
    }

    return f;
}

// Final exponentiation
function final_expontiation(r:bigint, Fq: ExtensionField, f: bigint[]): bigint[] {
    const k = embedding_degree(Fq.Fp, r);
    const exponent = (Fq.Fp.p ** k - 1n) / r; // It should be divisible
    return Fq.exp(f, exponent);
}

// Tate pairing computation
function Tate(
    P: PointOverFq,
    Q: PointOverFq,
    r: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    const e = Miller_loop_Tate(P, Q, r, Fq, E);
    return final_expontiation(r, Fq, e);
}

// Ate pairing computation
function Ate(
    P: PointOverFq,
    Q: PointOverFq,
    T: bigint,
    r: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    const e = Miller_loop_Ate(Q, P, T, Fq, E);
    return final_expontiation(r, Fq, e);
}


function log2(x: bigint): number {
    if (x == 0n) return 0;

    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}

// Some tests
const p = 47n;
const Fp = new PrimeField(p);
const E = new EllipticCurveOverFp(21n, 15n, Fp);
const n = 51;
// the torsion group parameter r is typically chosen
// as the largest prime factor of the order of the curve
const r = 17n;
const t = -3n; // t is the trace of Frobenius
const abs = (n: bigint) : bigint => n < 0n ? -n : n;
const T = abs(t-1n); // T is |t-1|
assert(T === 4n, "T should be 4");

const k = embedding_degree(Fp, r);
assert(k === 4n, "The embedding degree should be 4");

let P1 = { x: 45n, y: 23n };
assert(E.is_zero(E.escalarMul(P1, r)), "P is not in the r-torsion subgroup");

// To define Q, we need to move to the extension field F_{p**k}
const Fq = new ExtensionField(Fp, [5n, 0n, -4n, 0n, 1n]);
const eE = new EllipticCurveOverFq([21n], [15n], Fq);

const Q = { x: [29n, 0n, 31n], y: [0n, 11n, 0n, 35n] };
assert(eE.is_zero(eE.escalarMul(Q, r)), "Q is not in the r-torsion subgroup");

const P = { x: [45n], y: [23n] };
const e = Tate(P, Q, r, Fq, eE);
const eA = Ate(P, Q, T, r, Fq, eE);

assert(Fq.eq(e, [39n, 45n, 43n, 33n]), "Tate(P,Q) is not correctly computed");
assert(Fq.eq(eA, [25n, 25n, 37n, 21n]), "Ate(P,Q) is not correctly computed");

// // For sure, the pairing is non-degenerate
// assert P.additive_order() == Q.additive_order() == r
assert(Fq.neq(e, Fq.one), "The pairing is degenerate");
assert(Fq.neq(eA, Fq.one), "The pairing is degenerate");

// // Let's check the bilinearity of the pairing
const P2 = eE.escalarMul(P, 2n);
const P12 = eE.escalarMul(P, 12n);
const Q2 = eE.escalarMul(Q, 2n);
const Q12 = eE.escalarMul(Q, 12n);
const e1 = Tate(P2, Q12, r, Fq, eE);
const e2 = Fq.exp(Tate(P, Q12, r, Fq, eE), 2n);
const e3 = Fq.exp(Tate(P2, Q, r, Fq, eE), 12n);
const e4 = Fq.exp(Tate(P, Q, r, Fq, eE), 24n);
const e5 = Tate(P12, Q2, r, Fq, eE);
const eA1 = Ate(P2, Q12, T, r, Fq, eE);
const eA2 = Fq.exp(Ate(P, Q12, T, r, Fq, eE), 2n);
const eA3 = Fq.exp(Ate(P2, Q, T, r, Fq, eE), 12n);
const eA4 = Fq.exp(Ate(P, Q, T, r, Fq, eE), 24n);
const eA5 = Ate(P12, Q2, T, r, Fq, eE);

assert(
    Fq.eq(e1, e2) && Fq.eq(e1, e3) && Fq.eq(e1, e4) && Fq.eq(e1, e5),
    "The pairing is not bilinear"
);
assert(
    Fq.eq(eA1, eA2) && Fq.eq(eA1, eA3) && Fq.eq(eA1, eA4) && Fq.eq(eA1, eA5),
    "The pairing is not bilinear"
);

// Check the trivial evaluations are satisfied
assert(Fq.eq(Tate(eE.zero, Q, r, Fq, eE), Fq.one), "Tate(0,Q) != 1");
assert(Fq.eq(Tate(P, eE.zero, r, Fq, eE), Fq.one), "Tate(P,0) != 1");
assert(Fq.eq(Ate(eE.zero, Q, T, r, Fq, eE), Fq.one), "Ate(0,Q) != 1");
assert(Fq.eq(Ate(P, eE.zero, T, r, Fq, eE), Fq.one), "Ate(P,0) != 1");

// Since P and Q are generators, we should have that Tate(P,Q) is a primitive r-th root of unity
// i.e. a generator of set of roots of unity of order r
// assert multiplicative_order(Tate(P,Q)) == r
