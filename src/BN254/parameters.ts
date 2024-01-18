import {
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    EllipticCurveOverFqOverFq,
    PointOverFp,
} from "../ellipticCurve";
import { ExtensionField, ExtensionFieldOverFq, ExtensionFieldOverFqOverFq } from "../extensionField";
import { PrimeField } from "../primeField";
import { split_scalar_endo } from "./common";
import { beta, lambda, p, r } from "./constants";

// BN254 curve parameters
// https://hackmd.io/kcEJAWISQ56eE6YpBnurgw

// Field Extensions
// export const beta = -1n; // quadratic non-residue in Fp
export const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
export const Fp = new PrimeField(p);
export const Fp2 = new ExtensionField(Fp, [1n, 0n, 1n]);
export const Fp12 = new ExtensionFieldOverFq(Fp2, [
    Fp2.neg(xi),
    [0n],
    [0n],
    [0n],
    [0n],
    [0n],
    [1n, 0n],
]);

// Fp12 defined as a tower of field extensions
export const Fp6 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [0n], [1n]]);
export const Fp12a = new ExtensionFieldOverFqOverFq(Fp6, [[[0n], [-1n,0n], [0n]], [[0n], [0n], [0n]], [[1n], [0n], [0n]]]);

export const Fp4 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [1n]]);
export const Fp12b = new ExtensionFieldOverFqOverFq(Fp4, [[[0n], [-1n,0n]], [[0n], [0n]], [[0n], [0n]],[[1n], [0n]]]);

// Curve E: y² = x³ + 3 over Fp
export const E = new EllipticCurveOverFp(0n, 3n, Fp);
// Generator of E(Fp)[r] = E(Fp)
export const G1 = { x: 1n, y: 2n };
// More performant implementation of scalar multiplication for BN254
class BN254 extends EllipticCurveOverFp {
    endomorphism(P: PointOverFp): PointOverFp {
        const x = this.Fp.mul(P.x, beta);
        const y = P.y;
        return { x, y };
    }

    escalarMulGLV(P: PointOverFp, k: bigint, w: number = 2): PointOverFp {
        if (k === 0n) return this.zero;

        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }

        const [k1, k2] = split_scalar_endo(k, r);
        const eP = this.endomorphism(P);

        return this.doubleScalarMul(P, k1, eP, k2, w);
    }
}
export const EFast = new BN254(0n, 3n, Fp);

// Twisted curve E': y² = x³ + 3/xi over Fp2
export const a2 = [0n];
export const b2 = Fp2.div([3n, 0n], xi);
export const tE = new EllipticCurveOverFq(a2, b2, Fp2);
// Generator of E'(Fp2)[r]
export const G2 = {
    x: [
        10857046999023057135944570762232829481370756359578518086990519993285655852781n,
        11559732032986387107991004021392285783925812861821192530917403151452391805634n,
    ],
    y: [
        8495653923123431417604973247489272438418190587263600148770280649306958101930n,
        4082367875863433681332203403145435568316851327593401208105741076214120093531n,
    ],
};
// Twist of G2 to E(Fp12)
export const tG2 = {
    x: [
        [0n],
        [0n],
        [
            10857046999023057135944570762232829481370756359578518086990519993285655852781n,
            11559732032986387107991004021392285783925812861821192530917403151452391805634n,
        ],
        [0n],
        [0n],
        [0n],
    ],
    y: [
        [0n],
        [0n],
        [0n],
        [
            8495653923123431417604973247489272438418190587263600148770280649306958101930n,
            4082367875863433681332203403145435568316851327593401208105741076214120093531n,
        ],
        [0n],
        [0n],
    ],
};

// Curve E: y² = x³ + 3 over Fp12
export const E12 = new EllipticCurveOverFqOverFq([[0n]], [[3n]], Fp12);
