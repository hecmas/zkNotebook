"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twist = exports.verify_pairing_identity = exports.optimal_ate_bn254 = exports.Frobenius_operator3 = exports.Frobenius_operator2 = exports.Frobenius_operator1 = void 0;
const chai_1 = require("chai");
const common_1 = require("./common");
const constants = require("./constants");
const parameters_1 = require("./parameters");
/**
 * It computes the Miller loop for the optimal Ate pairing over the BN254 curve and the last two lines.
 * Hence, it performs all the computations of the optimal Ate pairing except for the final exponentiation.
 * Q is assumed to be from the (only) subgroup of E'[r] over Fp2.
 * P is assumed to be from the (only) subgroup of E[r] over Fp. In fact, E[r]=E for the BN254.
 * Check [here](https://hackmd.io/kcEJAWISQ56eE6YpBnurgw) for more information.
 */
function Miller_loop_Ate_BN254(Q, P, // this point is actually over Fp
Fq, E) {
    let R = Q;
    let f = Fq.one;
    for (let i = constants.ate_loop_count.length - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), (0, common_1.line)(R, R, P, Fq.Fq, E));
        R = E.add(R, R);
        if (constants.ate_loop_count[i] === 1) {
            f = Fq.mul(f, (0, common_1.line)(R, Q, P, Fq.Fq, E));
            R = E.add(R, Q);
        }
        else if (constants.ate_loop_count[i] === -1) {
            const nQ = E.neg(Q);
            f = Fq.mul(f, (0, common_1.line)(R, nQ, P, Fq.Fq, E));
            R = E.add(R, nQ);
        }
    }
    const xconjgugate = conjugateFp2(Q.x);
    const yconjugate = conjugateFp2(Q.y);
    const Qp = {
        x: Fq.Fq.mul(constants.gamma12, xconjgugate),
        y: Fq.Fq.mul(constants.gamma13, yconjugate),
    };
    const xpconjugate = conjugateFp2(Qp.x);
    const ypconjugate = conjugateFp2(Qp.y);
    const S = {
        x: Fq.Fq.mul(constants.gamma12, xpconjugate),
        y: Fq.Fq.mul(constants.gamma13, ypconjugate),
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
function conjugateFp12(a) {
    return [a[0], parameters_1.Fp2.neg(a[1]), a[2], parameters_1.Fp2.neg(a[3]), a[4], parameters_1.Fp2.neg(a[5])];
}
function Frobenius_operator1(f, Fq) {
    const conjugates = [];
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
exports.Frobenius_operator1 = Frobenius_operator1;
function Frobenius_operator2(f, Fq) {
    return [
        f[0],
        Fq.mul(constants.gamma21, f[1]),
        Fq.mul(constants.gamma22, f[2]),
        Fq.mul(constants.gamma23, f[3]),
        Fq.mul(constants.gamma24, f[4]),
        Fq.mul(constants.gamma25, f[5]),
    ];
}
exports.Frobenius_operator2 = Frobenius_operator2;
function Frobenius_operator3(f, Fq) {
    const conjugates = [];
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
exports.Frobenius_operator3 = Frobenius_operator3;
function final_expontiation(f, Fq) {
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
function optimal_ate_bn254_nfe(P, Q) {
    if (parameters_1.E.is_zero(P) && parameters_1.tE.is_zero(Q) === false) {
        // Check that Q belongs to E'(Fp2)[r]
        (0, chai_1.assert)(subgroup_check_G2(Q), "Q does not belong to E'(Fp2)[r]");
        return [[1n]];
    }
    else if (parameters_1.E.is_zero(P) === false && parameters_1.tE.is_zero(Q)) {
        // Check that P belongs to E(Fp)[r]
        (0, chai_1.assert)(subgroup_check_G1(P), "P does not belong to E(Fp)[r]");
        return [[1n]];
    }
    else if (parameters_1.E.is_zero(P) && parameters_1.tE.is_zero(Q)) {
        return [[1n]];
    }
    // a] Check that P belongs to E(Fp)[r] = E(Fp)
    (0, chai_1.assert)(subgroup_check_G1(P), "P does not belong to E(Fp)[r]");
    // b] Check that Q belongs to E'(Fp2)[r]
    (0, chai_1.assert)(subgroup_check_G2(Q), "Q does not belong to E'(Fp2)[r]");
    const Pm = { x: [P.x], y: [P.y] };
    // c] Compute the pairing
    const f = Miller_loop_Ate_BN254(Q, Pm, parameters_1.Fp12, parameters_1.tE);
    return f;
}
function optimal_ate_bn254(P, Q) {
    const f = optimal_ate_bn254_nfe(P, Q);
    return final_expontiation(f, parameters_1.Fp12);
}
exports.optimal_ate_bn254 = optimal_ate_bn254;
/**
 * It checks whether e(P1, Q1) · e(P2, Q2) · ... · e(Pn, Qn) = 1
 */
function verify_pairing_identity(Ps, Qs) {
    (0, chai_1.assert)(Ps.length === Qs.length, "Ps and Qs must have the same length");
    const f = Ps.reduce((acc, P, i) => parameters_1.Fp12.mul(acc, optimal_ate_bn254_nfe(P, Qs[i])), [[1n]]);
    return parameters_1.Fp12.eq(final_expontiation(f, parameters_1.Fp12), [[1n]]);
}
exports.verify_pairing_identity = verify_pairing_identity;
function subgroup_check_G1(P) {
    return parameters_1.E.is_on_curve(P);
}
function subgroup_check_G2(Q) {
    const R = endomorphism(Q);
    const S = parameters_1.tE.escalarMul(Q, 6n * constants.x ** 2n);
    return parameters_1.Fp2.eq(R.x, S.x) && parameters_1.Fp2.eq(R.y, S.y);
}
// This function sends points from E'(Fp2) to E(Fp12)
function twist(P, E) {
    if (E.is_zero(P))
        return null;
    const x = [[0n], [0n], P.x, [0n], [0n], [0n]];
    const y = [[0n], [0n], [0n], P.y, [0n], [0n]];
    return { x, y };
}
exports.twist = twist;
// This function sends points from E'(Fp2) to E'(Fp2)
function endomorphism(P) {
    if (parameters_1.tE.is_zero(P))
        return null;
    const xconjgugate = conjugateFp2(P.x);
    const yconjugate = conjugateFp2(P.y);
    return {
        x: parameters_1.Fp2.mul(constants.gamma12, xconjgugate),
        y: parameters_1.Fp2.mul(constants.gamma13, yconjugate),
    };
}
//# sourceMappingURL=optimal_ate_pairing.js.map