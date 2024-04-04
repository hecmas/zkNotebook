import { assert } from "chai";
import * as constants from "./constants";
import { G1, G2, E, tE, E12, Fp, Fp2, Fp12_o2, Fp12_o4 } from "./parameters";
import { PrimeField } from "../primeField";
import { ExtensionField, ExtensionFieldOverFq, ExtensionFieldOverFqOverFq } from "../extensionField";
import {
    PointOverFp,
    PointOverFq,
    PointOverFqOverFq,
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    EllipticCurveOverFqOverFq,
} from "../ellipticCurve";

/**
 * It checks whether e(P1, Q1) · e(P2, Q2) · ... · e(Pn, Qn) = 1
 */
function verify_pairing_identity(Ps: PointOverFp[], Qs: PointOverFq[]) {
    assert(Ps.length === Qs.length, "Ps and Qs must have the same length");

    const f = Ps.reduce(
        (acc, P, i) => Fp12_o2.mul(acc, optimal_ate_bls12_381_nfe(P, Qs[i])),
        [[1n]]
    );

    return Fp12_o2.eq(final_expontiation(f, Fp12_o2), [[1n]]);
}

/**
 * It computes the optimal Ate pairing over the BLS12-381 curve.
 * Check [here](https://hackmd.io/kcEJAWISQ56eE6YpBnurgw) for more information.
 */
function optimal_ate_bls12_381(P: PointOverFp, Q: PointOverFq): bigint[][] {
    const f = optimal_ate_bls12_381_nfe(P, Q);
    return final_expontiation(f);
}

/**
 * It checks whether the points P,Q input to the optimal ate pairing over the BLS12-381
 * belong to the appropriate subgropus and, if so, computes the Miller loop.
 */
function optimal_ate_bls12_381_nfe(P: PointOverFp, Q: PointOverFq): bigint[][] {
    if (E.is_zero(P) && tE.is_zero(Q) === false) {
        // Check that Q belongs to E'(Fp2)[r]
        assert(subgroup_check_G2(Q), "Q does not belong to E'(Fp2)[r]");
        return [[1n]];
    } else if (E.is_zero(P) === false && tE.is_zero(Q)) {
        // Check that P belongs to E(Fp)[r]
        assert(subgroup_check_G1(P), "P does not belong to E(Fp)[r]");
        return [[1n]];
    } else if (E.is_zero(P) && tE.is_zero(Q)) {
        return [[1n]];
    }

    // a] Check that P belongs to E(Fp)[r] = E(Fp)
    assert(subgroup_check_G1(P), "P does not belong to E(Fp)[r]");

    // b] Check that Q belongs to E'(Fp2)[r]
    assert(subgroup_check_G2(Q), "Q does not belong to E'(Fp2)[r]");

    const Pm = { x: [P.x], y: [P.y] };

    // c] Compute the Miller loop
    const f = Miller_loop_Ate_bls12_381(Q, Pm, Fp12_o2, tE);

    return f;
}

/**
 * It computes the Miller loop for the optimal Ate pairing over the BLS12-381 curve.
 * Hence, it performs all the computations of the optimal Ate pairing except for the final exponentiation.
 * Q is assumed to be from the (only) subgroup of E'[r] over Fp2.
 * P is assumed to be from the (only) subgroup of E[r] over Fp.
 */
function Miller_loop_Ate_bls12_381(
    Q: PointOverFq,
    P: PointOverFq, // this point is actually over Fp
    Fq: ExtensionFieldOverFq,
    E: EllipticCurveOverFq
): bigint[][] {
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

    // TODO: TO CHECK!!!
    // We must conjugate the result since the BLS factor t is negative
    return f;
}
/**
 * Find line y = mx + c passing through two points P and Q of E'(Fp2)
 * and evaluate it at a third point T of E'(Fp2)
*/
function line(
    P: PointOverFq,
    Q: PointOverFq,
    T: PointOverFq,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[][] {
    if (E.is_zero(P) || E.is_zero(Q) || E.is_zero(T)) {
        throw new Error("Cannot work with the point at infinity");
    }

    // First case: P and Q are distinct and not on the same vertical line
    if (P.x !== Q.x) {
        // (x2'-x1')·y
        const a = Fq.mul(Fq.sub(Q.x, P.x), T.y);

        // (y1'-y2')·x
        const b = Fq.mul(Fq.sub(P.y, Q.y), T.x);

        // (x1'y2'-x2'y1')
        const c = Fq.sub(Fq.mul(P.x, Q.y), Fq.mul(Q.x, P.y));

        return [c, [0n], b, a, [0n], [0n]];

    // Second case: P and Q are the same point
    } else if (P.y === Q.y) {
        // (3x'^3 - 2y'^2)
        const a = Fq.sub(
            Fq.mul(Fq.exp(P.x, 3n), [3n]),
            Fq.mul(Fq.exp(P.y, 2n), [2n])
        );

        // 2y'y
        const b = Fq.mul(Fq.mul(P.y, T.y), [2n]);

        // -3x'^2x
        const c = Fq.mul(Fq.mul(Fq.exp(P.x, 2n), T.x), [-3n]);

        return [[0n], a, [0n], c, b, [0n]];
    } else {
        throw new Error("Points are on the same vertical line");
    }
}

function final_expontiation(
    f: bigint[][],
    Fq: ExtensionFieldOverFq = Fp12_o2
): bigint[][] {
    // a] easy part
    // ==============================
    // 1] f^(p^6-1)=conjugate(f) * f^-1
    const feasy1 = Fq.mul(conjugateFp12(f), Fq.inv(f));

    // 2] feasy1^(p^2+1) = feasy1^(p^2) * feasy1
    const m = Fq.mul(Frobenius_operator2(feasy1), feasy1);

    // b] hard part
    // ==============================
    const x = -constants.x;

    // 1] m^{(x+1)/3}
    const y1 = Fq.exp(m, constants.x_plus_one_div_three_abs);

    // 2] m^{(x+1)^2/3}
    const y2 = Fq.exp(y1, constants.x_plus_one_abs);

    // 3.1] m^{(x+1)^2/3*-x}
    const y31 = Fq.exp(conjugateFp12(y2),x);

    // 3.2] m^{(x+1)^2/3*p}
    const y32 = Frobenius_operator1(y2);

    // 4] m^{(x+1)^2/3*(p-x)}
    const y4 = Fq.mul(y31,y32);

    // 5.1] m^{(x+1)^2/3*(p-x)*x^2}
    const y51 = Fq.exp(Fq.exp(y4, x), x);

    // 5.2] m^{(x+1)^2/3*(p-x)*p^2}
    const y52 = Frobenius_operator2(y4);

    // 5.3] m^{(x+1)^2/3*(p-x)*-1}
    const y53 = conjugateFp12(y4);

    // 6] m^{(x+1)^2/3*(p-x)*(x^2+p^2)}
    const y6 = Fq.mul(y51,y52);

    // 7] m^{(x+1)^2/3*(p-x)*(x^2+p^2-1)}
    const y7 = Fq.mul(y6,y53);

    // 8] m^{(x+1)^2/3*(p-x)*(x^2+p^2-1)+1}
    const y8 = Fq.mul(y7,m);

    return y8;
}

function Frobenius_operator1(f: bigint[][], Fq: ExtensionField = Fp2): bigint[][] {
    while (f.length < 6) {
        f.push([0n]);
    }

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

function Frobenius_operator2(f: bigint[][], Fq: ExtensionField = Fp2): bigint[][] {
    while (f.length < 6) {
        f.push([0n]);
    }

    return [
        f[0],
        Fq.mul(constants.gamma21, f[1]),
        Fq.mul(constants.gamma22, f[2]),
        Fq.mul(constants.gamma23, f[3]),
        Fq.mul(constants.gamma24, f[4]),
        Fq.mul(constants.gamma25, f[5]),
    ];
}

function conjugateFp2(a: bigint[]): bigint[] {
    if (a.length === 1) return [a[0]];

    return [a[0], Fp.neg(a[1])];
}

function conjugateFp12(a: bigint[][]): bigint[][] {
    while (a.length < 6) {
        a.push([0n]);
    }

    return [a[0], Fp2.neg(a[1]), a[2], Fp2.neg(a[3]), a[4], Fp2.neg(a[5])];
}

// Ref: https://eprint.iacr.org/2019/814.pdf
function subgroup_check_G1(P: PointOverFp, curve: EllipticCurveOverFp = E): boolean {
    const sig = sigma(P);
    const sig2 = sigma(sig);

    const a = curve.escalarMul(
        curve.sub(curve.sub(curve.double(sig), P), sig2),
        constants.x_sq_div_three
    );

    return curve.eq(a, sig2);
}

function sigma(P: PointOverFp, F: PrimeField = Fp): PointOverFp {
    return { x: F.mul(constants.gamma, P.x), y: P.y };
}

// Ref: https://eprint.iacr.org/2019/814.pdf
function subgroup_check_G2(Q: PointOverFq, curve: EllipticCurveOverFq = tE): boolean {
    const psi_1 = psi(Q);
    const psi_2 = psi(psi_1);
    const psi_3 = psi(psi_2);

    const a = curve.add(curve.escalarMul(psi_3, constants.x),Q);

    return curve.eq(a, psi_2);
}

function psi(P: PointOverFq, F: ExtensionField = Fp2): PointOverFq {
    // 1] Untwist the point
    const utP = untwist(P);

    // 2] Frobenius1 endomorphism
    const x2 = Frobenius_operator1(utP.x, F);
    const y2 = Frobenius_operator1(utP.y, F);

    // 3] Twist the point back
    return twist({ x: x2, y: y2 });
}

/**
 * It maps points from E'(Fp2)[r] to the trace zero subgroup of E(Fp12).
 */
function untwist(
    P: PointOverFq,
    twisted_curve: EllipticCurveOverFq = tE,
    curve: EllipticCurveOverFqOverFq = E12
): PointOverFqOverFq {
    if (twisted_curve.is_zero(P)) return null;

    const Fq = curve.Fq;

    const x = Fq.mul([P.x], constants.wsq_inv); // This can be optimized since wsq_inv only has one non-zero element
    const y = Fq.mul([P.y], constants.wcu_inv); // This can be optimized since wcu_inv only has one non-zero element

    return { x, y };
}

/**
 * It maps points from the trace zero subgroup of E(Fp12) to E'(Fp2)[r]
 */
function twist(
    P: PointOverFqOverFq,
    twisted_curve: EllipticCurveOverFq = tE,
    curve: EllipticCurveOverFqOverFq = E12
): PointOverFq {
    if (curve.is_zero(P)) return null;

    const Fq = curve.Fq;

    const x = Fq.mul(P.x, constants.wsq); // This can be optimized since wsq_inv only has one non-zero element
    const y = Fq.mul(P.y, constants.wcu); // This can be optimized since wcu_inv only has one non-zero element

    return { x: x[0], y: y[0] };
}

if (require.main === module) {
    // Test the twists
    assert(E12.is_on_curve(untwist(G2)), "The untwist is not working");
    assert(tE.is_on_curve(twist(untwist(G2))) && tE.eq(twist(untwist(G2)), G2), "The twist is not working");

    // Test the sigma function
    assert(E.eq(sigma(G1), E.escalarMul(G1, 228988810152649578064853576960394133503n)), "Sigma is not working");

    // Test the G1 subgroup check
    assert(subgroup_check_G1(G1), "The G1 subgroup check is not working");
    assert(E.is_on_curve({x: 0n, y: 2n}) && !subgroup_check_G1({x: 0n, y: 2n}), "The G1 subgroup check is not working");

    // Test the G2 subgroup check
    assert(subgroup_check_G2(G2), "The G2 subgroup check is not working");
    const rtPoint = {
        x: [2n],
        y: [
            188995492400578496451910581292546059920654572609832469388872107051048741028892423057992033888655218419282460458611n,
            434381874456081807472298918693162486998243066160460423017297172308631992219110538691921044767658182807847155297615n,
        ],
    };
    assert(tE.is_on_curve(rtPoint) && !subgroup_check_G2(rtPoint),"The G2 subgroup check is not working");

    // Test the optimal Ate Pairing over BLS12-381
    const P = G1;
    const Q = G2;
    const Q2 = tE.escalarMul(Q, 2n);

    const P2 = E.escalarMul(P, 2n);
    const P12 = E.escalarMul(P, 12n);
    const Q12 = tE.escalarMul(Q, 12n);

    const e1 = optimal_ate_bls12_381(P2, Q12);
    const e2 = Fp12_o2.exp(optimal_ate_bls12_381(P, Q12), 2n);
    const e3 = Fp12_o2.exp(optimal_ate_bls12_381(P2, Q), 12n);
    const e4 = Fp12_o2.exp(optimal_ate_bls12_381(P, Q), 24n);
    const e5 = optimal_ate_bls12_381(P12, Q2);

    assert(
        Fp12_o2.eq(e1, e2) && Fp12_o2.eq(e1, e3) && Fp12_o2.eq(e1, e4) && Fp12_o2.eq(e1, e5),
        "The pairing is not bilinear"
    );

    console.log("All tests passed");
}