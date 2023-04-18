"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("./primeField");
const parameters_1 = require("./BN254/parameters");
const constants_1 = require("./BN254/constants");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
class Prover {
    E;
    G;
    Fr;
    w;
    H;
    messages;
    verifier_challenges;
    // Constructor
    constructor(E, G, Fr) {
        const w = bigintRnd(constants_1.r);
        const H = E.escalarMul(G, w);
        this.E = E;
        this.G = G; // G is the generator of a subgroup of points of E(Fp) of order r, e.g., E(Fp)[r]
        this.Fr = Fr; // r is a prime number
        this.w = w; // "I know w s.t. h = wG" is the Schnorr statement
        this.H = H;
        this.messages = [];
        this.verifier_challenges = [];
    }
    // Computes and sends A = xG, where x is a random number
    compute_and_send_first_message(V) {
        const x = bigintRnd(this.Fr.p);
        const A = this.E.escalarMul(this.G, x);
        this.messages.push(x);
        // this.messages.push(A); // Prover does not need to store a
        V.receive_message(A);
    }
    // Computes and sends z = we + x
    compute_and_send_second_message(V) {
        const Fr = this.Fr;
        const x = this.messages[0];
        const e = this.verifier_challenges[0];
        const z = Fr.add(Fr.mul(this.w, e), x);
        V.receive_message(z);
    }
    receive_challenge(c) {
        this.verifier_challenges.push(c);
        // console.log(`Received challenge ${c}`);
    }
}
class Verifier {
    E;
    G;
    Fr;
    H;
    prover_messages;
    challenges;
    // Constructor
    constructor(E, G, Fr, H) {
        this.E = E;
        this.G = G; // G is a generator of the group of points of E
        this.Fr = Fr;
        this.H = H; // Received from the prover before the protocol starts
        this.prover_messages = [];
        this.challenges = [];
    }
    receive_message(m) {
        this.prover_messages.push(m);
        // console.log(`Received message ${m}`);
    }
    compute_and_send_challenge(P) {
        const e = bigintRnd(this.Fr.p);
        this.challenges.push(e);
        P.receive_challenge(e);
    }
    // Checks that A + eH = zG
    verify() {
        const E = this.E;
        const G = this.G;
        const H = this.H;
        const Fr = this.Fr;
        const e = this.challenges[0];
        const A = this.prover_messages[0];
        const z = this.prover_messages[1];
        const LHS = E.add(E.escalarMul(H, e), A);
        const RHS = E.escalarMul(G, z);
        const result = Fr.eq(LHS.x, RHS.x) && Fr.eq(LHS.y, RHS.y);
        if (result) {
            console.log("Verification succeeded");
            return true;
        }
        else {
            throw new Error("Verification failed");
        }
    }
}
// Main
const Fr = new primeField_1.PrimeField(constants_1.r);
const P = new Prover(parameters_1.E, parameters_1.G1, Fr);
const V = new Verifier(parameters_1.E, parameters_1.G1, Fr, P.H);
P.compute_and_send_first_message(V);
V.compute_and_send_challenge(P);
P.compute_and_send_second_message(V);
V.verify();
//# sourceMappingURL=schnoor_sigma_protocol.js.map