"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.line = void 0;
// Find line y = mx + c passing through two points P and Q of E'(Fp2)
// and evaluate it at a third point T of E'(Fp2)
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
    else {
        throw new Error("Points are on the same vertical line");
    }
}
exports.line = line;
//# sourceMappingURL=common.js.map