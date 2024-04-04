"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const parameters_1 = require("./parameters");
const optimal_ate_pairing_1 = require("./optimal_ate_pairing");
// Test 1: Optimal Ate Pairing over BN12-254
let tQ = (0, optimal_ate_pairing_1.twist)(parameters_1.G2, parameters_1.tE);
const R = (0, optimal_ate_pairing_1.twist)(parameters_1.tE.escalarMul(parameters_1.G2, 77n), parameters_1.tE); // Just to play a little bit
// console.log("R =", tE.escalarMul(G2, 147946756881789318990833708069417712966n));
(0, chai_1.assert)(parameters_1.E12.is_on_curve(tQ), "The twist is not working");
(0, chai_1.assert)(parameters_1.E12.is_on_curve(R), "The twist is not working");
const P = parameters_1.G1;
const Q = parameters_1.G2;
const Q2 = parameters_1.tE.escalarMul(Q, 2n);
// Let's check the bilinearity of the pairing
const P2 = parameters_1.E.escalarMul(P, 2n);
const P12 = parameters_1.E.escalarMul(P, 12n);
const Q12 = parameters_1.tE.escalarMul(Q, 12n);
const e1 = (0, optimal_ate_pairing_1.optimal_ate_bn254)(P2, Q12);
const e2 = parameters_1.Fp12.exp((0, optimal_ate_pairing_1.optimal_ate_bn254)(P, Q12), 2n);
const e3 = parameters_1.Fp12.exp((0, optimal_ate_pairing_1.optimal_ate_bn254)(P2, Q), 12n);
const e4 = parameters_1.Fp12.exp((0, optimal_ate_pairing_1.optimal_ate_bn254)(P, Q), 24n);
const e5 = (0, optimal_ate_pairing_1.optimal_ate_bn254)(P12, Q2);
(0, chai_1.assert)(parameters_1.Fp12.eq(e1, e2) && parameters_1.Fp12.eq(e1, e3) && parameters_1.Fp12.eq(e1, e4) && parameters_1.Fp12.eq(e1, e5), "The pairing is not bilinear");
//# sourceMappingURL=playground.js.map