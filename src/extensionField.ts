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
        return [0n];
    }

    get one(): bigint[] {
        return [1n];
    }

    // Comparators
    eq(a: bigint[], b: bigint[]): boolean {
        const dega = degree(a);
        const degb = degree(b);
        if (dega === degb) {
            for (let i = 0; i < dega + 1; i++) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }
        return false;
    }

    neq(a: bigint[], b: bigint[]): boolean {
        return !this.eq(a, b);
    }

    // Basic Arithmetic
    mod(a: bigint[]): bigint[] {
        let dega = degree(a);
        if (dega < this.degree) {
            const c = new Array<bigint>(dega+1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.mod(a[i]);
            }
            return c;
        }

        let [, r] = euclidean_division(a, this.modulus_coeffs, this.Fp);
        return r;
    }

    add(a: bigint[], b: bigint[]): bigint[] {
        let dega = degree(a);
        let degb = degree(b);
        let maxdeg = Math.max(dega, degb);
        const c = new Array<bigint>(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : 0n;
            let bi = i < degb + 1 ? b[i] : 0n;
            c[i] = this.Fp.mod(ai + bi);
        }

        return this.mod(c);
    }

    sub(a: bigint[], b: bigint[]): bigint[] {
        const c = this.add(a, this.neg(b));
        return c;
    }

    neg(a: bigint[]): bigint[] {
        const c = new Array<bigint>(degree(a) + 1);
        for (let i = 0; i < degree(a) + 1; i++) {
            c[i] = this.Fp.neg(a[i]);
        }
        return this.mod(c);
    }

    mul(a: bigint[], b: bigint[]): bigint[] {
        if (degree(a) === 0) {
            if (degree(b) === 0) {
                return [this.Fp.mul(a[0], b[0])];
            } else {
                const c = new Array<bigint>(degree(b) + 1);
                for (let i = 0; i < degree(b) + 1; i++) {
                    c[i] = this.Fp.mul(a[0], b[i]);
                }
                return this.mod(c);
            }
        } else if (degree(b) === 0) {
            const c = new Array<bigint>(degree(a) + 1);
            for (let i = 0; i < degree(a) + 1; i++) {
                c[i] = this.Fp.mul(a[i], b[0]);
            }
            return this.mod(c);
        } else {
            const c = new Array<bigint>(degree(a) + degree(b) + 1).fill(0n);
            for (let i = 0; i < degree(a) + 1; i++) {
                for (let j = 0; j < degree(b) + 1; j++) {
                    c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }

    inv(a: bigint[]): bigint[] {
        if (this.eq(a, this.zero)) return this.zero;

        let [old_r, r] = [this.modulus_coeffs,a];
        let [old_s, s] = [this.one, this.zero];
        let [old_t, t] = [this.zero, this.one];

        while (this.neq(r, this.zero)) {
            const [q,] = euclidean_division(old_r, r, Fp);
            let old_rr = old_r.slice();
            let old_ss = old_s.slice();
            let old_tt = old_t.slice();
            old_rr = this.sub(old_rr, this.mul(q, r));
            old_ss = this.sub(old_ss, this.mul(q, s));
            old_tt = this.sub(old_tt, this.mul(q, t));

            [old_r, r] = [r, old_rr];
            [old_s, s] = [s, old_ss];
            [old_t, t] = [t, old_tt];
        }

        for (let i = 0; i < degree(old_s) + 1; i++) {
            old_s[i] = this.Fp.div(old_s[i], old_r[0]);
        }
        for (let i = 0; i < degree(old_t) + 1; i++) {
            old_t[i] = this.Fp.div(old_t[i], old_r[0]);
        }
        for (let i = 0; i < degree(old_r) + 1; i++) {
            old_r[i] = this.Fp.div(old_r[i], old_r[0]);
        }

        // return [old_s, old_t, old_r]
        return old_t;
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

// export class ExtensionField2 extends ExtensionField {
//     constructor(modulus_coeffs: bigint[]) {
//         this.Fp
//     }
// }

function degree(a: bigint[]): number {
    let d = a.length - 1;
    while (d && a[d] === 0n) {
        d--;
    }
    return d;
}

function euclidean_division(
    a: bigint[],
    b: bigint[],
    F: PrimeField
): bigint[][] {
    let dega = degree(a);
    let degb = degree(b);
    let q = new Array<bigint>(a.length).fill(0n);
    let r = a.slice();
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = F.div(r[i + degb], b[degb]);
        for (let j = 0; j < degb+1; j++) {
            r[i + j] = F.sub(r[i + j], F.mul(q[i], b[j]));
        }
    }
    return [q, r];
}

// let Fp = new PrimeField(21888242871839275222246405745257275088696311157297823662689037894645226208583n);
// let Fp2 = new ExtensionField(Fp, [82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]);
// console.log(Fp2.mod([82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]));

let Fp = new PrimeField(17n);
let Fp2 = new ExtensionField(Fp, [1n, 2n, 3n]);
let result = Fp2.inv([1n,2n]);
console.log(result);
// console.log(Fp2.mul([1n, 2n], result));
