"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E12 = exports.tG2 = exports.G2 = exports.tE = exports.b2 = exports.a2 = exports.EFast = exports.G1 = exports.E = exports.Fp12b = exports.Fp4 = exports.Fp12a = exports.Fp6 = exports.Fp12 = exports.Fp2 = exports.Fp = exports.xi = void 0;
const ellipticCurve_1 = require("../ellipticCurve");
const extensionField_1 = require("../extensionField");
const primeField_1 = require("../primeField");
const common_1 = require("./common");
const constants_1 = require("./constants");
// BN254 curve parameters
// https://hackmd.io/kcEJAWISQ56eE6YpBnurgw
// Field Extensions
// export const beta = -1n; // quadratic non-residue in Fp
exports.xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
exports.Fp = new primeField_1.PrimeField(constants_1.p);
exports.Fp2 = new extensionField_1.ExtensionField(exports.Fp, [1n, 0n, 1n]);
exports.Fp12 = new extensionField_1.ExtensionFieldOverFq(exports.Fp2, [
    exports.Fp2.neg(exports.xi),
    [0n],
    [0n],
    [0n],
    [0n],
    [0n],
    [1n, 0n],
]);
// Fp12 defined as a tower of field extensions
exports.Fp6 = new extensionField_1.ExtensionFieldOverFq(exports.Fp2, [exports.Fp2.neg(exports.xi), [0n], [0n], [1n]]);
exports.Fp12a = new extensionField_1.ExtensionFieldOverFqOverFq(exports.Fp6, [[[0n], [-1n, 0n], [0n]], [[0n], [0n], [0n]], [[1n], [0n], [0n]]]);
exports.Fp4 = new extensionField_1.ExtensionFieldOverFq(exports.Fp2, [exports.Fp2.neg(exports.xi), [0n], [1n]]);
exports.Fp12b = new extensionField_1.ExtensionFieldOverFqOverFq(exports.Fp4, [[[0n], [-1n, 0n]], [[0n], [0n]], [[0n], [0n]], [[1n], [0n]]]);
// Curve E: y² = x³ + 3 over Fp
exports.E = new ellipticCurve_1.EllipticCurveOverFp(0n, 3n, exports.Fp);
// Generator of E(Fp)[r] = E(Fp)
exports.G1 = { x: 1n, y: 2n };
// More performant implementation of scalar multiplication for BN254
class BN254 extends ellipticCurve_1.EllipticCurveOverFp {
    endomorphism(P) {
        const x = this.Fp.mul(P.x, constants_1.beta);
        const y = P.y;
        return { x, y };
    }
    escalarMulGLV(P, k, w = 2) {
        if (k === 0n)
            return this.zero;
        if (k < 0n) {
            k = -k;
            P = this.neg(P);
        }
        const [k1, k2] = (0, common_1.split_scalar_endo)(k, constants_1.r);
        const eP = this.endomorphism(P);
        return this.doubleScalarMul(P, k1, eP, k2, w);
    }
}
exports.EFast = new BN254(0n, 3n, exports.Fp);
// Twisted curve E': y² = x³ + 3/xi over Fp2
exports.a2 = [0n];
exports.b2 = exports.Fp2.div([3n, 0n], exports.xi);
exports.tE = new ellipticCurve_1.EllipticCurveOverFq(exports.a2, exports.b2, exports.Fp2);
// Generator of E'(Fp2)[r]
exports.G2 = {
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
exports.tG2 = {
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
exports.E12 = new ellipticCurve_1.EllipticCurveOverFqOverFq([[0n]], [[3n]], exports.Fp12);
//# sourceMappingURL=parameters.js.map