"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("./primeField");
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
    p;
    Fp;
    constructor(a, b, p) {
        this.a = a;
        this.b = b;
        this.p = p;
        this.Fp = new primeField_1.PrimeField(p);
    }
    // Public Accessors
    get zero() {
        return { x: null, y: null };
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
        let m;
        if (P === Q) {
            m = this.Fp.div(this.Fp.add(this.Fp.mul(3n, this.Fp.mul(P.x, P.x)), this.a), this.Fp.mul(2n, P.y));
        }
        else {
            m = this.Fp.div(this.Fp.sub(Q.y, P.y), this.Fp.sub(Q.x, P.x));
        }
        let x = this.Fp.sub(this.Fp.sub(this.Fp.mul(m, m), P.x), Q.x);
        let y = this.Fp.sub(this.Fp.mul(m, this.Fp.sub(P.x, x)), P.y);
        return { x, y };
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        return { x: P.x, y: this.Fp.neg(P.y) };
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
let E = new EllipticCurve(0n, 7n, 11n);
console.log(E.Fp);
//# sourceMappingURL=elliptic_curves.js.map