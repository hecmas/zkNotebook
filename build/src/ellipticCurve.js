"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedding_degree = exports.EllipticCurveOverFqOverFq = exports.EllipticCurveOverFq = exports.EllipticCurveOverFp = void 0;
const sqrt = require("bigint-isqrt");
// TODO: Implement Schoof's algorithm
// function Schoof_algorithm(a: bigint, b: bigint, p: bigint){
//     let S = [];
//     let acc = 1n;
//     let prime = 1;
//     while (acc <= 4n * sqrt(p)) {
//         while (Math.isPrime(prime)
//         S.push(acc);
//         acc *= 2n;
//     }
// }
// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are Fp elements
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
class EllipticCurveOverFp {
    a;
    b;
    Fp;
    constructor(a, b, field) {
        const firstSummand = field.mul(4n, field.exp(a, 3n));
        const secondSummand = field.mul(27n, field.exp(b, 2n));
        const sum = field.add(firstSummand, secondSummand);
        if (field.eq(sum, field.zero)) {
            throw new Error("The curve is singular, choose another a and b");
        }
        this.a = a;
        this.b = b;
        this.Fp = field;
    }
    // Public Accessors
    get zero() {
        return null;
    }
    // Comparators
    eq(P, Q) {
        return this.Fp.eq(P.x, Q.x) && this.Fp.eq(P.y, Q.y);
    }
    neq(P, Q) {
        return !this.eq(P, Q);
    }
    // Check if a point is the identity element
    is_zero(P) {
        return P === this.zero;
    }
    // Check that a point is on the curve
    is_on_curve(P) {
        if (this.is_zero(P)) {
            return true;
        }
        const left_side = this.Fp.exp(P.y, 2n);
        const right_side = this.Fp.add(this.Fp.add(this.Fp.exp(P.x, 3n), this.Fp.mul(this.a, P.x)), this.b);
        return this.Fp.eq(left_side, right_side);
    }
    // Basic Arithmetic
    add(P, Q) {
        if (this.is_zero(P))
            return Q;
        if (this.is_zero(Q))
            return P;
        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }
        let m;
        if (P.x === Q.x && P.y === Q.y) {
            m = this.Fp.div(this.Fp.add(this.Fp.mul(3n, this.Fp.mul(P.x, P.x)), this.a), this.Fp.mul(2n, P.y));
        }
        else {
            m = this.Fp.div(this.Fp.sub(Q.y, P.y), this.Fp.sub(Q.x, P.x));
        }
        const x = this.Fp.sub(this.Fp.sub(this.Fp.mul(m, m), P.x), Q.x);
        const y = this.Fp.sub(this.Fp.mul(m, this.Fp.sub(P.x, x)), P.y);
        return { x, y };
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        if (this.is_zero(P))
            return this.zero;
        return { x: this.Fp.mod(P.x), y: this.Fp.neg(P.y) };
    }
    escalarMul(P, k) {
        if (k === 0n)
            return this.zero;
        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }
        let R = P;
        let binary = k.toString(2);
        for (let i = 1; i < binary.length; i++) {
            R = this.add(R, R);
            if (binary[i] === "1") {
                R = this.add(R, P);
            }
        }
        return R;
    }
}
exports.EllipticCurveOverFp = EllipticCurveOverFp;
// /*
//     * Elliptic curve over Fq
//     * y² = x³ + a·x + b
//     * a, b are Fq elements
//     * 4·a³ + 27·b² != 0
//     * q is a prime power
//     */
class EllipticCurveOverFq {
    a;
    b;
    Fq;
    constructor(a, b, field) {
        const firstSummand = field.mul([4n], field.exp(a, 3n));
        const secondSummand = field.mul([27n], field.exp(b, 2n));
        const sum = field.add(firstSummand, secondSummand);
        if (field.eq(sum, field.zero)) {
            throw new Error("The curve is singular, choose another a and b");
        }
        // Compute the emebdding degree
        const k = 1;
        this.a = a;
        this.b = b;
        this.Fq = field;
    }
    // Public Accessors
    get zero() {
        return null;
    }
    // Check if a point is the identity element
    is_zero(P) {
        return P === this.zero;
    }
    // Check that a point is on the curve
    is_on_curve(P) {
        if (this.is_zero(P)) {
            return true;
        }
        const left_side = this.Fq.exp(P.y, 2n);
        const right_side = this.Fq.add(this.Fq.add(this.Fq.exp(P.x, 3n), this.Fq.mul(this.a, P.x)), this.b);
        return this.Fq.eq(left_side, right_side);
    }
    // Basic Arithmetic
    add(P, Q) {
        if (this.is_zero(P))
            return Q;
        if (this.is_zero(Q))
            return P;
        if (this.Fq.eq(P.x, Q.x)) {
            if (this.Fq.neq(P.y, Q.y)) {
                // P = -Q
                return this.zero;
            }
        }
        let m;
        if (this.Fq.eq(P.x, Q.x) && this.Fq.eq(P.y, Q.y)) {
            m = this.Fq.div(this.Fq.add(this.Fq.mul([3n], this.Fq.mul(P.x, P.x)), this.a), this.Fq.mul([2n], P.y));
        }
        else {
            m = this.Fq.div(this.Fq.sub(Q.y, P.y), this.Fq.sub(Q.x, P.x));
        }
        const x = this.Fq.sub(this.Fq.sub(this.Fq.mul(m, m), P.x), Q.x);
        const y = this.Fq.sub(this.Fq.mul(m, this.Fq.sub(P.x, x)), P.y);
        return { x, y };
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        if (this.is_zero(P))
            return this.zero;
        return { x: this.Fq.mod(P.x), y: this.Fq.neg(P.y) };
    }
    escalarMul(P, k) {
        if (k === 0n)
            return this.zero;
        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }
        let R = P;
        let binary = k.toString(2);
        for (let i = 1; i < binary.length; i++) {
            R = this.add(R, R);
            if (binary[i] === "1") {
                R = this.add(R, P);
            }
        }
        return R;
    }
}
exports.EllipticCurveOverFq = EllipticCurveOverFq;
// /*
//     * Elliptic curve over Fq
//     * y² = x³ + a·x + b
//     * a, b are Fq elements
//     * 4·a³ + 27·b² != 0
//     * q is a prime power
//     */
class EllipticCurveOverFqOverFq {
    a;
    b;
    Fq;
    constructor(a, b, field) {
        const firstSummand = field.mul([[4n]], field.exp(a, 3n));
        const secondSummand = field.mul([[27n]], field.exp(b, 2n));
        const sum = field.add(firstSummand, secondSummand);
        if (field.eq(sum, field.zero)) {
            throw new Error("The curve is singular, choose another a and b");
        }
        // Compute the emebdding degree
        const k = 1;
        this.a = a;
        this.b = b;
        this.Fq = field;
    }
    // Public Accessors
    get zero() {
        return null;
    }
    // Check if a point is the identity element
    is_zero(P) {
        return P === this.zero;
    }
    // Check that a point is on the curve
    is_on_curve(P) {
        if (this.is_zero(P)) {
            return true;
        }
        const left_side = this.Fq.exp(P.y, 2n);
        const right_side = this.Fq.add(this.Fq.add(this.Fq.exp(P.x, 3n), this.Fq.mul(this.a, P.x)), this.b);
        return this.Fq.eq(left_side, right_side);
    }
    // Basic Arithmetic
    add(P, Q) {
        if (this.is_zero(P))
            return Q;
        if (this.is_zero(Q))
            return P;
        if (this.Fq.eq(P.x, Q.x)) {
            if (this.Fq.neq(P.y, Q.y)) {
                // P = -Q
                return this.zero;
            }
        }
        let m;
        if (this.Fq.eq(P.x, Q.x) && this.Fq.eq(P.y, Q.y)) {
            m = this.Fq.div(this.Fq.add(this.Fq.mul([[3n]], this.Fq.mul(P.x, P.x)), this.a), this.Fq.mul([[2n]], P.y));
        }
        else {
            m = this.Fq.div(this.Fq.sub(Q.y, P.y), this.Fq.sub(Q.x, P.x));
        }
        const x = this.Fq.sub(this.Fq.sub(this.Fq.mul(m, m), P.x), Q.x);
        const y = this.Fq.sub(this.Fq.mul(m, this.Fq.sub(P.x, x)), P.y);
        return { x, y };
    }
    sub(P, Q) {
        return this.add(P, this.neg(Q));
    }
    neg(P) {
        if (this.is_zero(P))
            return this.zero;
        return { x: this.Fq.mod(P.x), y: this.Fq.neg(P.y) };
    }
    escalarMul(P, k) {
        if (k === 0n)
            return this.zero;
        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }
        let R = P;
        let binary = k.toString(2);
        for (let i = 1; i < binary.length; i++) {
            R = this.add(R, R);
            if (binary[i] === "1") {
                R = this.add(R, P);
            }
        }
        return R;
    }
}
exports.EllipticCurveOverFqOverFq = EllipticCurveOverFqOverFq;
function embedding_degree(Fp, r) {
    let k = 1n;
    while ((Fp.p ** k - 1n) % r !== 0n) {
        k += 1n;
    }
    return k;
}
exports.embedding_degree = embedding_degree;
// Tests
// const Fp = new PrimeField(11n);
// const E = new EllipticCurveOverFp(0n, 4n, Fp);
// const r = 3n;
// const k = E.embedding_degree(r);
// console.log(k);
// const Fp = new PrimeField(11n);
// const E = new EllipticCurveOverFp(7n, 2n, Fp);
// const r = 7n;
// const k = E.embedding_degree(r);
// console.log(k);
// export class EllipticCurve<T extends FiniteField<U>, U> {
//     readonly a: bigint;
//     readonly b: bigint;
//     readonly F: PrimeField;
//     constructor(a: bigint, b: bigint, field: PrimeField) {
//         const four = field instanceof PrimeField ? 4n : [4n];
//         const ts = field instanceof PrimeField ? 27n : [27n];
//         const firstSummand = field.mul(four as U, field.exp(a, 3n));
//         const secondSummand = field.mul(ts as U, field.exp(b, 2n));
//         const sum = field.add(firstSummand, secondSummand);
//         if (field.eq(sum, field.zero)) {
//             throw new Error("The curve is singular, choose another a and b");
//         }
//         this.a = a;
//         this.b = b;
//         this.F = field;
//     }
//     // Public Accessors
//     get zero(): null {
//         return null;
//     }
//     // Check if a Point is the identity element
//     is_zero(P: PointOverFp): boolean {
//         return P === this.zero;
//     }
//     // Check that a point is on the curve defined by y² == x³ + a·x + b
//     is_on_curve(P: PointOverFp): boolean {
//         if (this.is_zero(P)) {
//             return true;
//         }
//         const left_side = this.F.exp(P.y, 2n);
//         const right_side = this.F.add(
//             this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)),
//             this.b
//         );
//         return this.F.eq(left_side, right_side);
//     }
//     // Basic Arithmetic
//     add(P: PointOverFp, Q: PointOverFp): PointOverFp {
//         if (this.is_zero(P)) return Q;
//         if (this.is_zero(Q)) return P;
//         if (P.x === Q.x) {
//             if (P.y !== Q.y) {
//                 // P = -Q
//                 return this.zero;
//             }
//         }
//         let m: bigint;
//         const three = this.F instanceof PrimeField ? 3n : [3n];
//         const two = this.F instanceof PrimeField ? 2n : [2n];
//         if (P.x === Q.x && P.y === Q.y) {
//             m = this.F.div(
//                 this.F.add(this.F.mul(three as U, this.F.mul(P.x, P.x)), this.a),
//                 this.F.mul(two as U, P.y)
//             );
//         } else {
//             m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
//         }
//         const x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
//         const y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
//         return { x, y };
//     }
//     sub(P: PointOverFp, Q: PointOverFp): PointOverFp {
//         return this.add(P, this.neg(Q));
//     }
//     neg(P: PointOverFp): PointOverFp {
//         if (this.is_zero(P)) return this.zero;
//         return { x: PrimeFieldhis.F.mod(P.x), y: PrimeFieldhis.F.neg(P.y) };
//     }
//     escalarMul(P: PointOverFp, k: bigint): PointOverFp {
//         if (k === 0n) return this.zero;
//         if (k < 0n) {
//             k = -k;
//             P = this.neg(P);
//         }
//         let R = P;
//         let binary = k.toString(2);
//         for (let i = 1; i < binary.length; i++) {
//             R = this.add(R, R);
//             if (binary[i] === "1") {
//                 R = this.add(R, P);
//             }
//         }
//         return R;
//     }
//     embedding_degree(): number {
//         let k = 1
//         while (this.F.exp(this.F.p, k) !== this.F.one) {
//             k += 1
//         }
//         return k;
//     }
//     // Fix this
//     // twist(P: PointFq, w2: bigint[], w3: bigint[]): PointFq {
//     //     if (this.is_zero(P)) return this.zero;
//     //     // Field isomorphism from Fp[X]/(X²) to Fp[X]/(X² - 18·X + 82)
//     //     let xcoeffs = [
//     //         this.F.Fp.sub(P.x[0], this.F.Fp.mul(9n, P.x[1])),
//     //         P.x[1],
//     //     ];
//     //     let ycoeffs = [
//     //         this.F.Fp.sub(P.y[0], this.F.Fp.mul(9n, P.y[1])),
//     //         P.y[1],
//     //     ];
//     //     // Isomorphism into subfield of Fp[X]/(w¹² - 18·w⁶ + 82),
//     //     // where w⁶ = X
//     //     let nx = [xcoeffs[0], 0n, 0n, 0n, 0n, 0n, xcoeffs[1]];
//     //     let ny = [ycoeffs[0], 0n, 0n, 0n, 0n, 0n, ycoeffs[1]];
//     //     // Divide x coord by w² and y coord by w³
//     //     let x = this.F.div(nx, w2);
//     //     let y = this.F.div(ny, w3);
//     //     return { x, y };
//     // }
// }
//# sourceMappingURL=ellipticCurve.js.map