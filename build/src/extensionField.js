"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionFieldOverFqOverFq = exports.ExtensionFieldOverFq2 = exports.ExtensionFieldOverFq = exports.ExtensionField = void 0;
const primeField_1 = require("./primeField");
const polynomials_1 = require("./polynomials");
/*
    A polynomial p(x) = a0 + a1·x + a2·x^2 + ... + an·x^n  is represented
    by the array [a0, a1, a2, ..., an].
 */
// Old class
// export class ExtensionField implements FiniteField<bigint[]> {
//     readonly Fp: PrimeField;
//     readonly modulusCoeffs: bigint[];
//     readonly degree: number;
//     // Constructor
//     constructor(Fp: PrimeField, modulusCoeffs: bigint[]) {
//         // The prime field over which the extension is defined
//         this.Fp = Fp;
//         // The coefficients of the modulus
//         this.modulusCoeffs = modulusCoeffs;
//         // The degree of the extension
//         this.degree = modulusCoeffs.length - 1;
//     }
//     // Public Accessors
//     get zero(): bigint[] {
//         return [0n];
//     }
//     get one(): bigint[] {
//         return [1n];
//     }
//     // Comparators
//     eq(a: bigint[], b: bigint[]): boolean {
//         const dega = degree(a);
//         const degb = degree(b);
//         if (dega === degb) {
//             for (let i = 0; i < dega + 1; i++) {
//                 if (a[i] !== b[i]) return false;
//             }
//             return true;
//         } else {
//             return false;
//         }
//     }
//     neq(a: bigint[], b: bigint[]): boolean {
//         return !this.eq(a, b);
//     }
//     // Basic Arithmetic
//     mod(a: bigint[]): bigint[] {
//         const dega = degree(a);
//         if (dega < this.degree) {
//             const c = new Array<bigint>(dega + 1);
//             for (let i = 0; i < dega + 1; i++) {
//                 c[i] = this.Fp.mod(a[i]);
//             }
//             const degc = degree(c);
//             return c.slice(0, degc + 1);
//         }
//         let [, r] = euclidean_division(a, this.modulusCoeffs, this.Fp);
//         return r;
//     }
//     add(a: bigint[], b: bigint[]): bigint[] {
//         const dega = degree(a);
//         const degb = degree(b);
//         let maxdeg = Math.max(dega, degb);
//         const c = new Array<bigint>(maxdeg + 1);
//         for (let i = 0; i < maxdeg + 1; i++) {
//             let ai = i < dega + 1 ? a[i] : 0n;
//             let bi = i < degb + 1 ? b[i] : 0n;
//             c[i] = this.Fp.mod(ai + bi);
//         }
//         return this.mod(c);
//     }
//     neg(a: bigint[]): bigint[] {
//         const c = new Array<bigint>(degree(a) + 1);
//         for (let i = 0; i < degree(a) + 1; i++) {
//             c[i] = this.Fp.neg(a[i]);
//         }
//         return this.mod(c);
//     }
//     sub(a: bigint[], b: bigint[]): bigint[] {
//         const dega = degree(a);
//         const degb = degree(b);
//         const maxdeg = Math.max(dega, degb);
//         const c = new Array<bigint>(maxdeg + 1);
//         for (let i = 0; i < maxdeg + 1; i++) {
//             let ai = i < dega + 1 ? a[i] : 0n;
//             let bi = i < degb + 1 ? b[i] : 0n;
//             c[i] = this.Fp.mod(ai - bi);
//         }
//         return this.mod(c);
//     }
//     // sub(a: bigint[], b: bigint[]): bigint[] {
//     //     const c = this.add(a, this.neg(b));
//     //     return c;
//     // }
//     mul(a: bigint[], b: bigint[]): bigint[] {
//         const dega = degree(a);
//         const degb = degree(b);
//         if (dega === 0) {
//             if (degb === 0) {
//                 return [this.Fp.mul(a[0], b[0])];
//             } else {
//                 const c = new Array<bigint>(degb + 1);
//                 for (let i = 0; i < degb + 1; i++) {
//                     c[i] = this.Fp.mul(a[0], b[i]);
//                 }
//                 return this.mod(c);
//             }
//         } else if (degb === 0) {
//             const c = new Array<bigint>(dega + 1);
//             for (let i = 0; i < dega + 1; i++) {
//                 c[i] = this.Fp.mul(a[i], b[0]);
//             }
//             return this.mod(c);
//         } else {
//             const c = new Array<bigint>(dega + degb + 1).fill(0n);
//             for (let i = 0; i < dega + 1; i++) {
//                 for (let j = 0; j < degb + 1; j++) {
//                     c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
//                 }
//             }
//             return this.mod(c);
//         }
//     }
//     inv(a: bigint[]): bigint[] {
//         if (this.eq(a, this.zero))
//             throw new Error("Zero has no multiplicative inverse");
//         const [, y] = egcd(this.modulusCoeffs, a, this);
//         return y;
//     }
//     div(a: bigint[], b: bigint[]): bigint[] {
//         const dega = degree(a);
//         const degb = degree(b);
//         if (dega === 0 && degb === 0) {
//             return [this.Fp.div(a[0], b[0])];
//         } else if (degb === 0) {
//             if (b[0] === 0n) throw new Error("Division by zero");
//             const c = new Array<bigint>(dega + 1);
//             for (let i = 0; i < dega + 1; i++) {
//                 c[i] = this.Fp.div(a[i], b[0]);
//             }
//             return this.mod(c);
//         } else {
//             return this.mul(a, this.inv(b));
//         }
//     }
//     exp(base: bigint[], exponent: bigint): bigint[] {
//         base = this.mod(base);
//         // edge cases
//         if (this.eq(base, this.zero)) {
//             if (exponent === 0n) {
//                 throw new Error("0^0 is undefined");
//             }
//             return this.zero;
//         }
//         // negative exponent
//         if (exponent < 0n) {
//             base = this.inv(base);
//             exponent = -exponent;
//         }
//         return squareAndMultiply(base, exponent, this);
//     }
// }
// Modify egcd and squareAndMultiply
class ExtensionField {
    Fp;
    modulusCoeffs;
    extension_degree;
    trailing_zeros;
    // Constructor
    constructor(Fp, modulusCoeffs, trailing_zeros = false) {
        // The prime field over which the extension is defined
        this.Fp = Fp;
        // The coefficients of the modulus
        this.modulusCoeffs = modulusCoeffs;
        // The degree of the extension
        this.extension_degree = modulusCoeffs.length - 1;
        // Keep trailing zeros?
        this.trailing_zeros = trailing_zeros;
    }
    // Public Accessors
    get zero() {
        return [0n];
    }
    get one() {
        return [1n];
    }
    // Utility methods: These are for polynomials with coefficients over Fq in general
    degree(a) {
        const l = a.length;
        let d = l - 1;
        for (let i = l - 1; i >= 0; i--) {
            if (this.Fp.neq(this.Fp.mod(a[i]), this.Fp.zero)) {
                return d;
            }
            d--;
        }
        return d === -1 ? 0 : d; // let's convey the 0 polynomial has degree 0
    }
    euclidean_division(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        // if deg(a) < deg(b), then a = 0·b + a
        if (dega < degb) {
            return [this.zero, a];
        }
        let q = new Array(dega - degb + 1).fill(0n);
        let r = a.slice();
        for (let i = dega - degb; i >= 0; i--) {
            const qcoeff = this.Fp.div(r[i + degb], b[degb]);
            for (let j = 0; j < degb + 1; j++) {
                r[i + j] = this.Fp.sub(r[i + j], Fp.mul(q[i], b[j]));
            }
        }
        const degr = this.degree(r);
        if (this.trailing_zeros && degr < this.extension_degree - 1) {
            const diff = new Array(this.extension_degree - degr - 1).fill(0n);
            return [q, r.concat(diff)];
        }
        r = r.slice(0, degr + 1);
        return [q, r];
    }
    egcd(a, b) {
        let [old_r, r] = [a, b];
        let [old_s, s] = [this.one, this.zero];
        let [old_t, t] = [this.zero, this.one];
        while (this.neq(r, this.zero)) {
            const [q] = this.euclidean_division(old_r, r);
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
        for (let i = 0; i < this.degree(old_s) + 1; i++) {
            old_s[i] = this.Fp.div(old_s[i], old_r[0]);
        }
        for (let i = 0; i < this.degree(old_t) + 1; i++) {
            old_t[i] = this.Fp.div(old_t[i], old_r[0]);
        }
        for (let i = 0; i < this.degree(old_r) + 1; i++) {
            old_r[i] = this.Fp.div(old_r[i], old_r[0]);
        }
        return [old_s, old_t, old_r];
    }
    squareAndMultiply(base, exponent) {
        let result = base.slice();
        let binary = exponent.toString(2);
        for (let i = 1; i < binary.length; i++) {
            result = this.mul(result, result);
            if (binary[i] === "1") {
                result = this.mul(result, base);
            }
        }
        return result;
    }
    // Comparators
    eq(a, b) {
        a = this.mod(a);
        b = this.mod(b);
        const la = a.length;
        const lb = b.length;
        if (la === lb) {
            for (let i = 0; i < la; i++) {
                if (this.Fp.neq(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        const dega = this.degree(a);
        if (dega < this.extension_degree) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.mod(a[i]);
            }
            const degc = this.degree(c);
            if (this.trailing_zeros && degc < this.extension_degree - 1) {
                const diff = new Array(this.extension_degree - degc - 1).fill(0n);
                return c.concat(diff);
            }
            return c.slice(0, degc + 1);
        }
        let [, r] = this.euclidean_division(a, this.modulusCoeffs);
        return r;
    }
    add(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        let maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : 0n;
            let bi = i < degb + 1 ? b[i] : 0n;
            c[i] = this.Fp.mod(ai + bi);
        }
        return this.mod(c);
    }
    neg(a) {
        const c = new Array(this.degree(a) + 1);
        for (let i = 0; i < this.degree(a) + 1; i++) {
            c[i] = this.Fp.neg(a[i]);
        }
        return this.mod(c);
    }
    sub(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        const maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : 0n;
            let bi = i < degb + 1 ? b[i] : 0n;
            c[i] = this.Fp.mod(ai - bi);
        }
        return this.mod(c);
    }
    // sub(a: bigint[], b: bigint[]): bigint[] {
    //     const c = this.add(a, this.neg(b));
    //     return c;
    // }
    mul(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        if (dega === 0) {
            if (degb === 0) {
                return [this.Fp.mul(a[0], b[0])];
            }
            else {
                const c = new Array(degb + 1);
                for (let i = 0; i < degb + 1; i++) {
                    c[i] = this.Fp.mul(a[0], b[i]);
                }
                return this.mod(c);
            }
        }
        else if (degb === 0) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.mul(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            const c = new Array(dega + degb + 1).fill(0n);
            for (let i = 0; i < dega + 1; i++) {
                for (let j = 0; j < degb + 1; j++) {
                    c[i + j] = this.Fp.add(c[i + j], this.Fp.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }
    inv(a) {
        if (this.eq(a, this.zero))
            throw new Error("Zero has no multiplicative inverse");
        const [, y] = this.egcd(this.modulusCoeffs, a);
        return this.mod(y);
    }
    div(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        if (dega === 0 && degb === 0) {
            return [this.Fp.div(a[0], b[0])];
        }
        else if (degb === 0) {
            if (b[0] === 0n)
                throw new Error("Division by zero");
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.div(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            return this.mul(a, this.inv(b));
        }
    }
    exp(base, exponent) {
        base = this.mod(base);
        // edge cases
        if (this.eq(base, this.zero)) {
            if (exponent === 0n) {
                throw new Error("0^0 is undefined");
            }
            return this.zero;
        }
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        return this.mod(this.squareAndMultiply(base, exponent));
    }
}
exports.ExtensionField = ExtensionField;
class ExtensionFieldOverFq {
    Fp;
    Fq;
    modulusCoeffs;
    degree;
    // Constructor
    constructor(Fq, modulusCoeffs) {
        // The prime field over which the extension is defined
        this.Fp = Fq.Fp;
        // The extension field over which the extension is defined
        this.Fq = Fq;
        // The coefficients of the modulus
        this.modulusCoeffs = modulusCoeffs;
        // The degree of the extension
        this.degree = modulusCoeffs.length - 1;
    }
    // Public Accessors
    get zero() {
        return [[0n]];
    }
    get one() {
        return [[1n]];
    }
    // Comparators
    eq(a, b) {
        const dega = degree2(a);
        const degb = degree2(b);
        if (dega === degb) {
            for (let i = 0; i < dega + 1; i++) {
                const degai = (0, polynomials_1.degree)(a[i]);
                const degbi = (0, polynomials_1.degree)(b[i]);
                if (degai === degbi) {
                    for (let j = 0; j < degai + 1; j++) {
                        if (a[i][j] !== b[i][j])
                            return false;
                    }
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        const dega = degree2(a);
        if (dega < this.degree) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fq.mod(a[i]);
            }
            const degc = degree2(c);
            return c.slice(0, degc + 1);
        }
        let [, r] = euclidean_division2(a, this.modulusCoeffs, this.Fq);
        return r;
    }
    add(a, b) {
        const dega = degree2(a);
        const degb = degree2(b);
        let maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : [0n];
            let bi = i < degb + 1 ? b[i] : [0n];
            c[i] = this.Fq.add(ai, bi);
        }
        return this.mod(c);
    }
    neg(a) {
        const d = degree2(a);
        const c = new Array(d + 1);
        for (let i = 0; i < d + 1; i++) {
            c[i] = this.Fq.neg(a[i]);
        }
        return this.mod(c);
    }
    sub(a, b) {
        const dega = degree2(a);
        const degb = degree2(b);
        const maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : [0n];
            let bi = i < degb + 1 ? b[i] : [0n];
            c[i] = this.Fq.sub(ai, bi);
        }
        return this.mod(c);
    }
    // sub(a: bigint[], b: bigint[]): bigint[] {
    //     const c = this.add(a, this.neg(b));
    //     return c;
    // }
    mul(a, b) {
        const dega = degree2(a);
        const degb = degree2(b);
        if (dega === 0) {
            if (degb === 0) {
                return [this.Fq.mul(a[0], b[0])];
            }
            else {
                const c = new Array(degb + 1);
                for (let i = 0; i < degb + 1; i++) {
                    c[i] = this.Fq.mul(a[0], b[i]);
                }
                return this.mod(c);
            }
        }
        else if (degb === 0) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fq.mul(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            const c = new Array(dega + degb + 1).fill([0n]);
            for (let i = 0; i < dega + 1; i++) {
                for (let j = 0; j < degb + 1; j++) {
                    c[i + j] = this.Fq.add(c[i + j], this.Fq.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }
    inv(a) {
        if (this.eq(a, this.zero))
            throw new Error("Zero has no multiplicative inverse");
        const [, y] = egcd2(this.modulusCoeffs, a, this);
        return y;
    }
    div(a, b) {
        const dega = degree2(a);
        const degb = degree2(b);
        if (dega === 0 && degb === 0) {
            return [this.Fq.div(a[0], b[0])];
        }
        else if (degb === 0) {
            const dd = (0, polynomials_1.degree)(b[0]);
            if (dd === 0 && b[0][0] === 0n)
                throw new Error("Division by zero");
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fq.div(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            return this.mul(a, this.inv(b));
        }
    }
    exp(base, exponent) {
        base = this.mod(base);
        // edge cases
        if (this.eq(base, this.zero)) {
            if (exponent === 0n) {
                throw new Error("0^0 is undefined");
            }
            return this.zero;
        }
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        return squareAndMultiply2(base, exponent, this);
    }
}
exports.ExtensionFieldOverFq = ExtensionFieldOverFq;
// Adapt if for non-divisible modulus length
class ExtensionFieldOverFq2 {
    Fp;
    Fq;
    modulusCoeffs;
    base_degree;
    extension_degree;
    // Constructor
    constructor(Fq, modulusCoeffs) {
        // The prime field over which the extension is defined
        this.Fp = Fq.Fp;
        // The extension field over which the extension is defined
        Fq.trailing_zeros = true; // Set it to true for correctness
        this.Fq = Fq;
        // The coefficients of the modulus
        this.modulusCoeffs = modulusCoeffs;
        // The degree of the base extension
        this.base_degree = Fq.extension_degree;
        // The degree of the extension
        this.extension_degree = modulusCoeffs.length / this.base_degree - 1;
    }
    // Public Accessors
    get zero() {
        return new Array(this.base_degree).fill(0n);
    }
    get one() {
        return [1n, ...new Array(this.base_degree - 1).fill(0n)];
    }
    // Utility methods: These are for polynomials with coefficients over Fq in general
    degree(a) {
        const l = a.length;
        let d = Math.ceil(l / this.base_degree) - 1;
        for (let i = l - 1; i >= 0; i -= this.base_degree) {
            const coeff = a.slice(i - this.base_degree + 1, i + 1);
            if (this.Fq.neq(this.Fq.mod(coeff), this.zero)) {
                return d;
            }
            d--;
        }
        return d === -1 ? 0 : d; // let's convey the 0 polynomial has degree 0
    }
    euclidean_division(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        // if deg(a) < deg(b), then a = 0·b + a
        if (dega < degb) {
            return [this.zero, a];
        }
        let q = new Array(this.base_degree * (dega - degb + 1)).fill(0n);
        let r = a.slice();
        for (let i = dega - degb; i >= 0; i--) {
            let rcoeff = r.slice(this.base_degree * (i + degb), this.base_degree * (i + degb + 1));
            let bcoeff = b.slice(this.base_degree * degb, this.base_degree * (degb + 1));
            const qcoeff = this.Fq.div(rcoeff, bcoeff);
            q.splice(this.base_degree * i, this.base_degree, ...qcoeff);
            for (let j = 0; j < degb + 1; j++) {
                bcoeff = b.slice(j * this.base_degree, (j + 1) * this.base_degree);
                const qb = this.Fq.mul(qcoeff, bcoeff);
                rcoeff = r.slice(this.base_degree * (i + j), this.base_degree * (i + j + 1));
                r.splice(this.base_degree * (i + j), this.base_degree, ...this.Fq.sub(rcoeff, qb));
            }
        }
        const degr = this.degree(r);
        r = r.slice(0, this.base_degree * (degr + 1));
        return [q, r];
    }
    egcd(a, b) {
        let [old_r, r] = [a, b];
        let [old_s, s] = [this.one, this.zero];
        let [old_t, t] = [this.zero, this.one];
        while (this.neq(r, this.zero)) {
            const [q] = this.euclidean_division(old_r, r);
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
        for (let i = 0; i < this.degree(old_s) + 1; i++) {
            const oldscoeff = old_s.slice(i * this.base_degree, (i + 1) * this.base_degree);
            const oldrcoeff0 = old_r.slice(0, this.base_degree);
            old_s.splice(i * this.base_degree, this.base_degree, ...this.Fq.div(oldscoeff, oldrcoeff0));
        }
        for (let i = 0; i < this.degree(old_t) + 1; i++) {
            const oldtcoeff = old_t.slice(i * this.base_degree, (i + 1) * this.base_degree);
            const oldrcoeff0 = old_r.slice(0, this.base_degree);
            old_t.splice(i * this.base_degree, this.base_degree, ...this.Fq.div(oldtcoeff, oldrcoeff0));
        }
        for (let i = 0; i < this.degree(old_r) + 1; i++) {
            const oldrcoeff = old_r.slice(i * this.base_degree, (i + 1) * this.base_degree);
            const oldrcoeff0 = old_r.slice(0, this.base_degree);
            old_r.splice(i * this.base_degree, this.base_degree, ...this.Fq.div(oldrcoeff, oldrcoeff0));
        }
        return [old_s, old_t, old_r];
    }
    squareAndMultiply(base, exponent) {
        let result = base.slice();
        let binary = exponent.toString(2);
        for (let i = 1; i < binary.length; i++) {
            result = this.Fq.mul(result, result);
            if (binary[i] === "1") {
                result = this.Fq.mul(result, base);
            }
        }
        return result;
    }
    // Comparators
    // TODO: Use Fq functions!
    eq(a, b) {
        a = this.mod(a);
        b = this.mod(b);
        const la = a.length;
        const lb = b.length;
        if (la === lb) {
            for (let i = 0; i < la; i++) {
                if (this.Fp.neq(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        const dega = this.degree(a);
        if (dega < this.extension_degree) {
            const c = new Array(this.base_degree * (dega + 1)).fill(0n);
            for (let i = 0; i < dega + 1; i++) {
                const coeff = this.Fq.mod(a.slice(i * this.base_degree, (i + 1) * this.base_degree));
                c.splice(i * this.base_degree, this.base_degree, ...coeff);
            }
            const degc = this.degree(c);
            return c.slice(0, this.base_degree * (degc + 1));
        }
        let [, r] = this.euclidean_division(a, this.modulusCoeffs);
        return r;
    }
    add(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        let maxdeg = Math.max(dega, degb);
        const c = new Array(this.base_degree * (maxdeg + 1));
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a.slice(i * this.base_degree, (i + 1) * this.base_degree) : this.zero;
            let bi = i < degb + 1 ? b.slice(i * this.base_degree, (i + 1) * this.base_degree) : this.zero;
            c.splice(i * this.base_degree, this.base_degree, ...this.Fq.add(ai, bi));
        }
        return this.mod(c);
    }
    neg(a) {
        const d = this.degree(a);
        const c = new Array(this.base_degree * (d + 1));
        for (let i = 0; i < d + 1; i++) {
            const acoeff = a.slice(i * this.base_degree, (i + 1) * this.base_degree);
            c.splice(i * this.base_degree, this.base_degree, ...this.Fq.neg(acoeff));
        }
        return this.mod(c);
    }
    sub(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        const maxdeg = Math.max(dega, degb);
        const c = new Array(this.base_degree * (maxdeg + 1));
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a.slice(i * this.base_degree, (i + 1) * this.base_degree) : this.zero;
            let bi = i < degb + 1 ? b.slice(i * this.base_degree, (i + 1) * this.base_degree) : this.zero;
            c.splice(i * this.base_degree, this.base_degree, ...this.Fq.sub(ai, bi));
        }
        return this.mod(c);
    }
    mul(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        if (dega === 0) {
            if (degb === 0) {
                return this.Fq.mul(a, b);
            }
            else {
                const c = new Array(this.base_degree * (degb + 1));
                for (let i = 0; i < degb + 1; i++) {
                    const bcoeff = b.slice(i * this.base_degree, (i + 1) * this.base_degree);
                    c.splice(i * this.base_degree, this.base_degree, ...this.Fq.mul(a, bcoeff));
                }
                return this.mod(c);
            }
        }
        else if (degb === 0) {
            const c = new Array(this.base_degree * (dega + 1));
            for (let i = 0; i < dega + 1; i++) {
                const acoeff = a.slice(i * this.base_degree, (i + 1) * this.base_degree);
                c.splice(i * this.base_degree, this.base_degree, ...this.Fq.mul(acoeff, b));
            }
            return this.mod(c);
        }
        else {
            const c = new Array(this.base_degree * (dega + degb + 1)).fill(0n);
            for (let i = 0; i < dega + 1; i++) {
                const acoeff = a.slice(i * this.base_degree, (i + 1) * this.base_degree);
                for (let j = 0; j < degb + 1; j++) {
                    const bcoeff = b.slice(j * this.base_degree, (j + 1) * this.base_degree);
                    const ab = this.Fq.mul(acoeff, bcoeff);
                    const ccoeff = c.slice(this.base_degree * (i + j), this.base_degree * (i + j + 1));
                    c.splice(this.base_degree * (i + j), this.base_degree, ...this.Fq.add(ab, ccoeff));
                }
            }
            return this.mod(c);
        }
    }
    inv(a) {
        if (this.eq(a, this.zero))
            throw new Error("Zero has no multiplicative inverse");
        const [, y] = this.egcd(this.modulusCoeffs, a);
        return this.mod(y);
    }
    div(a, b) {
        const dega = this.degree(a);
        const degb = this.degree(b);
        if (dega === 0 && degb === 0) {
            return this.Fq.div(a, b);
        }
        else if (degb === 0) {
            if (this.eq(b, this.zero))
                throw new Error("Division by zero");
            const c = new Array(this.base_degree * (dega + 1));
            for (let i = 0; i < dega + 1; i++) {
                const acoeff = a.slice(i * this.base_degree, (i + 1) * this.base_degree);
                const bcoeff0 = b.slice(0, this.base_degree);
                c.splice(i * this.base_degree, this.base_degree, ...this.Fq.div(acoeff, bcoeff0));
            }
            return this.mod(c);
        }
        else {
            return this.mul(a, this.inv(b));
        }
    }
    exp(base, exponent) {
        base = this.mod(base);
        // edge cases
        if (this.eq(base, this.zero)) {
            if (exponent === 0n) {
                throw new Error("0^0 is undefined");
            }
            return this.zero;
        }
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        return this.squareAndMultiply(base, exponent);
    }
}
exports.ExtensionFieldOverFq2 = ExtensionFieldOverFq2;
class ExtensionFieldOverFqOverFq {
    Fp;
    Fq;
    modulusCoeffs;
    degree;
    // Constructor
    constructor(Fq, modulusCoeffs) {
        // The prime field over which the extension is defined
        this.Fp = Fq.Fq.Fp;
        // The extension field over which the extension is defined
        this.Fq = Fq;
        // The coefficients of the modulus
        this.modulusCoeffs = modulusCoeffs;
        // The degree of the extension
        this.degree = modulusCoeffs.length - 1;
    }
    // Public Accessors
    get zero() {
        return [[[0n]]];
    }
    get one() {
        return [[[1n]]];
    }
    // Comparators
    eq(a, b) {
        const dega = degree3(a);
        const degb = degree3(b);
        if (dega === degb) {
            for (let i = 0; i < dega + 1; i++) {
                const degai = degree2(a[i]);
                const degbi = degree2(b[i]);
                if (degai === degbi) {
                    for (let j = 0; j < degai + 1; j++) {
                        const degaij = (0, polynomials_1.degree)(a[i][j]);
                        const degbij = (0, polynomials_1.degree)(b[i][j]);
                        if (degaij === degbij) {
                            for (let k = 0; k < degaij + 1; k++) {
                                if (a[i][j][k] !== b[i][j][k])
                                    return false;
                            }
                        }
                        else {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        const dega = degree3(a);
        if (dega < this.degree) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fq.mod(a[i]);
            }
            const degc = degree3(c);
            return c.slice(0, degc + 1);
        }
        let [, r] = euclidean_division3(a, this.modulusCoeffs, this.Fq);
        return r;
    }
    add(a, b) {
        const dega = degree3(a);
        const degb = degree3(b);
        let maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : [[0n]];
            let bi = i < degb + 1 ? b[i] : [[0n]];
            c[i] = this.Fq.add(ai, bi);
        }
        return this.mod(c);
    }
    neg(a) {
        const d = degree3(a);
        const c = new Array(d + 1);
        for (let i = 0; i < d + 1; i++) {
            c[i] = this.Fq.neg(a[i]);
        }
        return this.mod(c);
    }
    sub(a, b) {
        const dega = degree3(a);
        const degb = degree3(b);
        const maxdeg = Math.max(dega, degb);
        const c = new Array(maxdeg + 1);
        for (let i = 0; i < maxdeg + 1; i++) {
            let ai = i < dega + 1 ? a[i] : [[0n]];
            let bi = i < degb + 1 ? b[i] : [[0n]];
            c[i] = this.Fq.sub(ai, bi);
        }
        return this.mod(c);
    }
    // sub(a: bigint[], b: bigint[]): bigint[] {
    //     const c = this.add(a, this.neg(b));
    //     return c;
    // }
    mul(a, b) {
        const dega = degree3(a);
        const degb = degree3(b);
        if (dega === 0) {
            if (degb === 0) {
                return [this.Fq.mul(a[0], b[0])];
            }
            else {
                const c = new Array(degb + 1);
                for (let i = 0; i < degb + 1; i++) {
                    c[i] = this.Fq.mul(a[0], b[i]);
                }
                return this.mod(c);
            }
        }
        else if (degb === 0) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fq.mul(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            const c = new Array(dega + degb + 1).fill([
                [0n],
            ]);
            for (let i = 0; i < dega + 1; i++) {
                for (let j = 0; j < degb + 1; j++) {
                    c[i + j] = this.Fq.add(c[i + j], this.Fq.mul(a[i], b[j]));
                }
            }
            return this.mod(c);
        }
    }
    inv(a) {
        if (this.eq(a, this.zero))
            throw new Error("Zero has no multiplicative inverse");
        const [, y] = egcd3(this.modulusCoeffs, a, this);
        return y;
    }
    div(a, b) {
        const dega = degree3(a);
        const degb = degree3(b);
        if (dega === 0 && degb === 0) {
            return [this.Fq.div(a[0], b[0])];
        }
        else if (degb === 0) {
            const dd = degree2(b[0]);
            const ddd = (0, polynomials_1.degree)(b[0][0]);
            if (dd === 0 && ddd === 0 && b[0][0][0] === 0n)
                throw new Error("Division by zero");
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fq.div(a[i], b[0]);
            }
            return this.mod(c);
        }
        else {
            return this.mul(a, this.inv(b));
        }
    }
    exp(base, exponent) {
        base = this.mod(base);
        // edge cases
        if (this.eq(base, this.zero)) {
            if (exponent === 0n) {
                throw new Error("0^0 is undefined");
            }
            return this.zero;
        }
        // negative exponent
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        return squareAndMultiply3(base, exponent, this);
    }
}
exports.ExtensionFieldOverFqOverFq = ExtensionFieldOverFqOverFq;
const Fp = new primeField_1.PrimeField(11n);
const Fp2 = new ExtensionField(Fp, [1n, 0n, 1n]);
const Fp6a = new ExtensionFieldOverFq(Fp2, [Fp2.neg([9n, 1n]), [0n], [0n], [1n]]);
// const Fp12 = new ExtensionFieldOverFq(Fp2, [Fp2.neg([9n, 1n]),[0n],[0n],[0n],[0n],[0n],[1n, 0n]]);
const Fp6b = new ExtensionFieldOverFq2(Fp2, [-9n, -1n, 0n, 0n, 0n, 0n, 1n, 0n]);
// const Fp12b = new ExtensionFieldOverFqOverFq(Fp6b, [[[0n], [-1n,0n], [0n]], [[0n], [0n], [0n]], [[1n], [0n], [0n]]]);
const a = [[10n, 2n], [5n, 13n], [7n, 5n]];
const b = [[9n, 1n], [1n, 2n], [14n, 2n]];
console.log(Fp6a.div(a, b));
const c = [10n, 2n, 5n, 13n, 7n, 5n];
const d = [9n, 1n, 1n, 2n, 14n, 2n];
console.log(Fp6b.div(c, d));
function degree2(a) {
    let d = a.length - 1;
    let dd = (0, polynomials_1.degree)(a[d]);
    while (d && dd === 0 && a[d][0] === 0n) {
        d--;
        dd = (0, polynomials_1.degree)(a[d]);
    }
    return d;
}
function degree3(a) {
    let d = a.length - 1;
    let dd = degree2(a[d]);
    while (d && dd === 0 && a[d][0][0] === 0n) {
        d--;
        dd = degree2(a[d]);
    }
    return d;
}
function euclidean_division2(a, b, Fq) {
    const dega = degree2(a);
    const degb = degree2(b);
    let q = new Array(dega - degb + 1).fill([0n]);
    let r = a.slice();
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = Fq.div(r[i + degb], b[degb]);
        for (let j = 0; j < degb + 1; j++) {
            r[i + j] = Fq.sub(r[i + j], Fq.mul(q[i], b[j]));
        }
    }
    const degr = degree2(r);
    r = r.slice(0, degr + 1);
    return [q, r];
}
function euclidean_division3(a, b, Fq) {
    const dega = degree3(a);
    const degb = degree3(b);
    let q = new Array(dega - degb + 1).fill([[0n]]);
    let r = a.slice();
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = Fq.div(r[i + degb], b[degb]);
        for (let j = 0; j < degb + 1; j++) {
            r[i + j] = Fq.sub(r[i + j], Fq.mul(q[i], b[j]));
        }
    }
    const degr = degree3(r);
    r = r.slice(0, degr + 1);
    return [q, r];
}
function egcd2(a, b, Fq) {
    let [old_r, r] = [a, b];
    let [old_s, s] = [Fq.one, Fq.zero];
    let [old_t, t] = [Fq.zero, Fq.one];
    while (Fq.neq(r, Fq.zero)) {
        const [q] = euclidean_division2(old_r, r, Fq.Fq);
        let old_rr = old_r.slice();
        let old_ss = old_s.slice();
        let old_tt = old_t.slice();
        old_rr = Fq.sub(old_rr, Fq.mul(q, r));
        old_ss = Fq.sub(old_ss, Fq.mul(q, s));
        old_tt = Fq.sub(old_tt, Fq.mul(q, t));
        [old_r, r] = [r, old_rr];
        [old_s, s] = [s, old_ss];
        [old_t, t] = [t, old_tt];
    }
    for (let i = 0; i < degree2(old_s) + 1; i++) {
        old_s[i] = Fq.Fq.div(old_s[i], old_r[0]);
    }
    for (let i = 0; i < degree2(old_t) + 1; i++) {
        old_t[i] = Fq.Fq.div(old_t[i], old_r[0]);
    }
    for (let i = 0; i < degree2(old_r) + 1; i++) {
        old_r[i] = Fq.Fq.div(old_r[i], old_r[0]);
    }
    return [old_s, old_t, old_r];
}
function egcd3(a, b, Fq) {
    let [old_r, r] = [a, b];
    let [old_s, s] = [Fq.one, Fq.zero];
    let [old_t, t] = [Fq.zero, Fq.one];
    while (Fq.neq(r, Fq.zero)) {
        const [q] = euclidean_division3(old_r, r, Fq.Fq);
        let old_rr = old_r.slice();
        let old_ss = old_s.slice();
        let old_tt = old_t.slice();
        old_rr = Fq.sub(old_rr, Fq.mul(q, r));
        old_ss = Fq.sub(old_ss, Fq.mul(q, s));
        old_tt = Fq.sub(old_tt, Fq.mul(q, t));
        [old_r, r] = [r, old_rr];
        [old_s, s] = [s, old_ss];
        [old_t, t] = [t, old_tt];
    }
    for (let i = 0; i < degree3(old_s) + 1; i++) {
        old_s[i] = Fq.Fq.div(old_s[i], old_r[0]);
    }
    for (let i = 0; i < degree3(old_t) + 1; i++) {
        old_t[i] = Fq.Fq.div(old_t[i], old_r[0]);
    }
    for (let i = 0; i < degree3(old_r) + 1; i++) {
        old_r[i] = Fq.Fq.div(old_r[i], old_r[0]);
    }
    return [old_s, old_t, old_r];
}
function squareAndMultiply2(base, exponent, Fq) {
    let result = base.slice();
    let binary = exponent.toString(2);
    for (let i = 1; i < binary.length; i++) {
        result = Fq.mul(result, result);
        if (binary[i] === "1") {
            result = Fq.mul(result, base);
        }
    }
    return result;
}
function squareAndMultiply3(base, exponent, Fq) {
    let result = base.slice();
    let binary = exponent.toString(2);
    for (let i = 1; i < binary.length; i++) {
        result = Fq.mul(result, result);
        if (binary[i] === "1") {
            result = Fq.mul(result, base);
        }
    }
    return result;
}
//# sourceMappingURL=extensionField.js.map