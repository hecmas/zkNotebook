"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E12 = exports.G2 = exports.tE = exports.G1 = exports.E = exports.Fp12_o6 = exports.Fp12_o4 = exports.Fp12_o2 = exports.Fp6 = exports.Fp4 = exports.Fp2 = exports.Fp = void 0;
const constants_1 = require("./constants");
const primeField_1 = require("../primeField");
const extensionField_1 = require("../extensionField");
const ellipticCurve_1 = require("../ellipticCurve");
// BLS12381 curve parameters: https://hackmd.io/4gg0L936QsGdvSwZOjonlQ?view
// Field Extensions
exports.Fp = new primeField_1.PrimeField(constants_1.p);
exports.Fp2 = new extensionField_1.ExtensionField(exports.Fp, [exports.Fp.neg(constants_1.beta), 0n, 1n]); // modulus: x² - beta
exports.Fp4 = new extensionField_1.ExtensionFieldOverFq(exports.Fp2, [exports.Fp2.neg(constants_1.xi), [0n], [1n]]); // modulus: x² - xi
exports.Fp6 = new extensionField_1.ExtensionFieldOverFq(exports.Fp2, [exports.Fp2.neg(constants_1.xi), [0n], [0n], [1n]]); // modulus: x³ - xi
exports.Fp12_o2 = new extensionField_1.ExtensionFieldOverFq(exports.Fp2, [exports.Fp2.neg(constants_1.xi), [0n], [0n], [0n], [0n], [0n], [1n, 0n]]); // modulus: x⁶ - xi
exports.Fp12_o4 = new extensionField_1.ExtensionFieldOverFqOverFq(exports.Fp4, [[[0n], [-1n, 0n]], [[0n], [0n]], [[0n], [0n]], [[1n], [0n]]]);
exports.Fp12_o6 = new extensionField_1.ExtensionFieldOverFqOverFq(exports.Fp6, [[[0n], [-1n, 0n], [0n]], [[0n], [0n], [0n]], [[1n], [0n], [0n]]]);
// Elliptic Curves and its generators
// Curve E: y² = x³ + 4 over Fp
exports.E = new ellipticCurve_1.EllipticCurveOverFp(0n, 4n, exports.Fp);
// Generator of E(Fp)[r]
exports.G1 = {
    x: 3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507n,
    y: 1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569n,
};
// Twisted curve E': y'² = x'³ + 4·(1+u) over Fp2
exports.tE = new ellipticCurve_1.EllipticCurveOverFq([0n], exports.Fp2.mul([4n, 0n], constants_1.xi), exports.Fp2);
// Generator of E'(Fp2)[r]
exports.G2 = {
    x: [
        352701069587466618187139116011060144890029952792775240219908644239793785735715026873347600343865175952761926303160n,
        3059144344244213709971259814753781636986470325476647558659373206291635324768958432433509563104347017837885763365758n,
    ],
    y: [
        1985150602287291935568054521177171638300868978215655730859378665066344726373823718423869104263333984641494340347905n,
        927553665492332455747201965776037880757740193453592970025027978793976877002675564980949289727957565575433344219582n,
    ],
};
// Curve E: y² = x³ + 4 over Fp12
exports.E12 = new ellipticCurve_1.EllipticCurveOverFqOverFq([[0n]], [[4n]], exports.Fp12_o2);
//# sourceMappingURL=parameters.js.map