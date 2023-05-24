import { assert } from "chai";
import {
    PointOverFp,
    PointOverFq,
    PointOverFqOverFq,
    EllipticCurveOverFq,
} from "../ellipticCurve";
import { ExtensionField, ExtensionFieldOverFq } from "../extensionField";
import { line } from "./common";
import * as constants from "./constants";
import { E, tE, Fp2, Fp12 } from "./parameters";

/**
 * It computes the Miller loop for the optimal Ate pairing over the BN254 curve and the last two lines.
 * Hence, it performs all the computations of the optimal Ate pairing except for the final exponentiation.
 * Q is assumed to be from the (only) subgroup of E'[r] over Fp2.
 * P is assumed to be from the (only) subgroup of E[r] over Fp. In fact, E[r]=E for the BN254.
 * Check [here](https://hackmd.io/kcEJAWISQ56eE6YpBnurgw) for more information.
 */
function Miller_loop_Ate_BN254(
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

    const xconjgugate = conjugateFp2(Q.x);
    const yconjugate = conjugateFp2(Q.y);
    const Qp: PointOverFq = {
        x: Fq.Fq.mul(constants.gamma12, xconjgugate),
        y: Fq.Fq.mul(constants.gamma13, yconjugate),
    };

    const xpconjugate = conjugateFp2(Qp.x);
    const ypconjugate = conjugateFp2(Qp.y);
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

function conjugateFp12(a: bigint[][]): bigint[][] {
    return [a[0], Fp2.neg(a[1]), a[2], Fp2.neg(a[3]), a[4], Fp2.neg(a[5])];
}

export function Frobenius_operator1(f: bigint[][], Fq: ExtensionField): bigint[][] {
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

export function Frobenius_operator2(f: bigint[][], Fq: ExtensionField): bigint[][] {
    return [
        f[0],
        Fq.mul(constants.gamma21, f[1]),
        Fq.mul(constants.gamma22, f[2]),
        Fq.mul(constants.gamma23, f[3]),
        Fq.mul(constants.gamma24, f[4]),
        Fq.mul(constants.gamma25, f[5]),
    ];
}

export function Frobenius_operator3(f: bigint[][], Fq: ExtensionField): bigint[][] {
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

function final_expontiation(
    f: bigint[][],
    Fq: ExtensionFieldOverFq
): bigint[][] {
    // a] easy part
    // first, compute f^(p^6-1)=conjugate(f) · f^-1
    let conjugatef = conjugateFp12(f);

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
    const y1 = conjugateFp12(feasy);
    const y2 = mx2p2;
    const y3 = conjugateFp12(mxp);
    const y4 = conjugateFp12(Fq.mul(mx, mxp2));
    const y5 = conjugateFp12(mx2);
    const y6 = conjugateFp12(Fq.mul(mx3, mxp3));

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

/**
 * It computes the optimal Ate pairing over the BN254 curve.
 * Check [here](https://hackmd.io/kcEJAWISQ56eE6YpBnurgw) for more information.
 */
function optimal_ate_bn254_nfe(P: PointOverFp, Q: PointOverFq): bigint[][] {
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

    // c] Compute the pairing
    const f = Miller_loop_Ate_BN254(Q, Pm, Fp12, tE);

    return f;
}

export function optimal_ate_bn254(P: PointOverFp, Q: PointOverFq): bigint[][] {
    const f = optimal_ate_bn254_nfe(P, Q);
    return final_expontiation(f, Fp12);
}

/**
 * It checks whether e(P1, Q1) · e(P2, Q2) · ... · e(Pn, Qn) = 1
 */
export function verify_pairing_identity(Ps: PointOverFp[], Qs: PointOverFq[]) {
    assert(Ps.length === Qs.length, "Ps and Qs must have the same length");

    const f = Ps.reduce(
        (acc, P, i) => Fp12.mul(acc, optimal_ate_bn254_nfe(P, Qs[i])),
        [[1n]]
    );

    return Fp12.eq(final_expontiation(f, Fp12), [[1n]]);
}

function subgroup_check_G1(P: PointOverFp): boolean {
    return E.is_on_curve(P);
}

function subgroup_check_G2(Q: PointOverFq): boolean {
    const R = endomorphism(Q);
    const S = tE.escalarMul(Q, 6n * constants.x ** 2n);
    return Fp2.eq(R.x, S.x) && Fp2.eq(R.y, S.y);
}

// This function sends points from E'(Fp2) to E(Fp12)
export function twist(
    P: PointOverFq,
    E: EllipticCurveOverFq
): PointOverFqOverFq {
    if (E.is_zero(P)) return null;

    const x = [[0n], [0n], P.x, [0n], [0n], [0n]];
    const y = [[0n], [0n], [0n], P.y, [0n], [0n]];

    return { x, y };
}

// This function sends points from E'(Fp2) to E'(Fp2)
function endomorphism(P: PointOverFq): PointOverFq {
    if (tE.is_zero(P)) return null;

    const xconjgugate = conjugateFp2(P.x);
    const yconjugate = conjugateFp2(P.y);
    return {
        x: Fp2.mul(constants.gamma12, xconjgugate),
        y: Fp2.mul(constants.gamma13, yconjugate),
    };
}
