import { expect } from "chai";
import { EllipticCurve, Point } from "../src/elliptic_curves";
import { PrimeField } from "../src/primeFields";
import { ExtensionField } from "../src/extensionFields";

let Fp: PrimeField;
let Fq: ExtensionField;
let E: EllipticCurve;


describe("EllipticCurve", () => {
    describe("is_zero()", () => {
        const tests = [
            { 
                P: { x: 0n, y: 0n },

            },
            {
                P: { x: 1n, y: 0n },
            }       
        ];

        [
            {
                a: 0n,
                b: 7n,
                p: 7n,
            },
            {
                a: 0n,
                b: 0n,
                p: 7n,
            }

        ].forEach(({ a,b,p }) => {
            describe(`a = ${a}, b = ${b}, p = ${p}`, () => {
                beforeEach(() => {
                    Fp = new PrimeField(p);
                    E = new EllipticCurve(a, b, Fp);
                });

                tests.forEach(({ P }) => {
                    it(`should return true if P = ${P}`, () => {
                        console.log(P);
                        expect(E.is_zero(P)).to.be.false;
                    });
                });
            });
        });
    });
});