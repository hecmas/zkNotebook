"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionField = void 0;
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
        const dega = degree(a);
        const degb = degree(b);
        if (dega === degb) {
            for (let i = 0; i < dega + 1; i++) {
                if (a[i] !== b[i])
                    return false;
            }
            return true;
        }
        return false;
    }
    neq(a, b) {
        return !this.eq(a, b);
    }
    // Basic Arithmetic
    mod(a) {
        const dega = degree(a);
        if (dega < this.degree) {
            const c = new Array(dega + 1);
            for (let i = 0; i < dega + 1; i++) {
                c[i] = this.Fp.mod(a[i]);
            }
            const degc = degree(c);
            return c.slice(0, degc + 1);
        }
        let [, r] = euclidean_division(a, this.modulusCoeffs, this.Fp);
        return r;
    }
    add(a, b) {
        const dega = degree(a);
        const degb = degree(b);
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
        const c = new Array(degree(a) + 1);
        for (let i = 0; i < degree(a) + 1; i++) {
            c[i] = this.Fp.neg(a[i]);
        }
        return this.mod(c);
    }
    sub(a, b) {
        const dega = degree(a);
        const degb = degree(b);
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
        const dega = degree(a);
        const degb = degree(b);
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
        const [, y] = egcd(this.modulusCoeffs, a, this);
        return y;
    }
    div(a, b) {
        const dega = degree(a);
        const degb = degree(b);
        if (dega === 0) {
            if (degb === 0) {
                return [this.Fp.div(a[0], b[0])];
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
        return squareAndMultiply(base, exponent, this);
    }
}
exports.ExtensionField = ExtensionField;
function degree(a) {
    let d = a.length - 1;
    while (d && a[d] === 0n) {
        d--;
    }
    return d;
}
function euclidean_division(a, b, Fp) {
    const dega = degree(a);
    const degb = degree(b);
    let q = new Array(dega - degb + 1).fill(0n);
    let r = a.slice();
    for (let i = dega - degb; i >= 0; i--) {
        q[i] = Fp.div(r[i + degb], b[degb]);
        for (let j = 0; j < degb + 1; j++) {
            r[i + j] = Fp.sub(r[i + j], Fp.mul(q[i], b[j]));
        }
    }
    const degr = degree(r);
    r = r.slice(0, degr + 1);
    return [q, r];
}
function egcd(a, b, Fq) {
    let [old_r, r] = [a, b];
    let [old_s, s] = [Fq.one, Fq.zero];
    let [old_t, t] = [Fq.zero, Fq.one];
    while (Fq.neq(r, Fq.zero)) {
        const [q] = euclidean_division(old_r, r, Fq.Fp);
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
    for (let i = 0; i < degree(old_s) + 1; i++) {
        old_s[i] = Fq.Fp.div(old_s[i], old_r[0]);
    }
    for (let i = 0; i < degree(old_t) + 1; i++) {
        old_t[i] = Fq.Fp.div(old_t[i], old_r[0]);
    }
    for (let i = 0; i < degree(old_r) + 1; i++) {
        old_r[i] = Fq.Fp.div(old_r[i], old_r[0]);
    }
    return [old_s, old_t, old_r];
}
function squareAndMultiply(base, exponent, Fq) {
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