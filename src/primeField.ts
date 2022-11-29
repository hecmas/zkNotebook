import { egcd, squareAndMultiply } from "./utils";

class PrimeField {
    readonly p: bigint;

    // Constructor
    constructor(_p: bigint) {
        this.p = _p;
    }

    // Public Accessors
    get zero(): bigint {
        return 0n;
    }

    get one(): bigint {
        return 1n;
    }

    // Basic Arithmetic
    mod(a: bigint): bigint {
        return a >= 0n ? a % this.p : (a % this.p) + this.p;
    }

    add(a: bigint, b: bigint): bigint {
        return this.mod(a + b);
    }

    sub(a: bigint, b: bigint): bigint {
        return this.mod(a - b);
    }

    neg(a: bigint): bigint {
        return this.mod(-a);
    }

    // Q: Should this be improved for large integers????
    mul(a: bigint, b: bigint): bigint {
        return this.mod(a * b);
    }

    inv(a: bigint): bigint {
        a = this.mod(a);
        if (a === 0n) return 0n;
        let [x, ,] = egcd(a, this.p);
        return this.mod(x);
    }

    div(a: bigint, b: bigint): bigint {
        return this.mul(a, this.inv(b));
    }

    exp(base: bigint, exponent: bigint): bigint {
        base = this.mod(base);

        // edge cases
        if (base === 0n) {
            if (exponent === 0n) {
                throw new TypeError("0^0 is undefined");
            }
            return 0n;
        }
        
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }

        return squareAndMultiply(base, exponent, this.p);
    }
}

const Fp = new PrimeField(17n);
console.log(Fp.exp(2n,5n));
