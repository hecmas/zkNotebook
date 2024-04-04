"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionFieldOverFqOverFq = exports.ExtensionFieldOverFq = exports.ExtensionField = void 0;
const univariatePolynomialRing_1 = require("./univariatePolynomialRing");
/*
    A polynomial p(x) = a0 + a1·x + a2·x^2 + ... + an·x^n  is represented
    by the array [a0, a1, a2, ..., an].
 */
class ExtensionField {
    Fp;
    modulusCoeffs;
    degree;
    // Constructor
    constructor(Fp, modulusCoeffs) {
        // The prime field over which the extension is defined
        this.Fp = Fp;
        // The coefficients of the modulus
        this.modulusCoeffs = modulusCoeffs;
        // The degree of the extension
        this.degree = modulusCoeffs.length - 1;
    }
    // Public Accessors
    get zero() {
        return [0n];
    }
    get one() {
        return [1n];
    }
    // Comparators
    eq(a, b) {
        const dega = (0, univariatePolynomialRing_1.degree)(a);
        const degb = (0, univariatePolynomialRing_1.degree)(b);
        if (dega === degb) {
            for (let i = 0; i < dega + 1; i++) {
                if (a[i] !== b[i])
                    return false;
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
    isZero(a) {
        return this.eq(a, this.zero);
    }
    // Basic Arithmetic
    mod(a) {
        const dega = (0, univariatePolynomialRing_1.degree)(a);
        if (dega < this.degree) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.mod(a[i]);
            }
            const degc = (0, univariatePolynomialRing_1.degree)(c);
            return c.slice(0, degc + 1);
        }
        let [, r] = (0, univariatePolynomialRing_1.euclidean_division)(a, this.modulusCoeffs, this.Fp);
        return r;
    }
    add(a, b) {
        const dega = (0, univariatePolynomialRing_1.degree)(a);
        const degb = (0, univariatePolynomialRing_1.degree)(b);
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
        const c = new Array((0, univariatePolynomialRing_1.degree)(a) + 1);
        for (let i = 0; i < (0, univariatePolynomialRing_1.degree)(a) + 1; i++) {
            c[i] = this.Fp.neg(a[i]);
        }
        return this.mod(c);
    }
    sub(a, b) {
        const dega = (0, univariatePolynomialRing_1.degree)(a);
        const degb = (0, univariatePolynomialRing_1.degree)(b);
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
        const dega = (0, univariatePolynomialRing_1.degree)(a);
        const degb = (0, univariatePolynomialRing_1.degree)(b);
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
    square(a) {
        return this.mul(a, a);
    }
    scalarMul(a, k) {
        const c = new Array((0, univariatePolynomialRing_1.degree)(a) + 1);
        for (let i = 0; i < (0, univariatePolynomialRing_1.degree)(a) + 1; i++) {
            c[i] = this.Fp.mul(a[i], k);
        }
        return this.mod(c);
    }
    inv(a) {
        if (this.eq(a, this.zero))
            throw new Error("Zero has no multiplicative inverse");
        const [, y] = (0, univariatePolynomialRing_1.egcd)(this.modulusCoeffs, a, this);
        return y;
    }
    div(a, b) {
        const dega = (0, univariatePolynomialRing_1.degree)(a);
        const degb = (0, univariatePolynomialRing_1.degree)(b);
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
        return (0, univariatePolynomialRing_1.squareAndMultiply)(base, exponent, this);
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
                const degai = (0, univariatePolynomialRing_1.degree)(a[i]);
                const degbi = (0, univariatePolynomialRing_1.degree)(b[i]);
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
    isZero(a) {
        return this.eq(a, this.zero);
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
    square(a) {
        return this.mul(a, a);
    }
    scalarMul(a, k) {
        const c = new Array(degree2(a) + 1);
        for (let i = 0; i < degree2(a) + 1; i++) {
            c[i] = this.Fq.mul(a[i], k);
        }
        return this.mod(c);
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
            const dd = (0, univariatePolynomialRing_1.degree)(b[0]);
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
                        const degaij = (0, univariatePolynomialRing_1.degree)(a[i][j]);
                        const degbij = (0, univariatePolynomialRing_1.degree)(b[i][j]);
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
    isZero(a) {
        return this.eq(a, this.zero);
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
    square(a) {
        return this.mul(a, a);
    }
    scalarMul(a, k) {
        const c = new Array(degree3(a) + 1);
        for (let i = 0; i < degree3(a) + 1; i++) {
            c[i] = this.Fq.mul(a[i], k);
        }
        return this.mod(c);
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
            const ddd = (0, univariatePolynomialRing_1.degree)(b[0][0]);
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
function degree2(a) {
    let d = a.length - 1;
    let dd = (0, univariatePolynomialRing_1.degree)(a[d]);
    while (d && dd === 0 && a[d][0] === 0n) {
        d--;
        dd = (0, univariatePolynomialRing_1.degree)(a[d]);
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