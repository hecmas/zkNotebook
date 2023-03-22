import {
    PointOverFp,
    PointOverFq,
    EllipticCurveOverFp,
    EllipticCurveOverFq,
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
        // The line is y = P.xy()[0]
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
function Miller_loop(
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

// Pairing computation
function Tate(
    P: PointOverFq,
    Q: PointOverFq,
    r: bigint,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    // Let's compute the final exponentiation
    const k = E.embedding_degree(r);
    const exponent = (r ** k - 1n) / r; // It should be divisible
    return Fq.exp(Miller_loop(P, Q, r, Fq, E), exponent);
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

const p = 47n;
const Fp = new PrimeField(p);
const E = new EllipticCurveOverFp(21n, 15n, Fp);
const n = 51;
// the torsion group parameter r is typically chosen
// as the largest prime factor of the order of the curve
const r = 17n;
const k = E.embedding_degree(r);
console.log("k = ", k);

const P = { x: 45n, y: 23n };
console.log("rP = ", E.escalarMul(P, r)); // P is in the r-torsion subgroup

// To define Q, we need to move to the extension field F_{p**k}
const Fq = new ExtensionField(Fp, [5n, 0n, -4n, 0n, 1n]);
const eE = new EllipticCurveOverFq([21n], [15n], Fq);

const Q = { x: [29n, 0n, 31n], y: [0n, 11n, 0n, 35n] };
console.log("rQ = ", eE.escalarMul(Q, r)); // Q is in the r-torsion subgroup

// const f = Tate(P, Q, r, Fq, eE);

// assert Tate(P,Q) == 33*u^3 + 43*u^2 + 45*u + 39

// // For sure, the pairing is non-degenerate
// assert P.additive_order() == Q.additive_order() == r
// assert Tate(P,Q) != F.one()

// // Let's check the bilinearity of the pairing
// assert Tate(2*P, 12*Q) == Tate(P,12*Q)^2 == Tate(2*P,Q)^12 == Tate(P,Q)^24 == Tate(12*P,2*Q)
// // assert Weil(2*P, 12*Q) == Weil(P,12*Q)^2 == Weil(2*P,Q)^12 == Weil(P,Q)^24 == Weil(12*P,2*Q)

// // Check the trivial evaluations are satisfied
// assert Tate(E(0),Q) == Tate(P,E(0)) == F.one()

// // Since P and Q are generators, we should have that Tate(P,Q) is a primitive r-th root of unity
// // i.e. a generator of set of roots of unity of order r
// assert multiplicative_order(Tate(P,Q)) == r
