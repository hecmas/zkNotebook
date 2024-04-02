import { int2wNAF } from "./common";
import { PrimeField } from "./primeField";
import { ExtensionField, ExtensionFieldOverFq } from "./extensionField";

export interface PointOverFp {
    x: bigint;
    y: bigint;
}

export interface PointOverFq {
    x: bigint[];
    y: bigint[];
}

export interface PointOverFqOverFq {
    x: bigint[][];
    y: bigint[][];
}

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
export class EllipticCurveOverFp {
    readonly a: bigint;
    readonly b: bigint;
    readonly Fp: PrimeField;

    constructor(a: bigint, b: bigint, field: PrimeField) {
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
    get zero(): null {
        return null;
    }

    // Comparators
    eq(P: PointOverFp, Q: PointOverFp): boolean {
        return this.Fp.eq(P.x,Q.x) && this.Fp.eq(P.y,Q.y);
    }

    neq(P: PointOverFp, Q: PointOverFp): boolean {
        return !this.eq(P, Q);
    }

    // Check if a point is the identity element
    is_zero(P: PointOverFp): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve
    is_on_curve(P: PointOverFp): boolean {
        if (this.is_zero(P)) {
            return true;
        }

        const left_side = this.Fp.exp(P.y, 2n);
        const right_side = this.Fp.add(
            this.Fp.add(this.Fp.exp(P.x, 3n), this.Fp.mul(this.a, P.x)),
            this.b
        );

        return this.Fp.eq(left_side, right_side);
    }

    // Basic Arithmetic
    add(P: PointOverFp, Q: PointOverFp): PointOverFp {
        if (this.is_zero(P)) return Q;

        if (this.is_zero(Q)) return P;

        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }

        let m: bigint;
        if (P.x === Q.x && P.y === Q.y) {
            m = this.Fp.div(
                this.Fp.add(this.Fp.mul(3n, this.Fp.mul(P.x, P.x)), this.a),
                this.Fp.mul(2n, P.y)
            );
        } else {
            m = this.Fp.div(this.Fp.sub(Q.y, P.y), this.Fp.sub(Q.x, P.x));
        }

        const x = this.Fp.sub(this.Fp.sub(this.Fp.mul(m, m), P.x), Q.x);
        const y = this.Fp.sub(this.Fp.mul(m, this.Fp.sub(P.x, x)), P.y);
        return { x, y };
    }

    double(P: PointOverFp): PointOverFp {
        if (this.is_zero(P)) return this.zero;

        let m = this.Fp.div(
            this.Fp.add(this.Fp.mul(3n, this.Fp.mul(P.x, P.x)), this.a),
            this.Fp.mul(2n, P.y)
        );

        const x = this.Fp.sub(this.Fp.sub(this.Fp.mul(m, m), P.x), P.x);
        const y = this.Fp.sub(this.Fp.mul(m, this.Fp.sub(P.x, x)), P.y);
        return { x, y };
    }

    sub(P: PointOverFp, Q: PointOverFp): PointOverFp {
        return this.add(P, this.neg(Q));
    }

    neg(P: PointOverFp): PointOverFp {
        if (this.is_zero(P)) return this.zero;

        return { x: this.Fp.mod(P.x), y: this.Fp.neg(P.y) };
    }

    escalarMul(P: PointOverFp, k: bigint): PointOverFp {
        if (k === 0n) return this.zero;

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

    escalarMulwNAF(P: PointOverFp, k: bigint, w: number = 2): PointOverFp {
        if (k === 0n) return this.zero;

        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }

        // Precompute a table containing the points [-2ʷ⁻¹ + 1]P, ..., -3P, -P, P, 3P, 5P, ..., [2ʷ⁻¹ - 1]P
        // This requires 1 doubling and 2ʷ⁻² - 1 additions
        let P2 = this.double(P);
        let Ptable: {[key: string]: PointOverFp} = {"-1": this.neg(P), "1": P};
        for (let i = 1 ; i < 2**(w-1) - 1; i += 2) {
            const iP = this.add(Ptable[i], P2);
            Ptable[i+2] = iP;
            Ptable[-i-2] = this.neg(iP);
        }

        let R: PointOverFp = this.zero;
        let kwNAF = int2wNAF(k, w);
        // This requires kwNAF.length doubling and, on average, kwNAF.length/w additions
        for (let i = kwNAF.length - 1; i >= 0; i--) {
            R = this.double(R);
            if (kwNAF[i] !== 0) {
                R = this.add(R, Ptable[kwNAF[i]]);
            }
        }

        return R;
    }

    doubleScalarMul(P: PointOverFp, k: bigint, Q: PointOverFp, l: bigint, w: number = 2): PointOverFp {
        if (k === 0n && l === 0n) {
            return this.zero;
        } else if (k === 0n) {
            return this.escalarMulwNAF(Q, l, w);
        } else if (l === 0n) {
            return this.escalarMulwNAF(P, k, w);
        }

        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }
        if (l < 0n) {
            l = -l;
            Q = this.neg(Q);
        }

        // I need to compute a table with kP + lQ for odd k,l in [-2ʷ⁻¹ + 1, 2ʷ⁻¹ - 1]
        let Ptable: {[key: string]: PointOverFp} = {"-1": this.neg(P), "1": P};
        let Qtable: {[key: string]: PointOverFp} = {"-1": this.neg(Q), "1": Q};
        let PQtable: {[key: string]: PointOverFp};

        // 1] Compute kP and lQ separately
        const P2 = this.double(P);
        const Q2 = this.double(Q);
        for (let i = 1; i < 2**(w-1) - 1; i += 2) {
            const iP = this.add(Ptable[i], P2);
            Ptable[i+2] = iP;
            Ptable[-i-2] = this.neg(iP);

            const iQ = this.add(Qtable[i], Q2);
            Qtable[i+2] = iQ;
            Qtable[-i-2] = this.neg(iQ);
        }

        // // 2] Compute the cross additions
        // for (let i = -(2**(w-1)) + 1; i <= 2**(w-1) - 1; i += 2) {
        //     for (let j = -(2**(w-1)) + 1; j <= 2**(w-1) - 1; j += 2) {
        //         const iPjQ = this.add(Ptable[i], Qtable[j]);
        //         const ij = String(i) + String(j);
        //         const nij = String(-i-j);
        //         PQtable[[i,j]] = iPjQ;
        //         PQtable[-i-j] = this.neg(iPjQ);
        //     }
        // }

        let kwNAF = int2wNAF(k, w);
        let lwNAF = int2wNAF(l, w);
        let len = Math.max(kwNAF.length, lwNAF.length);
        if (kwNAF.length < len) {
            kwNAF = kwNAF.concat(Array(len - kwNAF.length).fill(0));
        } else if (lwNAF.length < len) {
            lwNAF = lwNAF.concat(Array(len - lwNAF.length).fill(0));
        }

        let R: PointOverFp = this.zero;
        for (let i = kwNAF.length - 1; i >= 0; i--) {
            R = this.double(R);
            if (kwNAF[i] !== 0 && lwNAF[i] === 0) {
                R = this.add(R, Ptable[kwNAF[i]]);
            } else if (kwNAF[i] === 0 && lwNAF[i] !== 0) {
                R = this.add(R, Qtable[lwNAF[i]]);
            } else if (kwNAF[i] !== 0 && lwNAF[i] !== 0) {
                R = this.add(R, this.add(Ptable[kwNAF[i]], Qtable[lwNAF[i]]));
            }
        }

        return R;
    }
}

// /*
//     * Elliptic curve over Fq
//     * y² = x³ + a·x + b
//     * a, b are Fq elements
//     * 4·a³ + 27·b² != 0
//     * q is a prime power
//     */
export class EllipticCurveOverFq {
    readonly a: bigint[];
    readonly b: bigint[];
    readonly Fq: ExtensionField;

    constructor(a: bigint[], b: bigint[], field: ExtensionField) {
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
    get zero(): null {
        return null;
    }

    // Comparators
    eq(P: PointOverFq, Q: PointOverFq): boolean {
        return this.Fq.eq(P.x,Q.x) && this.Fq.eq(P.y,Q.y);
    }

    neq(P: PointOverFq, Q: PointOverFq): boolean {
        return !this.eq(P, Q);
    }

    // Check if a point is the identity element
    is_zero(P: PointOverFq): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve
    is_on_curve(P: PointOverFq): boolean {
        if (this.is_zero(P)) {
            return true;
        }

        const left_side = this.Fq.exp(P.y, 2n);
        const right_side = this.Fq.add(
            this.Fq.add(this.Fq.exp(P.x, 3n), this.Fq.mul(this.a, P.x)),
            this.b
        );

        return this.Fq.eq(left_side, right_side);
    }

    // Basic Arithmetic
    add(P: PointOverFq, Q: PointOverFq): PointOverFq {
        if (this.is_zero(P)) return Q;

        if (this.is_zero(Q)) return P;

        if (this.Fq.eq(P.x, Q.x)) {
            if (this.Fq.neq(P.y, Q.y)) {
                // P = -Q
                return this.zero;
            }
        }

        let m: bigint[];
        if (this.Fq.eq(P.x, Q.x) && this.Fq.eq(P.y, Q.y)) {
            m = this.Fq.div(
                this.Fq.add(this.Fq.mul([3n], this.Fq.mul(P.x, P.x)), this.a),
                this.Fq.mul([2n], P.y)
            );
        } else {
            m = this.Fq.div(this.Fq.sub(Q.y, P.y), this.Fq.sub(Q.x, P.x));
        }

        const x = this.Fq.sub(this.Fq.sub(this.Fq.mul(m, m), P.x), Q.x);
        const y = this.Fq.sub(this.Fq.mul(m, this.Fq.sub(P.x, x)), P.y);
        return { x, y };
    }

    sub(P: PointOverFq, Q: PointOverFq): PointOverFq {
        return this.add(P, this.neg(Q));
    }

    neg(P: PointOverFq): PointOverFq {
        if (this.is_zero(P)) return this.zero;

        return { x: this.Fq.mod(P.x), y: this.Fq.neg(P.y) };
    }

    escalarMul(P: PointOverFq, k: bigint): PointOverFq {
        if (k === 0n) return this.zero;

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

// /*
//     * Elliptic curve over Fq
//     * y² = x³ + a·x + b
//     * a, b are Fq elements
//     * 4·a³ + 27·b² != 0
//     * q is a prime power
//     */
export class EllipticCurveOverFqOverFq {
    readonly a: bigint[][];
    readonly b: bigint[][];
    readonly Fq: ExtensionFieldOverFq;

    constructor(a: bigint[][], b: bigint[][], field: ExtensionFieldOverFq) {
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
    get zero(): null {
        return null;
    }

    // Comparators
    eq(P: PointOverFqOverFq, Q: PointOverFqOverFq): boolean {
        return this.Fq.eq(P.x,Q.x) && this.Fq.eq(P.y,Q.y);
    }

    neq(P: PointOverFqOverFq, Q: PointOverFqOverFq): boolean {
        return !this.eq(P, Q);
    }

    // Check if a point is the identity element
    is_zero(P: PointOverFqOverFq): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve
    is_on_curve(P: PointOverFqOverFq): boolean {
        if (this.is_zero(P)) {
            return true;
        }

        const left_side = this.Fq.exp(P.y, 2n);
        const right_side = this.Fq.add(
            this.Fq.add(this.Fq.exp(P.x, 3n), this.Fq.mul(this.a, P.x)),
            this.b
        );

        return this.Fq.eq(left_side, right_side);
    }

    // Basic Arithmetic
    add(P: PointOverFqOverFq, Q: PointOverFqOverFq): PointOverFqOverFq {
        if (this.is_zero(P)) return Q;

        if (this.is_zero(Q)) return P;

        if (this.Fq.eq(P.x, Q.x)) {
            if (this.Fq.neq(P.y, Q.y)) {
                // P = -Q
                return this.zero;
            }
        }

        let m: bigint[][];
        if (this.Fq.eq(P.x, Q.x) && this.Fq.eq(P.y, Q.y)) {
            m = this.Fq.div(
                this.Fq.add(this.Fq.mul([[3n]], this.Fq.mul(P.x, P.x)), this.a),
                this.Fq.mul([[2n]], P.y)
            );
        } else {
            m = this.Fq.div(this.Fq.sub(Q.y, P.y), this.Fq.sub(Q.x, P.x));
        }

        const x = this.Fq.sub(this.Fq.sub(this.Fq.mul(m, m), P.x), Q.x);
        const y = this.Fq.sub(this.Fq.mul(m, this.Fq.sub(P.x, x)), P.y);
        return { x, y };
    }

    sub(P: PointOverFqOverFq, Q: PointOverFqOverFq): PointOverFqOverFq {
        return this.add(P, this.neg(Q));
    }

    neg(P: PointOverFqOverFq): PointOverFqOverFq {
        if (this.is_zero(P)) return this.zero;

        return { x: this.Fq.mod(P.x), y: this.Fq.neg(P.y) };
    }

    escalarMul(P: PointOverFqOverFq, k: bigint): PointOverFqOverFq {
        if (k === 0n) return this.zero;

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

export function embedding_degree(Fp: PrimeField, r: bigint): bigint {
    let k = 1n;
    while ((Fp.p ** k - 1n) % r !== 0n) {
        k += 1n;
    }

    return k;
}

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
