// https://github.com/ethereum/py_pairing
// https://ethereum.github.io/execution-specs/autoapi/ethereum/crypto/alt_bn128/index.html

import { PrimeField } from "./primeField";

export class ExtensionField {
    readonly Fp: PrimeField;
    readonly modulus_coeffs: bigint[];
    readonly degree: number;

    // Constructor
    constructor(_Fp: PrimeField, _modulus_coeffs: bigint[]) {
        // The prime field over which the extension is defined
        this.Fp = _Fp;
        // The coefficients of the modulus
        this.modulus_coeffs = _modulus_coeffs;
        // The degree of the extension
        this.degree = _modulus_coeffs.length - 1;
    }

    // Public Accessors
    get zero(): bigint[] {
        return new Array<bigint>(this.degree).fill(0n);
    }

    get one(): bigint[] {
        const a = new Array<bigint>(this.degree).fill(0n);
        a[0] = 1n;
        return a;
    }

    // Comparators
    eq(a: bigint[], b: bigint[]): boolean {
        if (a.length === b.length && a.every((v, i) => v === b[i])) {
            return true;
        }
        return false;
    }

    neq(a: bigint[], b: bigint[]): boolean {
        return !this.eq(a, b);
    }

    // Basic Arithmetic
    mod(a: bigint[]): bigint[] {
        let adeg = degree(a);
        a = a.slice(0, adeg + 1);

        // Polynomial long division, assuming the modulus is monic
        // and its trailing coefficient is non-zero
        while (a.length > this.degree) {
            const start = a.length - this.degree - 1;
            const d = a.pop();
            for (let i = 0; i < this.degree; i++) {
                a[start + i] = this.Fp.sub(
                    a[start + i],
                    this.Fp.mul(d, this.modulus_coeffs[i])
                );
            }
        }
        return a;
    }

    add(a: bigint[], b: bigint[]): bigint[] {
        const c = new Array<bigint>(this.degree);
        for (let i = 0; i < this.degree; i++) {
            c[i] = this.Fp.mod(a[i] + b[i]);
        }

        return c;
    }

    sub(a: bigint[], b: bigint[]): bigint[] {
        const c = new Array<bigint>(this.degree);
        for (let i = 0; i < this.degree; i++) {
            c[i] = this.Fp.mod(a[i] - b[i]);
        }

        return c;
    }

    neg(a: bigint[]): bigint[] {
        return this.sub(this.zero, a);
    }

    mul(a: bigint[], b: bigint[]): bigint[] {
        if (b.length === 1) {
            const c = new Array<bigint>(this.degree);
            for (let i = 0; i < this.degree; i++) {
                c[i] = this.Fp.mul(a[i], b[0]);
            }
            return c;
        } else {
            const c = new Array<bigint>(this.degree * 2 - 1);
            for (let i = 0; i < this.degree; i++) {
                for (let j = 0; j < this.degree; j++) {
                    c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }

    inv(a: bigint[]): bigint[] {
        a = this.mod(a);
        if (this.eq(a,this.zero)) return this.zero;
        let [previous_r, r] = [a, this.modulus_coeffs];
        let [previous_s, s] = [this.one, this.zero];
        let [previous_t, t] = [this.zero, this.one];
    
        while (r !== this.zero) {
            let [q,] = euclidean_division(previous_r, r, this.Fp);
            [previous_r, r] = [r, this.sub(previous_r, this.mul(q, r))];
            [previous_s, s] = [s, this.sub(previous_s, this.mul(q, s))];
            [previous_t, t] = [t, this.sub(previous_t, this.mul(q, t))];
        }
        //let [x,y,d] = [previous_s, previous_t, previous_r];

        return this.mod(previous_s);
    }

    div(a: bigint[], b: bigint[]): bigint[] {
        if (b.length === 1) {
            const c = new Array<bigint>(this.degree);
            for (let i = 0; i < this.degree; i++) {
                c[i] = this.Fp.div(a[i], b[0]);
            }
            return c;
        } else {
            return this.mul(a, this.inv(b));
        }
    }

    // exp(base: bigint, exponent: bigint): bigint {
    //     base = this.mod(base);

    //     // edge cases
    //     if (base === 0n) {
    //         if (exponent === 0n) {
    //             throw new TypeError("0^0 is undefined");
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
}

function degree(a: bigint[]): number {
    let d = a.length - 1;
    while (d && a[d] === 0n) {
        d--;
    }
    return d;
}

function euclidean_division(a: bigint[], b: bigint[], F: PrimeField): bigint[][] {
    let dega = degree(a);
    let degb = degree(b);
    let q = new Array<bigint>(a.length).fill(0n);
    let r = a;
    while (degree(r) >= degb) {
        let d = degree(r) - degb;
        q[d] = F.div(r[dega], b[degb]);
        for (let i = 0; i <= degb; i++) {
            r[i] = F.sub(r[i], F.mul(q[d], b[i]));
        }
    }

    return [q, r];
}

let Fp = new PrimeField(7n);
let Fp2 = new ExtensionField(Fp, [2n, 3n, 1n]);
// console.log(Fp2.mod([3n, 2n, 2n, 3n, 5n, 0n, 0n, 0n]));
console.log(Fp2.div([3n, 2n, 2n, 3n, 5n, 0n, 0n, 0n], [2n, 3n, 1n]));
