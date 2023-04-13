"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.line = exports.Frobenius = exports.oldFrobenius = exports.Frobenius_constants = exports.log2 = void 0;
function log2(x) {
    if (x == 0n)
        return 0;
    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}
exports.log2 = log2;
// TODO: Hardcode them
// We assume p === 1 (mod 6)
function Frobenius_constants(Fq) {
    const xi = [9n, 1n];
    const e1 = (Fq.Fp.p - 1n) / 6n;
    const e2 = (Fq.Fp.p ** 2n - 1n) / 6n;
    const e3 = (Fq.Fp.p ** 3n - 1n) / 6n;
    // const gamma11: bigint[] = Fq.exp(xi, e1);
    // const gamma12: bigint[] = Fq.exp(xi, 2n*e1);
    // const gamma13: bigint[] = Fq.exp(xi, 3n*e1);
    // const gamma14: bigint[] = Fq.exp(xi, 4n*e1);
    // const gamma15: bigint[] = Fq.exp(xi, 5n*e1);
    // const gamma21: bigint[] = Fq.exp(xi, e2);
    // const gamma22: bigint[] = Fq.exp(xi, 2n*e2);
    // const gamma23: bigint[] = Fq.exp(xi, 3n*e2);
    // const gamma24: bigint[] = Fq.exp(xi, 4n*e2);
    // const gamma25: bigint[] = Fq.exp(xi, 5n*e2);
    // const gamma31: bigint[] = Fq.exp(xi, e3);
    // const gamma32: bigint[] = Fq.exp(xi, 2n*e3);
    // const gamma33: bigint[] = Fq.exp(xi, 3n*e3);
    // const gamma34: bigint[] = Fq.exp(xi, 4n*e3);
    // const gamma35: bigint[] = Fq.exp(xi, 5n*e3);
    let gammas = [];
    for (let i = 1n; i < 6n; i++) {
        gammas.push(Fq.exp(xi, i * e1));
    }
    for (let i = 1n; i < 6n; i++) {
        gammas.push(Fq.exp(xi, i * e2));
    }
    for (let i = 1n; i < 6n; i++) {
        gammas.push(Fq.exp(xi, i * e3));
    }
    return gammas;
}
exports.Frobenius_constants = Frobenius_constants;
function oldFrobenius(P, Fq) {
    return { x: Fq.exp(P.x, Fq.Fp.p), y: Fq.exp(P.y, Fq.Fp.p) };
}
exports.oldFrobenius = oldFrobenius;
function Frobenius(P, Fq) {
    return { x: Fq.exp(P.x, Fq.Fp.p), y: Fq.exp(P.y, Fq.Fp.p) };
}
exports.Frobenius = Frobenius;
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
//# sourceMappingURL=common.js.map