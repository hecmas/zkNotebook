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
        console.log(degree(a), degree(b));
        if (degree(a) === degree(b)) {
            if (a.length > b.length && b.every((v,i) => v === a[i])) {
                return true;
            } else if (b.length > a.length && a.every((v,i) => v === b[i])) {
                return true;
            }
        }
        return false;
    }

    neq(a: bigint[], b: bigint[]): boolean {
        return !this.eq(a, b);
    }

    // Basic Arithmetic
    mod(a: bigint[]): bigint[] {
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
            const c = new Array<bigint>(this.degree * 2 - 1).fill(0n);
            for (let i = 0; i < this.degree; i++) {
                for (let j = 0; j < this.degree; j++) {
                    c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }

    inv(a: bigint[]): bigint[] {
        if (this.eq(a,this.zero)) return this.zero;

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

    div(a: bigint[], b: bigint[]): bigint[] {
        if (degree(b) === 0) {
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
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = F.div(r[i + degb], b[degb]);
        for (let j = 0; j <= degb; j++) {
            r[i + j] = F.sub(r[i + j], F.mul(q[i], b[j]));
        }
    }

    return [q, r];
}

let Fp = new PrimeField(21888242871839275222246405745257275088696311157297823662689037894645226208583n);
let Fp2 = new ExtensionField(Fp, [82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]);
console.log(Fp2.inv([0n, 0n, 0n, 0n, 0n ,0n, 0n, 0n, 0n, 0n, 0n, 0n]));
