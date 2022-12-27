import { FiniteField } from "./finiteField";
import { PrimeField } from "./primeField";
import { ExtensionField } from "./extensionField";

interface Point<U> {
    x: U;
    y: U;
}

// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are Fp elements
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
export class EllipticCurve<T extends FiniteField<U>, U> {
    readonly a: U;
    readonly b: U;
    readonly F: T;

    constructor(a: U, b: U, field: T) {
        const firstSummand = field.mul(4n as U, field.exp(a, 3n));
        const secondSummand = field.mul(27n as U, field.exp(b, 2n));
        const sum = field.add(firstSummand, secondSummand);
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
    is_zero(P: Point<U>): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve defined by y² == x³ + a·x + b
    is_on_curve(P: Point<U>): boolean {
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
    add(P: Point<U>, Q: Point<U>): Point<U> {
        if (this.is_zero(P)) return Q;

        if (this.is_zero(Q)) return P;

        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }

        let m: U;
        if (P.x === Q.x && P.y === Q.y) {
            m = this.F.div(
                this.F.add(this.F.mul(3n as U, this.F.mul(P.x, P.x)), this.a),
                this.F.mul(2n as U, P.y)
            );
        } else {
            m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
        }

        const x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
        const y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
        return { x, y };
    }

    sub(P: Point<U>, Q: Point<U>): Point<U> {
        return this.add(P, this.neg(Q));
    }

    neg(P: Point<U>): Point<U> {
        if (this.is_zero(P)) return this.zero;

        return { x: this.F.mod(P.x), y: this.F.neg(P.y) };
    }

    escalarMul(P: Point<U>, k: bigint): Point<U> {
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
