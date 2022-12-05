export class PrimeField {
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
        if (a === 0n) throw new Error("Zero has no multiplicative inverse");
        let [x, ,] = egcd(a, this.p);
        return this.mod(x);
    }

    div(a: bigint, b: bigint): bigint {
        if (b === 0n) throw new Error("Division by zero");
        return this.mul(a, this.inv(b));
    }

    exp(base: bigint, exponent: bigint): bigint {
        base = this.mod(base);

        // edge cases
        if (base === 0n) {
            if (exponent === 0n) {
                throw new Error("0^0 is undefined");
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

function egcd(a: bigint, b: bigint): bigint[] {
    // Not needed
    // if (a < b) {
    //     let result = egcd(b, a);
    //     return [result[1], result[0], result[2]];
    // }

    // Not needed
    // if (b === 0n) {
    //     return [1n, 0n, a];
    // }

    let [previous_r, r] = [a, b];
    let [previous_s, s] = [1n, 0n];
    let [previous_t, t] = [0n, 1n];

    while (r) {
        let q = previous_r / r;
        [previous_r, r] = [r, previous_r - q * r];
        [previous_s, s] = [s, previous_s - q * s];
        [previous_t, t] = [t, previous_t - q * t];
    }
    return [previous_s, previous_t, previous_r];
}

function squareAndMultiply(a: bigint, e: bigint, p: bigint): bigint {
    let result = a;
    let binary = e.toString(2);
    for (let i = 1; i < binary.length; i++) {
        result = (result * result) % p;
        if (binary[i] === "1") {
            result = (result * a) % p;
        }
    }
    return result;
}