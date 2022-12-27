// import { expect } from "chai";
// import { EllipticCurve, Point } from "../src/elliptic_curves";
// import { PrimeField } from "../src/primeField";
// import { ExtensionField } from "../src/extensionField";

// let Fp: PrimeField;
// let Fq: ExtensionField;
// let E: EllipticCurve;

// describe("EllipticCurve", () => {
//     describe("is_zero()", () => {
//         const tests = [
//             {
//                 P: { x: 0n, y: 0n },
//             },
//             {
//                 P: { x: 1n, y: 0n },
//             },
//         ];

//         [0n, 2n, 5n].forEach((a) => {
//             [0n, 2n, 5n].forEach((b) => {
//                 [7n, 11n, 13n].forEach((p) => {
//                     describe(`a = ${a}, b = ${b}, p = ${p}`, () => {
//                         beforeEach(() => {
//                             Fp = new PrimeField(p);
//                             E = new EllipticCurve(a, b, Fp);
//                         });

//                         tests.forEach(({ P }) => {
//                             it(`should return true if P = ${P}`, () => {
//                                 expect(E.is_zero(P)).to.be.false;
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });

//     describe("is_on_curve()", () => {
//         const tests = [
//             {
//                 P: { x: 0n, y: 0n },
//             },
//             {
//                 P: { x: 1n, y: 0n },
//             },
//         ];

//         [0n, 2n, 5n].forEach((a) => {
//             [0n, 2n, 5n].forEach((b) => {
//                 [7n, 11n, 13n].forEach((p) => {
//                     describe(`a = ${a}, b = ${b}, p = ${p}`, () => {
//                         beforeEach(() => {
//                             Fp = new PrimeField(p);
//                             E = new EllipticCurve(a, b, Fp);
//                         });

//                         tests.forEach(({ P }) => {
//                             it(`should return true if P = ${P}`, () => {
//                                 expect(E.is_zero(P)).to.be.false;
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// });
