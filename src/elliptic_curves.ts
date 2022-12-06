import { PrimeField } from "./primeFields";
import { ExtensionField } from "./extensionFields";

export interface Point {
    x: bigint | bigint[];
    y: bigint | bigint[];
}

// /*
//     * Elliptic curve over Fp
//     * y² = x³ + a·x + b
//     * a, b are integers
//     * 4·a³ + 27·b² != 0
//     * p is prime
//     */
export class EllipticCurve {
    readonly a: bigint | bigint[];
    readonly b: bigint | bigint[];
    readonly F: PrimeField | ExtensionField;

    constructor(
        a: bigint | bigint[],
        b: bigint | bigint[],
        field: PrimeField | ExtensionField
    ) {
        // const first_summand = field.mul(4n,field.exp(a, 3n));
        // const second_summan = field.mul(27n,field.exp(b, 2n));
        // const sum = field.add(first_summand, second_summan);
        // if (field.eq(sum, 0n)) {
        //     throw new Error("The curve is singular, choose another a and b");
        // }

        this.a = a;
        this.b = b;
        this.F = field;
    }

    // Public Accessors
    get zero(): null {
        return null;
    }

    // Check if a point is the identity element
    is_zero(P: Point): boolean {
        return P === this.zero;
    }

    // Check that a point is on the curve defined by y² == x³ + a·x + b
    is_on_curve(P: Point): boolean {
        if (this.is_zero(P)) {
            return true;
        }

        if (
            typeof P.x === "bigint" &&
            typeof P.y === "bigint" &&
            typeof this.a === "bigint" &&
            typeof this.b === "bigint" &&
            this.F instanceof PrimeField
        ) {
            const left_side = this.F.exp(P.y, 2n);
            const right_side = this.F.add(
                this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)),
                this.b
            );

            return left_side === right_side;
        } else if (
            typeof P.x === "object" &&
            typeof P.y === "object" &&
            typeof this.a === "object" &&
            typeof this.b === "object" &&
            this.F instanceof ExtensionField
        ) {
            const left_side = this.F.exp(P.y, 2n);
            const right_side = this.F.add(
                this.F.add(this.F.exp(P.x, 3n), this.F.mul(this.a, P.x)),
                this.b
            );

            return this.F.eq(left_side, right_side);
        }
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

        if (
            typeof P.x === "bigint" &&
            typeof P.y === "bigint" &&
            typeof Q.x === "bigint" &&
            typeof Q.y === "bigint" &&
            typeof this.a === "bigint" &&
            typeof this.b === "bigint" &&
            this.F instanceof PrimeField
        ) {
            let m: bigint;
            if (P.x === Q.x && P.y === Q.y) {
                m = this.F.div(
                    this.F.add(this.F.mul(3n, this.F.mul(P.x, P.x)), this.a),
                    this.F.mul(2n, P.y)
                );
            } else {
                m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
            }

            let x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
            let y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
            return { x, y };
        } else if (
            typeof P.x === "object" &&
            typeof P.y === "object" &&
            typeof Q.x === "object" &&
            typeof Q.y === "object" &&
            typeof this.a === "object" &&
            typeof this.b === "object" &&
            this.F instanceof ExtensionField
        ) {
            let m: bigint[];
            if (P.x === Q.x && P.y === Q.y) {
                m = this.F.div(
                    this.F.add(this.F.mul([3n], this.F.mul(P.x, P.x)), this.a),
                    this.F.mul([2n], P.y)
                );
            } else {
                m = this.F.div(this.F.sub(Q.y, P.y), this.F.sub(Q.x, P.x));
            }

            let x = this.F.sub(this.F.sub(this.F.mul(m, m), P.x), Q.x);
            let y = this.F.sub(this.F.mul(m, this.F.sub(P.x, x)), P.y);
            return { x, y };
        }
    }

    sub(P: Point, Q: Point): Point {
        return this.add(P, this.neg(Q));
    }

    neg(P: Point): Point {
        if (this.is_zero(P)) return this.zero;

        if (typeof P.y === "bigint" && this.F instanceof PrimeField) {
            return { x: P.x, y: this.F.neg(P.y) };
        } else if (
            typeof P.y === "object" &&
            this.F instanceof ExtensionField
        ) {
            return { x: P.x, y: this.F.neg(P.y) };
        }
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

    // Fix this
    twist(P: Point, w2: bigint[], w3: bigint[]): Point {
        if (this.is_zero(P)) return this.zero;

        if (
            typeof P.x === "object" &&
            typeof P.y === "object" &&
            this.F instanceof ExtensionField
        ) {
            // Field isomorphism from Fp[X]/(X²) to Fp[X]/(X² - 18·X + 82)
            let xcoeffs = [
                this.F.Fp.sub(P.x[0], this.F.Fp.mul(9n, P.x[1])),
                P.x[1],
            ];
            let ycoeffs = [
                this.F.Fp.sub(P.y[0], this.F.Fp.mul(9n, P.y[1])),
                P.y[1],
            ];
            // Isomorphism into subfield of Fp[X]/(w¹² - 18·w⁶ + 82),
            // where w⁶ = X
            let nx = [xcoeffs[0], 0n, 0n, 0n, 0n, 0n, xcoeffs[1]];
            let ny = [ycoeffs[0], 0n, 0n, 0n, 0n, 0n, ycoeffs[1]];

            // Divide x coord by w² and y coord by w³
            let x = this.F.div(nx, w2);
            let y = this.F.div(ny, w3);

            return { x, y };
        }
    }
}

const p =
    21888242871839275222246405745257275088696311157297823662689037894645226208583n;
let Fp = new PrimeField(p);
let Ep = new EllipticCurve(0n, 3n, Fp);
console.log(Ep.is_zero({x: 3n, y: null}));
