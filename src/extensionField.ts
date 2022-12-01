// https://github.com/ethereum/py_pairing
// https://ethereum.github.io/execution-specs/autoapi/ethereum/crypto/alt_bn128/index.html

import {degree} from "./utils";
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

    // Basic Arithmetic
    mod(a: bigint[]): bigint[] {
        while (a.length > this.degree) {
            // Polynomial long division, assuming the modulus is monic 
            // and its trailing coefficient is non-zero
            const start = a.length - this.degree - 1;
            const d = a.pop();
            for (let i = 0; i < this.degree; i++) {
                a[start+i] = this.Fp.sub(a[start+i], this.Fp.mul(d, this.modulus_coeffs[i]));
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
            const c = new Array<bigint>(this.degree*2-1).fill(0n);
            for (let i = 0; i < this.degree; i++) {
                for (let j = 0; j < this.degree; j++) {
                    c[i+j] = this.Fp.add(c[i+j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }

    // inv(a: bigint): bigint {
    //     a = this.mod(a);
    //     if (a === 0n) return 0n;
    //     let [x, ,] = egcd(a, this.p);
    //     return this.mod(x);
    // }

    // div(a: bigint, b: bigint): bigint {
    //     return this.mul(a, this.inv(b));
    // }

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

let Fp = new PrimeField(7n);
let Fp2 = new ExtensionField(Fp, [2n, 3n, 1n]);
console.log(Fp2.mod([3n,2n,2n,3n,5n]));