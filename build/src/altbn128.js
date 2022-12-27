"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ellipticCurve_1 = require("./ellipticCurve");
const primeField_1 = require("./primeField");
const extensionField_1 = require("./extensionField");
const ALT_BN128_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const p = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
let Fp = new primeField_1.PrimeField(p);
let Fp2 = new extensionField_1.ExtensionField(Fp, [1n, 0n, 1n]);
let Fp12 = new extensionField_1.ExtensionField(Fp, [82n, 0n, 0n, 0n, 0n, 0n, -18n, 0n, 0n, 0n, 0n, 0n, 1n]);
const b = 3n;
const b2 = Fp2.div([3n], [9n, 1n]);
const b12 = [3n];
let Ep = new ellipticCurve_1.EllipticCurve(0n, b, Fp);
let Ep2 = new ellipticCurve_1.EllipticCurve([0n], b2, Fp2);
let Ep12 = new ellipticCurve_1.EllipticCurve([0n], b12, Fp12);
// Generator for curve over Fp
const G1 = { x: 1n, y: 2n };
// Generator for twisted curve over Fp²
const G2 = {
    x: [
        10857046999023057135944570762232829481370756359578518086990519993285655852781n,
        11559732032986387107991004021392285783925812861821192530917403151452391805634n,
    ],
    y: [
        8495653923123431417604973247489272438418190587263600148770280649306958101930n,
        4082367875863433681332203403145435568316851327593401208105741076214120093531n,
    ],
};
// Points are over their respective curves
console.log(Ep.is_on_curve(G1));
const result = Ep2.is_on_curve(G2);
console.log(Ep2.is_on_curve(G2));
let w = [0n, 1n];
// console.log(Fp2.inv(w));
let w2 = Fp12.exp(w, 2n);
let w3 = Fp12.exp(w, 3n);
// let G12 = Ep12.twist(G2, w2, w3);
// // Check that the twist creates a point that is on the curve
// console.log(Ep12.is_on_curve(G12));
//# sourceMappingURL=altbn128.js.map