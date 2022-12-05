"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EllipticCurve = void 0;
const primeField_1 = require("./primeField");
const extensionField_1 = require("./extensionField");
// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are integers
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
class EllipticCurve {
    a;
    b;
    // readonly p: bigint;
    F;
    constructor(a, b, field) {
        this.a = a;
        this.b = b;
        this.F = field;
        // this.p = field.p;
    }
    // Public Accessors
    get zero() {
        return { x: null, y: null };
    }
    // Check if a point is the identity element
    is_zero(P) {
        return P.x === null && P.y === null;
    }
    // Check that a point is on the curve defined by y² == x³ + a·x + b
    is_on_curve(P) {
        if (this.is_zero(P)) {
            return true;
        }
        if (typeof P.x === "bigint" &&
            typeof P.y === "bigint" &&
            typeof this.a === "bigint" &&
            typeof this.b === "bigint" &&
            this.F instanceof primeField_1.PrimeField) {
            const left_side = this.F.exp(P.y, 2n);
            const right_side = this.F.add(this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)), this.b);
            return left_side === right_side;
        }
        else if (typeof P.x === "object" &&
            typeof P.y === "object" &&
            typeof this.a === "object" &&
            typeof this.b === "object" &&
            this.F instanceof extensionField_1.ExtensionField) {
            const left_side = this.F.exp(P.y, 2n);
            const right_side = this.F.add(this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)), this.b);
            return this.F.eq(left_side, right_side);
        }
    }
    // Basic Arithmetic
    add(P, Q) {
        if (P === this.zero)
            return Q;
        if (Q === this.zero)
            return P;
        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }
        if (typeof P.x === "bigint" &&
            typeof P.y === "bigint" &&
            typeof Q.x === "bigint" &&
            typeof Q.y === "bigint" &&
            typeof this.a === "bigint" &&
            typeof this.b === "bigint" &&
            this.F instanceof primeField_1.PrimeField) {
            let m;
            if (P.x === Q.x && P.y === Q.y) {
                m = this.F.div(this.F.add(this.F.mul(3n, this.F.mul(P.x, P.x)), this.a), this.F.mul(2n, P.y));
            }
            else {
                m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
            }
            let x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
            let y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
            return { x, y };
        }
        else if (typeof P.x === "object" &&
            typeof P.y === "object" &&
            typeof Q.x === "object" &&
            typeof Q.y === "object" &&
            typeof this.a === "object" &&
            typeof this.b === "object" &&
            this.F instanceof extensionField_1.ExtensionField) {
            let m;
            if (P.x === Q.x && P.y === Q.y) {
                m = this.F.div(this.F.add(this.F.mul([3n], this.F.mul(P.x, P.x)), this.a), this.F.mul([2n], P.y));
            }
            else {
                m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
            }
            let x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
            let y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
            return { x, y };
        }
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        if (this.is_zero(P))
            return this.zero;
        if (typeof P.y === "bigint" && this.F instanceof primeField_1.PrimeField) {
            return { x: P.x, y: this.F.neg(P.y) };
        }
        else if (typeof P.y === "object" &&
            this.F instanceof extensionField_1.ExtensionField) {
            return { x: P.x, y: this.F.neg(P.y) };
        }
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
    twist(P, w) {
        if (this.is_zero(P))
            return this.zero;
        if (typeof P.x === "object" &&
            typeof P.y === "object" &&
            this.F instanceof extensionField_1.ExtensionField) {
            // Field isomorphism from Z[p] / x**2 to Z[p] / x**2 - 18*x + 82
            let xcoeffs = [
                this.F.Fp.sub(P.x[0], this.F.Fp.mul(9n, P.x[1])),
                P.x[1],
            ];
            let ycoeffs = [
                this.F.Fp.sub(P.y[0], this.F.Fp.mul(9n, P.y[1])),
                P.y[1],
            ];
            // Isomorphism into subfield of Z[p] / w**12 - 18 * w**6 + 82,
            // where w**6 = x
            let nx = new Array(12).fill(0n);
            nx[0] = xcoeffs[0];
            nx[7] = xcoeffs[1];
            let ny = new Array(12).fill(0n);
            ny[0] = ycoeffs[0];
            ny[7] = ycoeffs[1];
            // Divide x coord by w**2 and y coord by w**3
            let x = this.F.mul(nx, this.F.exp(w, 2n));
            let y = this.F.mul(ny, this.F.exp(w, 3n));
            return { x, y };
        }
    }
}
exports.EllipticCurve = EllipticCurve;
//# sourceMappingURL=elliptic_curves.js.map