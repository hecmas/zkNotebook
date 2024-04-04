"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.split_scalar_endo = exports.line = void 0;
// Find line y = mx + c passing through two points P and Q of E'(Fp2)
// and evaluate it at a point T of E(Fp)
function line(P, Q, T, Fq, E) {
    if (E.is_zero(P) || E.is_zero(Q) || E.is_zero(T)) {
        throw new Error("Cannot evaluate line at zero");
    }
    // First case: P and Q are distinct and not on the same vertical line
    if (P.x !== Q.x) {
        // (x2'-x1')·y
        const a = Fq.mul(Fq.sub(Q.x, P.x), T.y);
        // (y1'-y2')·x
        const b = Fq.mul(Fq.sub(P.y, Q.y), T.x);
        // (x1'y2'-x2'y1')
        const c = Fq.sub(Fq.mul(P.x, Q.y), Fq.mul(Q.x, P.y));
        return [[0n], [0n], a, b, [0n], c];
        // Second case: P and Q are the same point
    }
    else if (P.y === Q.y) {
        // (3x'^3 - 2y'^2)(9+u)
        const a = Fq.mul(Fq.sub(Fq.mul(Fq.exp(P.x, 3n), [3n]), Fq.mul(Fq.exp(P.y, 2n), [2n])), [9n, 1n]);
        // 2y'y
        const b = Fq.mul(Fq.mul(P.y, T.y), [2n]);
        // -3x'^2x
        const c = Fq.mul(Fq.mul(Fq.exp(P.x, 2n), T.x), [-3n]);
        return [a, [0n], [0n], b, c, [0n]];
    }
}
exports.line = line;
// TODO: Add flags for k1 and k2 being negative???
// Check https://hackmd.io/LG4IYz_qRYiiBFLN9NjbCw?view
function split_scalar_endo(k, n) {
    const v11 = 0x89d3256894d213e3n;
    const v12 = -0x6f4d8248eeb859fc8211bbeb7d4f1128n;
    const v21 = 0x6f4d8248eeb859fd0be4e1541221250bn;
    const v22 = 0x89d3256894d213e3n;
    const c1 = (v22 * k) / n;
    const c2 = (-v12 * k) / n;
    const k1 = mod(k - c1 * v11 - c2 * v21, n);
    const k2 = mod(-c1 * v12 - c2 * v22, n);
    return [k1, k2];
    // Alternative implementation
    // let k2 = -c1 * v12 - c2 * v22;
    // const r2 = mod(k2, n);
    // const k1 = mod(k - r2 * lambda, n);
    // if (mod(k1 + k2 * lambda,n) !== k) throw new Error("Splitting failed");
    // return [k1, r2];
    function mod(a, b) {
        const result = a % b;
        return result >= 0n ? result : result + b;
    }
}
exports.split_scalar_endo = split_scalar_endo;
// Field isomporphism between Fp2[w]/<w⁶ - (9+u)> and Fp6[w]/<w² - v>
function iso(b) {
    return [
        [b[0], b[2], b[4]],
        [b[1], b[3], b[5]],
    ];
}
// Field isomporphism between Fp2[w]/<w⁶ - (9+u)> and Fp4[w³]/<(w³)² - (9+u)>
function iso2(b) {
    return [
        [b[0], b[3]],
        [b[1], b[4]],
        [b[2], b[5]],
    ];
}
// Field isomporphism between Fp6[w]/<w² - v> and Fp2[w]/<w⁶ - (9+u)>
function inv_iso(a) {
    return [a[0][0], a[1][0], a[0][1], a[1][1], a[0][2], a[1][2]];
}
// Field isomporphism between Fp4[w³]/<(w³)² - (9+u)> and Fp2[w]/<w⁶ - (9+u)>
function inv_iso2(a) {
    return [a[0][0], a[1][0], a[2][0], a[0][1], a[1][1], a[2][1]];
}
//# sourceMappingURL=common.js.map