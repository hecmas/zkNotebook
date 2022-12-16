import { PrimeField } from "./primeFields";
import { ExtensionField } from "./extensionFields";

interface PointFp {
    x: bigint;
    y: bigint;
}

interface PointFq {
    x: bigint[];
    y: bigint[];
}

// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are Fp elements
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
export class EllipticCurveFp {
    readonly a: bigint;
    readonly b: bigint;
    readonly F: PrimeField;

    constructor(a: bigint, b: bigint, field: PrimeField) {
        const first_summand = field.mul(4n, field.exp(a, 3n));
        const second_summan = field.mul(27n, field.exp(b, 2n));
        const sum = field.add(first_summand, second_summan);
        if (field.eq(sum, field.zero)) {
            throw new Error("The curve is singular, choose another a and b");
        }

        this.a = a;
        this.b = b;
        this.F = field;
    }

    // Public Accessors
    get zero(): null {
        return null;
    }

    // Check if a Point is the identity element
    is_zero(P: PointFp): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve defined by y² == x³ + a·x + b
    is_on_curve(P: PointFp): boolean {
        if (this.is_zero(P)) {
            return true;
        }

        const left_side = this.F.exp(P.y, 2n);
        const right_side = this.F.add(
            this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)),
            this.b
        );

        return left_side === right_side;
    }

    // Basic Arithmetic
    add(P: PointFp, Q: PointFp): PointFp {
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
            m = this.F.div(
                this.F.add(this.F.mul(3n, this.F.mul(P.x, P.x)), this.a),
                this.F.mul(2n, P.y)
            );
        } else {
            m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
        }

        const x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
        const y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
        return { x, y };
    }

    sub(P: PointFp, Q: PointFp): PointFp {
        return this.add(P, this.neg(Q));
    }

    neg(P: PointFp): PointFp {
        if (this.is_zero(P)) return this.zero;

        return { x: this.F.mod(P.x), y: this.F.neg(P.y) };
    }

    escalarMul(P: PointFp, k: bigint): PointFp {
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
//     * q is a power of a prime
//     */
export class EllipticCurveFq {
    readonly a: bigint[];
    readonly b: bigint[];
    readonly F: ExtensionField;

    constructor(a: bigint[], b: bigint[], field: ExtensionField) {
        const first_summand = field.mul([4n], field.exp(a, 3n));
        const second_summan = field.mul([27n], field.exp(b, 2n));
        const sum = field.add(first_summand, second_summan);
        if (field.eq(sum, field.zero)) {
            throw new Error("The curve is singular, choose another a and b");
        }

        this.a = a;
        this.b = b;
        this.F = field;
    }

    // Public Accessors
    get zero(): null {
        return null;
    }

    // Check if a point is the identity element
    is_zero(P: PointFq): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve defined by y² == x³ + a·x + b
    is_on_curve(P: PointFq): boolean {
        if (this.is_zero(P)) {
            return true;
        }

        const left_side = this.F.exp(P.y, 2n);
        const right_side = this.F.add(
            this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)),
            this.b
        );

        return this.F.eq(left_side, right_side);
    }

    // Basic Arithmetic
    add(P: PointFq, Q: PointFq): PointFq {
        if (this.is_zero(P)) return Q;

        if (this.is_zero(Q)) return P;

        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }

        let m: bigint[];
        if (P.x === Q.x && P.y === Q.y) {
            m = this.F.div(
                this.F.add(this.F.mul([3n], this.F.mul(P.x, P.x)), this.a),
                this.F.mul([2n], P.y)
            );
        } else {
            m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
        }

        const x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
        const y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
        return { x, y };
    }

    sub(P: PointFq, Q: PointFq): PointFq {
        return this.add(P, this.neg(Q));
    }

    neg(P: PointFq): PointFq {
        if (this.is_zero(P)) return this.zero;

        return { x: this.F.mod(P.x), y: this.F.neg(P.y) };
    }

    escalarMul(P: PointFq, k: bigint): PointFq {
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

    // Fix this
    // twist(P: PointFq, w2: bigint[], w3: bigint[]): PointFq {
    //     if (this.is_zero(P)) return this.zero;

    //     // Field isomorphism from Fp[X]/(X²) to Fp[X]/(X² - 18·X + 82)
    //     let xcoeffs = [
    //         this.F.Fp.sub(P.x[0], this.F.Fp.mul(9n, P.x[1])),
    //         P.x[1],
    //     ];
    //     let ycoeffs = [
    //         this.F.Fp.sub(P.y[0], this.F.Fp.mul(9n, P.y[1])),
    //         P.y[1],
    //     ];
    //     // Isomorphism into subfield of Fp[X]/(w¹² - 18·w⁶ + 82),
    //     // where w⁶ = X
    //     let nx = [xcoeffs[0], 0n, 0n, 0n, 0n, 0n, xcoeffs[1]];
    //     let ny = [ycoeffs[0], 0n, 0n, 0n, 0n, 0n, ycoeffs[1]];

    //     // Divide x coord by w² and y coord by w³
    //     let x = this.F.div(nx, w2);
    //     let y = this.F.div(ny, w3);

    //     return { x, y };
    // }
}

const p =
    21888242871839275222246405745257275088696311157297823662689037894645226208583n;
let Fp = new PrimeField(p);
let Ep = new EllipticCurveFp(0n, 3n, Fp);
console.log(Ep.is_zero({ x: 3n, y: null }));
