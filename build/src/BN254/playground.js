"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extensionField_1 = require("../extensionField");
const primeField_1 = require("../primeField");
// Test 1: Optimal Ate Pairing over BN12-254
// https://hackmd.io/@jpw/bn254
const x = 4965661367192848881n;
const t = 6n * x ** 2n + 1n; // This is not necessary at all
const p = 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n;
const r = 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n;
// Field Extensions
const beta = -1n; // quadratic non-residue in Fp
const xi = [9n, 1n]; // quadratic and cubic non-residue in Fp2
const Fp = new primeField_1.PrimeField(p);
const Fp2 = new extensionField_1.ExtensionField(Fp, [-beta, 0n, 1n]);
const Fp6 = new extensionField_1.ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [0n], [1n, 0n]]);
const Fp12a = new extensionField_1.ExtensionFieldOverFqOverFq(Fp6, [[[0n, 0n], [1n, 0n], [0n, 0n]], [[0n]], [[1n, 0n], [0n, 0n], [0n, 0n]]]);
const Fp12b = new extensionField_1.ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [0n], [0n], [0n], [0n], [1n, 0n]]);
const a = [[1n, 2n], [3n, 4n], [5n, 6n], [2n, 3n]];
console.log(Fp12a.degree);
console.log(Fp12b.degree);
// const Fp12 = new ExtensionFieldOverFq(Fp6, [xi, [0n], [0n], [1n, 0n]]);
//# sourceMappingURL=playground.js.map