"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimeField = void 0;
const utils_1 = require("./utils");
class PrimeField {
    p;
    // Constructor
    constructor(_p) {
        this.p = _p;
    }
    // Public Accessors
    get zero() {
        return 0n;
    }
    get one() {
        return 1n;
    }
    // Basic Arithmetic
    mod(a) {
        return a >= 0n ? a % this.p : (a % this.p) + this.p;
    }
    add(a, b) {
        return this.mod(a + b);
    }
    sub(a, b) {
        return this.mod(a - b);
    }
    neg(a) {
        return this.mod(-a);
    }
    // Q: Should this be improved for large integers????
    mul(a, b) {
        return this.mod(a * b);
    }
    inv(a) {
        a = this.mod(a);
        if (a === 0n)
            return 0n;
        let [x, ,] = (0, utils_1.egcd)(a, this.p);
        return this.mod(x);
    }
    div(a, b) {
        return this.mul(a, this.inv(b));
    }
    exp(base, exponent) {
        base = this.mod(base);
        // edge cases
        if (base === 0n) {
            if (exponent === 0n) {
                throw TypeError("0^0 is undefined");
            }
            return 0n;
        }
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        return (0, utils_1.squareAndMultiply)(base, exponent, this.p);
    }
}
exports.PrimeField = PrimeField;
const Fp = new PrimeField(17n);
console.log(Fp.exp(0n, 0n));
//# sourceMappingURL=primeField.js.map