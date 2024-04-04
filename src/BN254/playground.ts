import { assert } from "chai";
import { r } from "./constants";
import { E, EFast, tE, E12, G1, G2, Fp12 } from "./parameters";
import { optimal_ate_bn254, twist } from "./optimal_ate_pairing";

// Test 1: Optimal Ate Pairing over BN12-254
let tQ = twist(G2, tE);
const R = twist(tE.escalarMul(G2, 77n), tE); // Just to play a little bit
// console.log("R =", tE.escalarMul(G2, 147946756881789318990833708069417712966n));
assert(E12.is_on_curve(tQ), "The twist is not working");
assert(E12.is_on_curve(R), "The twist is not working");

const P = G1;
const Q = G2;
const Q2 = tE.escalarMul(Q, 2n);

// Let's check the bilinearity of the pairing
const P2 = E.escalarMul(P, 2n);
const P12 = E.escalarMul(P, 12n);
const Q12 = tE.escalarMul(Q, 12n);

const e1 = optimal_ate_bn254(P2, Q12);
const e2 = Fp12.exp(optimal_ate_bn254(P, Q12), 2n);
const e3 = Fp12.exp(optimal_ate_bn254(P2, Q), 12n);
const e4 = Fp12.exp(optimal_ate_bn254(P, Q), 24n);
const e5 = optimal_ate_bn254(P12, Q2);

assert(
    Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5),
    "The pairing is not bilinear"
);
