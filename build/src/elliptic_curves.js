"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("./primeField");
// TODO: Change prime field for prime extension field
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
    F;
    constructor(a, b, field) {
        this.a = a;
        this.b = b;
        this.F = field;
        this.p = field.p;
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
            m = this.F.div(this.F.add(this.F.mul(3n, this.F.mul(P.x, P.x)), this.a), this.F.mul(2n, P.y));
        }
        else {
            m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
        }
        let x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
        let y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
        return { x, y };
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        return { x: P.x, y: this.F.neg(P.y) };
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
let goldilocks = BigInt(2 ** 64 - 2 ** 32 + 1);
let Fp = new primeField_1.PrimeField(goldilocks);
let E = new EllipticCurve(0n, 7n, Fp);
console.log(E.p);
//# sourceMappingURL=elliptic_curves.js.map