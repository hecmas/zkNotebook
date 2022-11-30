import { PrimeField } from "./primeField";

interface Point {
    x: bigint;
    y: bigint;
}

// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are integers
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
class EllipticCurve {
    readonly a: bigint;
    readonly b: bigint;
    readonly p: bigint;
    readonly Fp: PrimeField;

    constructor(a: bigint, b: bigint, p: bigint) {
        this.a = a;
        this.b = b;
        this.p = p;
        this.Fp = new PrimeField(p);
    }

    // Public Accessors
    get zero(): Point {
        return { x: 0n, y: 0n }; // point at infinity, check how to represent it in the general case
    }

    // Basic Arithmetic
    add(P: Point, Q: Point): Point {
        if (P === this.zero) return Q;

        if (Q === this.zero) return P;

        if (P.x === Q.x) {
            if (P.y !== Q.y) {
                // P = -Q
                return this.zero;
            }
        }

        let m: bigint;
        if (P === Q) {
            m = this.Fp.div(
                this.Fp.add(this.Fp.mul(3n, this.Fp.mul(P.x, P.x)), this.a),
                this.Fp.mul(2n, P.y)
            );
        } else {
            m = this.Fp.div(this.Fp.sub(Q.y, P.y), this.Fp.sub(Q.x, P.x));
        }

        let x = this.Fp.sub(this.Fp.sub(this.Fp.mul(m, m), P.x), Q.x);
        let y = this.Fp.sub(this.Fp.mul(m, this.Fp.sub(P.x, x)), P.y);

        return { x, y };
    }

    sub(P: Point, Q: Point): Point {
        return this.add(P, this.neg(Q));
    }

    neg(P: Point): Point {
        return { x: P.x, y: this.Fp.neg(P.y) };
    }

    escalarMul(P: Point, k: bigint): Point {
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
