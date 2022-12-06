export class FieldElement {
    readonly value: bigint;
    readonly field: PrimeField;

    // Constructor
    constructor(_value: bigint, _field: PrimeField) {
        this.value = _value;
        this.field = _field;
    }

    // Basic Arithmetic
    add(other: FieldElement): FieldElement {
        return this.field.add(this, other);
    }

    sub(other: FieldElement): FieldElement {
        return this.field.sub(this, other);
    }

    neg(): FieldElement {
        return this.field.neg(this);
    }

    mul(other: FieldElement): FieldElement {
        return this.field.mul(this, other);
    }

    inv(): FieldElement {
        return this.field.inv(this);
    }

    div(other: FieldElement): FieldElement {
        return this.field.div(this, other);
    }

    exp(n: bigint): FieldElement {
        return this.field.exp(this, n);
    }
}

export class PrimeField {
    readonly p: bigint;

    // Constructor
    constructor(_p: bigint) {
        this.p = _p;
    }

    // Public Accessors
    // get zero(): bigint {
    //     return 0n;
    // }
    get zero(): FieldElement {
        return new FieldElement(0n, this);
    }

    // get one(): bigint {
    //     return 1n;
    // }
    get one(): FieldElement {
        return new FieldElement(1n, this);
    }

    // Basic Arithmetic
    mod(a: bigint): bigint {
        return a >= 0n ? a % this.p : (a % this.p) + this.p;
    }


    add(a: FieldElement, b: FieldElement): FieldElement {
        return new FieldElement(this.mod(a.value + b.value), this);
    }

    // sub(a: bigint, b: bigint): bigint {
    //     return this.mod(a - b);
    // }
    sub(a: FieldElement, b: FieldElement): FieldElement {
        return new FieldElement(this.mod(a.value - b.value), this);
    }

    // neg(a: bigint): bigint {
    //     return this.mod(-a);
    // }
    neg(a: FieldElement): FieldElement {
        return new FieldElement(this.mod(-a.value), this);
    }

    // Q: Should this be improved for large integers????
    // mul(a: bigint, b: bigint): bigint {
    //     return this.mod(a * b);
    // }
    mul(a: FieldElement, b: FieldElement): FieldElement {
        return new FieldElement(this.mod(a.value * b.value), this);
    }

    // inv(a: bigint): bigint {
    //     if (a === 0n) throw new Error("Zero has no multiplicative inverse");
    //     let [x, ,] = egcd(a, this.p);
    //     return this.mod(x);
    // }
    inv(a: FieldElement): FieldElement {
        if (a.value === 0n) throw new Error("Zero has no multiplicative inverse");
        let [x, ,] = egcd(a.value, this.p);
        return new FieldElement(this.mod(x), this);
    }

    // div(a: bigint, b: bigint): bigint {
    //     if (b === 0n) throw new Error("Division by zero");
    //     return this.mul(a, this.inv(b));
    // }
    div(a: FieldElement, b: FieldElement): FieldElement {
        if (b.value === 0n) throw new Error("Division by zero");
        return this.mul(a, this.inv(b));
    }

    // exp(base: bigint, exponent: bigint): bigint {
    //     base = this.mod(base);

    //     // edge cases
    //     if (base === 0n) {
    //         if (exponent === 0n) {
    //             throw new Error("0^0 is undefined");
    //         }
    //         return 0n;
    //     }

    //     // negative exponent
    //     if (exponent < 0n) {
    //         base = this.inv(base);
    //         exponent = -exponent;
    //     }

    //     return squareAndMultiply(base, exponent, this.p);
    // }
    exp(base: FieldElement, exponent: bigint): FieldElement {
        base = new FieldElement(this.mod(base.value), this);

        // edge cases
        if (base.value === 0n) {
            if (exponent === 0n) {
                throw new Error("0^0 is undefined");
            }
            return new FieldElement(0n, this);
        }

        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }

        return new FieldElement(squareAndMultiply(base.value, exponent, this.p), this);
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

const F = new PrimeField(17n);
const F2 = new PrimeField(19n);
const a = new FieldElement(15n, F);
const b = new FieldElement(8n, F2);

console.log(F.add(a, b));