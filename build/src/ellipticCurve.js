"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EllipticCurve = void 0;
const primeField_1 = require("./primeField");
const extensionField_1 = require("./extensionField");
// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are Fp elements
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
class EllipticCurve {
    a;
    b;
    F;
    constructor(a, b, field) {
        const firstSummand = field.mul(4n, field.exp(a, 3n));
        const secondSummand = field.mul(27n, field.exp(b, 2n));
        const sum = field.add(firstSummand, secondSummand);
        if (field.eq(sum, field.zero)) {
            throw new Error("The curve is singular, choose another a and b");
        }
        this.a = a;
        this.b = b;
        this.F = field;
    }
    // Public Accessors
    get zero() {
        return null;
    }
    // Check if a Point is the identity element
    is_zero(P) {
        return P === this.zero;
    }
    // Check that a point is on the curve defined by y² == x³ + a·x + b
    is_on_curve(P) {
        if (this.is_zero(P)) {
            return true;
        }
        const left_side = this.F.exp(P.y, 2n);
        const right_side = this.F.add(this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)), this.b);
        return this.F.eq(left_side, right_side);
    }
    // Basic Arithmetic
    add(P, Q) {
        if (this.is_zero(P))
            return Q;
        if (this.is_zero(Q))
            return P;
        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }
        let m;
        if (P.x === Q.x && P.y === Q.y) {
            m = this.F.div(this.F.add(this.F.mul(3n, this.F.mul(P.x, P.x)), this.a), this.F.mul(2n, P.y));
        }
        else {
            m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
        }
        const x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
        const y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
        return { x, y };
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        if (this.is_zero(P))
            return this.zero;
        return { x: this.F.mod(P.x), y: this.F.neg(P.y) };
    }
    escalarMul(P, k) {
        if (k === 0n)
            return this.zero;
        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }
        let R = P;
        let binary = k.toString(2);
        for (let i = 1; i < binary.length; i++) {
            R = this.add(R, R);
            if (binary[i] === "1") {
                R = this.add(R, P);
            }
        }
        return R;
    }
}
exports.EllipticCurve = EllipticCurve;
const p = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const Fp = new primeField_1.PrimeField(p);
const Fp2 = new extensionField_1.ExtensionField(Fp, [1n, 0n, 1n]);
const Ep = new EllipticCurve(0n, 3n, Fp);
console.log(Ep.is_zero({ x: 3n, y: null }));
//# sourceMappingURL=ellipticCurve.js.map