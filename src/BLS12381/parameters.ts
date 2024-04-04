import { p, beta, xi } from "./constants";
import { PrimeField } from "../primeField";
import { ExtensionField, ExtensionFieldOverFq, ExtensionFieldOverFqOverFq } from "../extensionField";
import {
    PointOverFp,
    PointOverFq,
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    EllipticCurveOverFqOverFq,
} from "../ellipticCurve";

// BLS12381 curve parameters: https://hackmd.io/4gg0L936QsGdvSwZOjonlQ?view

// Field Extensions
export const Fp = new PrimeField(p);
export const Fp2 = new ExtensionField(Fp, [Fp.neg(beta), 0n, 1n]); // modulus: x² - beta
export const Fp4 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [1n]]); // modulus: x² - xi
export const Fp6 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [0n], [1n]]); // modulus: x³ - xi

export const Fp12_o2 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi),[0n],[0n],[0n],[0n],[0n],[1n, 0n]]); // modulus: x⁶ - xi
export const Fp12_o4 = new ExtensionFieldOverFqOverFq(Fp4, [[[0n], [-1n,0n]], [[0n], [0n]], [[0n], [0n]],[[1n], [0n]]]);
export const Fp12_o6 = new ExtensionFieldOverFqOverFq(Fp6, [[[0n], [-1n,0n], [0n]], [[0n], [0n], [0n]], [[1n], [0n], [0n]]]);

// Elliptic Curves and its generators
// Curve E: y² = x³ + 4 over Fp
export const E = new EllipticCurveOverFp(0n, 4n, Fp);
// Generator of E(Fp)[r]
export const G1: PointOverFp = {
    x: 3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507n,
    y: 1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569n,
};

// Twisted curve E': y'² = x'³ + 4·(1+u) over Fp2
export const tE = new EllipticCurveOverFq([0n], Fp2.mul([4n ,0n], xi), Fp2);
// Generator of E'(Fp2)[r]
export const G2: PointOverFq = {
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
export const E12 = new EllipticCurveOverFqOverFq([[0n]], [[4n]], Fp12_o2);
