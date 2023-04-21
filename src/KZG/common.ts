import {
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    PointOverFp,
    PointOverFq,
} from "../ellipticCurve";
import { degree } from "../polynomials";
import { PrimeField } from "../primeField";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

// INSECURE: the srs should be obtained through a MPC protocol
/**
 * @input n: the upper bound of the polynomial degree. I.e. the polynomials that can be committed
 * under this srs have degree in [0, n-1].
 * @returns It outputs `[[1]_1,[s]_1,[s^2]_1,...,[s^{n-1}]_1,[1]_2,[s]_2]`, the srs used in the KZG PCS.
 */
export function srs_mock(
    E: EllipticCurveOverFp,
    tE: EllipticCurveOverFq,
    G1: PointOverFp,
    G2: PointOverFq,
    r: bigint,
    n: bigint
): [PointOverFp[], PointOverFq[]] {
    const Fr = new PrimeField(r); // the scalar field of E
    const s = bigintRnd(r);

    let srs1: PointOverFp[] = [];
    for (let i = 0; i < n; i++) {
        const powerofs = Fr.exp(s, BigInt(i));
        srs1.push(E.escalarMul(G1, powerofs));
    }

    let srs2: PointOverFq[] = [];
    srs2.push(G2);
    srs2.push(tE.escalarMul(G2, s));

    return [srs1, srs2];
}

// Assume polynomial p(x) = a0 + a1·x + a2·x^2 + ... + ad·x^d
// is given as an array of its coefficients [a0, a1, a2, ..., ad]
/**
 * @input pol: a polynomial [a0, a1, a2, ..., ad] of appropriate degree.
 * @returns It outputs the E point `[f(s)]_1 = a0[1]_1 + a1[s]_1 + ... + ad[s^d]_1`.
 */
export function commit_polynomial(
    E: EllipticCurveOverFp,
    srs: [PointOverFp[], PointOverFq[]],
    pol: bigint[]
) {
    const [srs1] = srs;
    const d = degree(pol);
    if (d >= srs1.length) {
        throw new Error("The polynomial degree is too large");
    }

    let com: PointOverFp = E.zero;
    for (let i = 0; i <= d; i++) {
        com = E.add(com, E.escalarMul(srs1[i], pol[i]));
    }

    return com;
}
