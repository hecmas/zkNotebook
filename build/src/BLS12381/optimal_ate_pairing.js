"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const constants = require("./constants");
const parameters_1 = require("./parameters");
/**
 * It checks whether e(P1, Q1) · e(P2, Q2) · ... · e(Pn, Qn) = 1
 */
function verify_pairing_identity(Ps, Qs) {
    (0, chai_1.assert)(Ps.length === Qs.length, "Ps and Qs must have the same length");
    const f = Ps.reduce((acc, P, i) => parameters_1.Fp12_o2.mul(acc, optimal_ate_bls12_381_nfe(P, Qs[i])), [[1n]]);
    return parameters_1.Fp12_o2.eq(final_expontiation(f, parameters_1.Fp12_o2), [[1n]]);
}
/**
 * It computes the optimal Ate pairing over the BLS12-381 curve.
 * Check [here](https://hackmd.io/kcEJAWISQ56eE6YpBnurgw) for more information.
 */
function optimal_ate_bls12_381(P, Q) {
    const f = optimal_ate_bls12_381_nfe(P, Q);
    return final_expontiation(f);
}
/**
 * It checks whether the points P,Q input to the optimal ate pairing over the BLS12-381
 * belong to the appropriate subgropus and, if so, computes the Miller loop.
 */
function optimal_ate_bls12_381_nfe(P, Q) {
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
    // c] Compute the Miller loop
    const f = Miller_loop_Ate_bls12_381(Q, Pm, parameters_1.Fp12_o2, parameters_1.tE);
    return f;
}
/**
 * It computes the Miller loop for the optimal Ate pairing over the BLS12-381 curve.
 * Hence, it performs all the computations of the optimal Ate pairing except for the final exponentiation.
 * Q is assumed to be from the (only) subgroup of E'[r] over Fp2.
 * P is assumed to be from the (only) subgroup of E[r] over Fp.
 */
function Miller_loop_Ate_bls12_381(Q, P, // this point is actually over Fp
Fq, E) {
    let R = Q;
    let f = Fq.one;
    for (let i = constants.ate_loop_count.length - 2; i >= 0; i--) {
        f = Fq.mul(Fq.mul(f, f), line(R, R, P, Fq.Fq, E));
        R = E.add(R, R);
        if (constants.ate_loop_count[i] === 1) {
            f = Fq.mul(f, line(R, Q, P, Fq.Fq, E));
            R = E.add(R, Q);
        }
    }
    // We must conjugate the result since the BLS parameter x is negative
    return conjugateFp12(f);
}
/**
 * Find line y = mx + c passing through two points P and Q of E'(Fp2)
 * and evaluate it at a third point T of E'(Fp2)
*/
function line(P, Q, T, Fq, E) {
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
    }
    else if (P.y === Q.y) {
        // (3x'^3 - 2y'^2)
        const a = Fq.sub(Fq.mul(Fq.exp(P.x, 3n), [3n]), Fq.mul(Fq.exp(P.y, 2n), [2n]));
        // 2y'y
        const b = Fq.mul(Fq.mul(P.y, T.y), [2n]);
        // -3x'^2x
        const c = Fq.mul(Fq.mul(Fq.exp(P.x, 2n), T.x), [-3n]);
        return [[0n], a, [0n], c, b, [0n]];
    }
    else {
        throw new Error("Points are on the same vertical line");
    }
}
function final_expontiation(f, Fq = parameters_1.Fp12_o2) {
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
    const y1 = exp_cyclo(m, constants.x_plus_one_div_three_abs);
    // 2] m^{(x+1)^2/3}
    const y2 = exp_cyclo(y1, constants.x_plus_one_abs);
    // 3.1] m^{(x+1)^2/3*-x}
    const y31 = exp_cyclo(conjugateFp12(y2), x);
    // 3.2] m^{(x+1)^2/3*p}
    const y32 = Frobenius_operator1(y2);
    // 4] m^{(x+1)^2/3*(p-x)}
    const y4 = Fq.mul(y31, y32);
    // 5.1] m^{(x+1)^2/3*(p-x)*x^2}
    const y51 = exp_cyclo(exp_cyclo(y4, x), x);
    // 5.2] m^{(x+1)^2/3*(p-x)*p^2}
    const y52 = Frobenius_operator2(y4);
    // 5.3] m^{(x+1)^2/3*(p-x)*-1}
    const y53 = conjugateFp12(y4);
    // 6] m^{(x+1)^2/3*(p-x)*(x^2+p^2)}
    const y6 = Fq.mul(y51, y52);
    // 7] m^{(x+1)^2/3*(p-x)*(x^2+p^2-1)}
    const y7 = Fq.mul(y6, y53);
    // 8] m^{(x+1)^2/3*(p-x)*(x^2+p^2-1)+1}
    const y8 = Fq.mul(y7, m);
    return y8;
}
function Frobenius_operator1(f, Fq = parameters_1.Fp2) {
    while (f.length < 6) {
        f.push([0n]);
    }
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
function Frobenius_operator2(f, Fq = parameters_1.Fp2) {
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
function conjugateFp2(a) {
    if (a.length === 1)
        return [a[0]];
    return [a[0], parameters_1.Fp.neg(a[1])];
}
function conjugateFp12(a) {
    while (a.length < 6) {
        a.push([0n]);
    }
    return [a[0], parameters_1.Fp2.neg(a[1]), a[2], parameters_1.Fp2.neg(a[3]), a[4], parameters_1.Fp2.neg(a[5])];
}
function comp(b) {
    return [b[1], b[4], b[2], b[5]];
}
function decomp(b) {
    const b2 = b[0];
    const b3 = b[1];
    const b4 = b[2];
    const b5 = b[3];
    if ((b2[0] === 0n) && (b2[1] === 0n)) {
        const b1 = parameters_1.Fp2.div(parameters_1.Fp2.scalarMul(parameters_1.Fp2.mul(b4, b5), 2n), b3);
        const b0 = parameters_1.Fp2.add(parameters_1.Fp2.mul(parameters_1.Fp2.sub(parameters_1.Fp2.scalarMul(parameters_1.Fp2.square(b1), 2n), parameters_1.Fp2.scalarMul(parameters_1.Fp2.mul(b3, b4), 3n)), [1n, 1n]), [1n, 0n]);
        return [b0, b2, b4, b1, b3, b5];
    }
    else {
        const b1 = parameters_1.Fp2.div(parameters_1.Fp2.sub(parameters_1.Fp2.add(parameters_1.Fp2.mul(parameters_1.Fp2.square(b5), [1n, 1n]), parameters_1.Fp2.scalarMul(parameters_1.Fp2.square(b4), 3n)), parameters_1.Fp2.scalarMul(b3, 2n)), parameters_1.Fp2.scalarMul(b2, 4n));
        const b0 = parameters_1.Fp2.add(parameters_1.Fp2.mul(parameters_1.Fp2.sub(parameters_1.Fp2.add(parameters_1.Fp2.scalarMul(parameters_1.Fp2.square(b1), 2n), parameters_1.Fp2.mul(b2, b5)), parameters_1.Fp2.scalarMul(parameters_1.Fp2.mul(b3, b4), 3n)), [1n, 1n]), [1n, 0n]);
        return [b0, b2, b4, b1, b3, b5];
    }
}
function square_comp(g) {
    const g2 = g[0];
    const g3 = g[1];
    const g4 = g[2];
    const g5 = g[3];
    const A23 = parameters_1.Fp2.mul(parameters_1.Fp2.add(g2, g3), parameters_1.Fp2.add(g2, parameters_1.Fp2.mul([1n, 1n], g3)));
    const A45 = parameters_1.Fp2.mul(parameters_1.Fp2.add(g4, g5), parameters_1.Fp2.add(g4, parameters_1.Fp2.mul([1n, 1n], g5)));
    const B23 = parameters_1.Fp2.mul(g2, g3);
    const B45 = parameters_1.Fp2.mul(g4, g5);
    const h2 = parameters_1.Fp2.scalarMul(parameters_1.Fp2.add(g2, parameters_1.Fp2.scalarMul(parameters_1.Fp2.mul([1n, 1n], B45), 3n)), 2n);
    const h3 = parameters_1.Fp2.sub(parameters_1.Fp2.scalarMul(parameters_1.Fp2.sub(A45, parameters_1.Fp2.mul([2n, 1n], B45)), 3n), parameters_1.Fp2.scalarMul(g3, 2n));
    const h4 = parameters_1.Fp2.sub(parameters_1.Fp2.scalarMul(parameters_1.Fp2.sub(A23, parameters_1.Fp2.mul([2n, 1n], B23)), 3n), parameters_1.Fp2.scalarMul(g4, 2n));
    const h5 = parameters_1.Fp2.scalarMul(parameters_1.Fp2.add(g5, parameters_1.Fp2.scalarMul(B23, 3n)), 2n);
    return [h2, h3, h4, h5];
}
function exp_cyclo(a, exp) {
    let e_bin = [];
    while (exp > 0n) {
        e_bin.push(exp % 2n);
        exp = exp / 2n;
    }
    let Ca = comp(a);
    let result = [[1n]];
    for (let i = 0; i < e_bin.length; i++) {
        if (e_bin[i] === 1n) {
            result = parameters_1.Fp12_o2.mul(decomp(Ca), result);
        }
        Ca = square_comp(Ca);
    }
    return result;
}
// Ref: https://eprint.iacr.org/2019/814.pdf
function subgroup_check_G1(P, curve = parameters_1.E) {
    const sig = sigma(P);
    const sig2 = sigma(sig);
    const a = curve.escalarMul(curve.sub(curve.sub(curve.double(sig), P), sig2), constants.x_sq_div_three);
    return curve.eq(a, sig2);
}
function sigma(P, F = parameters_1.Fp) {
    return { x: F.mul(constants.gamma, P.x), y: P.y };
}
// Ref: https://eprint.iacr.org/2019/814.pdf
function subgroup_check_G2(Q, curve = parameters_1.tE) {
    const psi_1 = psi(Q);
    const psi_2 = psi(psi_1);
    const psi_3 = psi(psi_2);
    const a = curve.add(curve.escalarMul(psi_3, constants.x), Q);
    return curve.eq(a, psi_2);
}
function psi(P, F = parameters_1.Fp2) {
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
function untwist(P, twisted_curve = parameters_1.tE, curve = parameters_1.E12) {
    if (twisted_curve.is_zero(P))
        return null;
    const Fq = curve.Fq;
    const x = Fq.mul([P.x], constants.wsq_inv); // This can be optimized since wsq_inv only has one non-zero element
    const y = Fq.mul([P.y], constants.wcu_inv); // This can be optimized since wcu_inv only has one non-zero element
    return { x, y };
}
/**
 * It maps points from the trace zero subgroup of E(Fp12) to E'(Fp2)[r]
 */
function twist(P, twisted_curve = parameters_1.tE, curve = parameters_1.E12) {
    if (curve.is_zero(P))
        return null;
    const Fq = curve.Fq;
    const x = Fq.mul(P.x, constants.wsq); // This can be optimized since wsq_inv only has one non-zero element
    const y = Fq.mul(P.y, constants.wcu); // This can be optimized since wcu_inv only has one non-zero element
    return { x: x[0], y: y[0] };
}
if (require.main === module) {
    // Test the twists
    (0, chai_1.assert)(parameters_1.E12.is_on_curve(untwist(parameters_1.G2)), "The untwist is not working");
    (0, chai_1.assert)(parameters_1.tE.is_on_curve(twist(untwist(parameters_1.G2))) && parameters_1.tE.eq(twist(untwist(parameters_1.G2)), parameters_1.G2), "The twist is not working");
    // Test the sigma function
    (0, chai_1.assert)(parameters_1.E.eq(sigma(parameters_1.G1), parameters_1.E.escalarMul(parameters_1.G1, 228988810152649578064853576960394133503n)), "Sigma is not working");
    // Test the G1 subgroup check
    (0, chai_1.assert)(subgroup_check_G1(parameters_1.G1), "The G1 subgroup check is not working");
    (0, chai_1.assert)(parameters_1.E.is_on_curve({ x: 0n, y: 2n }) && !subgroup_check_G1({ x: 0n, y: 2n }), "The G1 subgroup check is not working");
    // Test the G2 subgroup check
    (0, chai_1.assert)(subgroup_check_G2(parameters_1.G2), "The G2 subgroup check is not working");
    const rtPoint = {
        x: [2n],
        y: [
            188995492400578496451910581292546059920654572609832469388872107051048741028892423057992033888655218419282460458611n,
            434381874456081807472298918693162486998243066160460423017297172308631992219110538691921044767658182807847155297615n,
        ],
    };
    (0, chai_1.assert)(parameters_1.tE.is_on_curve(rtPoint) && !subgroup_check_G2(rtPoint), "The G2 subgroup check is not working");
    // Test the optimal Ate Pairing over BLS12-381
    const P = parameters_1.G1;
    const Q = parameters_1.G2;
    (0, chai_1.assert)(parameters_1.Fp12_o2.eq(optimal_ate_bls12_381(P, Q), constants.test_pairing), "The optimal Ate pairing is not working");
    const Q2 = parameters_1.tE.escalarMul(Q, 2n);
    const P2 = parameters_1.E.escalarMul(P, 2n);
    const P12 = parameters_1.E.escalarMul(P, 12n);
    const Q12 = parameters_1.tE.escalarMul(Q, 12n);
    const e1 = optimal_ate_bls12_381(P2, Q12);
    const e2 = parameters_1.Fp12_o2.exp(optimal_ate_bls12_381(P, Q12), 2n);
    const e3 = parameters_1.Fp12_o2.exp(optimal_ate_bls12_381(P2, Q), 12n);
    const e4 = parameters_1.Fp12_o2.exp(optimal_ate_bls12_381(P, Q), 24n);
    const e5 = optimal_ate_bls12_381(P12, Q2);
    (0, chai_1.assert)(parameters_1.Fp12_o2.eq(e1, e2) && parameters_1.Fp12_o2.eq(e1, e3) && parameters_1.Fp12_o2.eq(e1, e4) && parameters_1.Fp12_o2.eq(e1, e5), "The pairing is not bilinear");
    console.log("All tests passed");
}
//# sourceMappingURL=optimal_ate_pairing.js.map