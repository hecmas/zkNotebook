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
    // Basic Arithmetic
    mod(a) {
        while (a.length > this.degree) {
            // Polynomial long division, assuming the modulus is monic 
            // and its trailing coefficient is non-zero
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
            while (c.length > this.degree) {
                const d = c.pop();
                for (let i = 0; i < this.degree; i++) {
                    c[i] = this.Fp.sub(c[i], this.Fp.mul(d, this.modulus_coeffs[i]));
                }
            }
            return c;
        }
    }
}
exports.ExtensionField = ExtensionField;
let Fp = new primeField_1.PrimeField(7n);
let Fp2 = new ExtensionField(Fp, [2n, 3n, 1n]);
console.log(Fp2.mod([3n, 2n, 2n, 3n, 5n]));
//# sourceMappingURL=extensionField.js.map