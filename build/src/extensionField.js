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
        return new Array(this.degree).fill(0n);
    }
    get one() {
        const a = new Array(this.degree).fill(0n);
        a[0] = 1n;
        return a;
    }
    // Comparators
    eq(a, b) {
        console.log(degree(a), degree(b));
        if (degree(a) === degree(b)) {
            if (a.length > b.length && b.every((v, i) => v === a[i])) {
                return true;
            }
            else if (b.length > a.length && a.every((v, i) => v === b[i])) {
                return true;
            }
        }
        return false;
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        let adeg = degree(a);
        if (adeg < this.degree) {
            return a;
        }
        a = a.slice(0, adeg + 1);
        // Polynomial long division, assuming the modulus is monic
        // and its trailing coefficient is non-zero
        while (a.length > this.degree) {
            const start = a.length - this.degree - 1;
            const d = a.pop();
            for (let i = 0; i < this.degree; i++) {
                a[start + i] = this.Fp.sub(a[start + i], this.Fp.mul(d, this.modulus_coeffs[i]));
            }
        }
        return a;
    }
    add(a, b) {
        const c = new Array(this.degree);
        for (let i = 0; i < this.degree; i++) {
            c[i] = this.Fp.mod(a[i] + b[i]);
        }
        return c;
    }
    sub(a, b) {
        const c = new Array(this.degree);
        for (let i = 0; i < this.degree; i++) {
            c[i] = this.Fp.mod(a[i] - b[i]);
        }
        return c;
    }
    neg(a) {
        return this.sub(this.zero, a);
    }
    mul(a, b) {
        if (b.length === 1) {
            const c = new Array(this.degree);
            for (let i = 0; i < this.degree; i++) {
                c[i] = this.Fp.mul(a[i], b[0]);
            }
            return c;
        }
        else {
            const c = new Array(this.degree * 2 - 1).fill(0n);
            for (let i = 0; i < this.degree; i++) {
                for (let j = 0; j < this.degree; j++) {
                    c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }
    inv(a) {
        if (this.eq(a, this.zero))
            return this.zero;
        let [old_r, r] = [this.modulus_coeffs, a];
        let [old_s, s] = [this.one, this.zero];
        let [old_t, t] = [this.zero, this.one];
        while (this.neq(r, this.zero)) {
            const q = this.div(old_r, r);
            [old_r, r] = [r, this.sub(old_r, this.mul(q, r))];
            [old_s, s] = [s, this.sub(old_s, this.mul(q, s))];
            [old_t, t] = [t, this.sub(old_t, this.mul(q, t))];
        }
        return old_r;
    }
    div(a, b) {
        if (degree(b) === 0) {
            const c = new Array(this.degree);
            for (let i = 0; i < this.degree; i++) {
                c[i] = this.Fp.div(a[i], b[0]);
            }
            return c;
        }
        else {
            return this.mul(a, this.inv(b));
        }
    }
}
exports.ExtensionField = ExtensionField;
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
    let r = a;
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = F.div(r[i + degb], b[degb]);
        for (let j = 0; j <= degb; j++) {
            r[i + j] = F.sub(r[i + j], F.mul(q[i], b[j]));
        }
    }
    return [q, r];
}
let Fp = new primeField_1.PrimeField(21888242871839275222246405745257275088696311157297823662689037894645226208583n);
let Fp2 = new ExtensionField(Fp, [82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]);
console.log(Fp2.inv([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]));
//# sourceMappingURL=extensionField.js.map