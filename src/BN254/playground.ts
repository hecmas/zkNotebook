import { assert } from "chai";
import { E, tE, E12, G1, G2, Fp12 } from "./parameters";
import { optimal_ate_bn254, twist } from "./optimal_ate_pairing";

// Test 1: Optimal Ate Pairing over BN12-254
let tQ = twist(G2, tE);
const R = twist(tE.escalarMul(G2, 77n), tE); // Just to play a little bit
assert(E12.is_on_curve(tQ), "The twist is not working");
assert(E12.is_on_curve(R), "The twist is not working");

const P = G1;
const Q = G2;
const e = optimal_ate_bn254(P, Q, Fp12);

// Let's check the bilinearity of the pairing
const P2 = E.escalarMul(P, 2n);
const P12 = E.escalarMul(P, 12n);
const Q2 = tE.escalarMul(Q, 2n);
const Q12 = tE.escalarMul(Q, 12n);
const e1 = optimal_ate_bn254(P2, Q12, Fp12);
const e2 = Fp12.exp(optimal_ate_bn254(P, Q12, Fp12), 2n);
const e3 = Fp12.exp(optimal_ate_bn254(P2, Q, Fp12), 12n);
const e4 = Fp12.exp(optimal_ate_bn254(P, Q, Fp12), 24n);
const e5 = optimal_ate_bn254(P12, Q2, Fp12);

assert(
    Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5),
    "The pairing is not bilinear"
);

// More examples
const P1005 = E.escalarMul(P, 1005n);
const P1788 = E.escalarMul(P, 1788n);
const Q1005 = tE.escalarMul(Q, 1005n);
const Q1788 = tE.escalarMul(Q, 1788n);
const e6 = optimal_ate_bn254(P1005, Q1788, Fp12);
const e7 = Fp12.exp(optimal_ate_bn254(P, Q1788, Fp12), 1005n);
const e8 = Fp12.exp(optimal_ate_bn254(P1005, Q, Fp12), 1788n);
const e9 = Fp12.exp(optimal_ate_bn254(P, Q, Fp12), 1788n * 1005n);
const e10 = optimal_ate_bn254(P1788, Q1005, Fp12);

assert(
    Fp12.eq(e6, e7) && Fp12.eq(e6, e8) && Fp12.eq(e6, e9) && Fp12.eq(e6, e10),
    "The pairing is not bilinear"
);
