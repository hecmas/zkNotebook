"use strict";
// https://github.com/ethereum/py_pairing
// https://ethereum.github.io/execution-specs/autoapi/ethereum/crypto/alt_bn128/index.html
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionField = void 0;
const primeField_1 = require("./primeField");
class ExtensionField {
    Fp;
    modulus_coeffs;
    degree;
    // Constructor
    constructor(_Fp, _modulus_coeffs) {
        // The prime field over which the extension is defined
        this.Fp = _Fp;
        // The coefficients of the modulus
        this.modulus_coeffs = _modulus_coeffs;
        // The degree of the extension
        this.degree = _modulus_coeffs.length - 1;
    }
    // Public Accessors
    get zero() {
        return [0n];
    }
    get one() {
        return [1n];
    }
    // Comparators
    eq(a, b) {
        const dega = degree(a);
        const degb = degree(b);
        if (dega === degb) {
            for (let i = 0; i < dega + 1; i++) {
                if (a[i] !== b[i])
                    return false;
            }
            return true;
        }
        return false;
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        let dega = degree(a);
        if (dega < this.degree) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.mod(a[i]);
            }
            return c;
        }
        let [, r] = euclidean_division(a, this.modulus_coeffs, this.Fp);
        return r;
    }
    add(a, b) {
        let dega = degree(a);
        let degb = degree(b);
        let maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : 0n;
            let bi = i < degb + 1 ? b[i] : 0n;
            c[i] = this.Fp.mod(ai + bi);
        }
        return this.mod(c);
    }
    sub(a, b) {
        const c = this.add(a, this.neg(b));
        return c;
    }
    neg(a) {
        const c = new Array(degree(a) + 1);
        for (let i = 0; i < degree(a) + 1; i++) {
            c[i] = this.Fp.neg(a[i]);
        }
        return this.mod(c);
    }
    mul(a, b) {
        if (degree(a) === 0) {
            if (degree(b) === 0) {
                return [this.Fp.mul(a[0], b[0])];
            }
            else {
                const c = new Array(degree(b) + 1);
                for (let i = 0; i < degree(b) + 1; i++) {
                    c[i] = this.Fp.mul(a[0], b[i]);
                }
                return this.mod(c);
            }
        }
        else if (degree(b) === 0) {
            const c = new Array(degree(a) + 1);
            for (let i = 0; i < degree(a) + 1; i++) {
                c[i] = this.Fp.mul(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            const c = new Array(degree(a) + degree(b) + 1).fill(0n);
            for (let i = 0; i < degree(a) + 1; i++) {
                for (let j = 0; j < degree(b) + 1; j++) {
                    c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }
    inv(a) {
        if (this.eq(a, this.zero))
            throw new TypeError("Zero has no multiplicative inverse");
        const [, y,] = egcd(this.modulus_coeffs, a, this);
        return y;
    }
    div(a, b) {
        if (degree(b) === 0) {
            if (b[0] === 0n)
                throw new Error('Division by zero');
            const c = new Array(this.degree);
            for (let i = 0; i < this.degree; i++) {
                c[i] = this.Fp.div(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            return this.mul(a, this.inv(b));
        }
    }
    exp(base, exponent) {
        base = this.mod(base);
        // edge cases
        if (this.eq(base, this.zero)) {
            if (exponent === 0n) {
                throw new TypeError("0^0 is undefined");
            }
            return this.zero;
        }
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        return squareAndMultiply(base, exponent, this);
    }
}
exports.ExtensionField = ExtensionField;
// export class ExtensionField2 extends ExtensionField {
//     constructor(modulus_coeffs: bigint[]) {
//         this.Fp
//     }
// }
function degree(a) {
    let d = a.length - 1;
    while (d && a[d] === 0n) {
        d--;
    }
    return d;
}
function euclidean_division(a, b, F) {
    let dega = degree(a);
    let degb = degree(b);
    let q = new Array(a.length).fill(0n);
    let r = a.slice();
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = F.div(r[i + degb], b[degb]);
        for (let j = 0; j < degb + 1; j++) {
            r[i + j] = F.sub(r[i + j], F.mul(q[i], b[j]));
        }
    }
    return [q, r];
}
function egcd(a, b, Fq) {
    let [old_r, r] = [a, b];
    let [old_s, s] = [Fq.one, Fq.zero];
    let [old_t, t] = [Fq.zero, Fq.one];
    while (Fq.neq(r, Fq.zero)) {
        const [q,] = euclidean_division(old_r, r, Fp);
        let old_rr = old_r.slice();
        let old_ss = old_s.slice();
        let old_tt = old_t.slice();
        old_rr = Fq.sub(old_rr, Fq.mul(q, r));
        old_ss = Fq.sub(old_ss, Fq.mul(q, s));
        old_tt = Fq.sub(old_tt, Fq.mul(q, t));
        [old_r, r] = [r, old_rr];
        [old_s, s] = [s, old_ss];
        [old_t, t] = [t, old_tt];
    }
    for (let i = 0; i < degree(old_s) + 1; i++) {
        old_s[i] = Fq.Fp.div(old_s[i], old_r[0]);
    }
    for (let i = 0; i < degree(old_t) + 1; i++) {
        old_t[i] = Fq.Fp.div(old_t[i], old_r[0]);
    }
    for (let i = 0; i < degree(old_r) + 1; i++) {
        old_r[i] = Fq.Fp.div(old_r[i], old_r[0]);
    }
    return [old_s, old_t, old_r];
}
function squareAndMultiply(base, exponent, Fq) {
    let result = base.slice();
    let binary = exponent.toString(2);
    for (let i = 1; i < binary.length; i++) {
        result = Fq.mul(result, result);
        if (binary[i] === "1") {
            result = Fq.mul(result, base);
        }
    }
    return result;
}
// let Fp = new PrimeField(21888242871839275222246405745257275088696311157297823662689037894645226208583n);
// let Fp2 = new ExtensionField(Fp, [82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]);
// console.log(Fp2.mod([82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]));
let Fp = new primeField_1.PrimeField(17n);
let Fp2 = new ExtensionField(Fp, [1n, 2n, 3n]);
let result = Fp2.inv([-8n, 12n]);
console.log(result);
//# sourceMappingURL=extensionField.js.map