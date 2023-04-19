"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("./primeField");
const parameters_1 = require("./BN254/parameters");
const constants_1 = require("./BN254/constants");
const extensionField_1 = require("./extensionField");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
// INSECURE: it should be obtained through a MPC protocol
/**
 * @input n: the upper bound of the polynomial degree. I.e. the polynomials that can be committed
 * under this srs have degree in [0, n-1].
 * @returns It outputs `[[1]_1,[s]_1,[s^2]_1,...,[s^{n-1}]_1,[1]_2,[s]_2]`, the srs used in the KZG PCS.
 */
function srs_mock(E, tE, G1, G2, r, n) {
    const Fr = new primeField_1.PrimeField(r); // the scalar field of E
    const s = bigintRnd(r);
    let srs1 = [];
    for (let i = 0; i < n; i++) {
        const powerofs = Fr.exp(s, BigInt(i));
        srs1.push(E.escalarMul(G1, powerofs));
    }
    let srs2 = [];
    srs2.push(G2);
    srs2.push(tE.escalarMul(G2, s));
    return [srs1, srs2];
}
// Assume polynomial p(x) = a0 + a1·x + a2·x^2 + ... + ad·x^d 
// is given as an array of its coefficients [a0, a1, a2, ..., ad]
/**
 * @input pol: a polynomial [a0, a1, a2, ..., ad] of appropriate degree.
 * @returns It outputs the E point `[f(s)]_1 = a0[1]_1 + a1[s]_1 + ... + ad[s^d]_1`.
 */
function commit_polynomial(E, srs, pol) {
    const [srs1,] = srs;
    const d = (0, extensionField_1.degree)(pol);
    if (d >= srs1.length) {
        throw new Error("The polynomial degree is too large");
    }
    let com = E.zero;
    for (let i = 0; i < d; i++) {
        com = E.add(com, E.escalarMul(srs1[i], pol[i]));
    }
    return com;
}
// Let's implement the open protocol for KZG, which is a (non-)interactive protocol
class Prover {
    E;
    G;
    Fr;
    w;
    H;
    messages;
    verifier_challenges;
    // Constructor
    constructor(E, G, r) {
        const Fr = new primeField_1.PrimeField(r); // the scalar field of E
        const w = bigintRnd(r);
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
    // Computes and sends z = we + x (mod r)
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
    constructor(E, G, r, H) {
        const Fr = new primeField_1.PrimeField(r);
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
    // Checks that A + eH = zG over E
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
const P = new Prover(parameters_1.E, parameters_1.G1, constants_1.r);
const V = new Verifier(parameters_1.E, parameters_1.G1, constants_1.r, P.H);
P.compute_and_send_first_message(V);
V.compute_and_send_challenge(P);
P.compute_and_send_second_message(V);
V.verify();
const srs = srs_mock(parameters_1.E, parameters_1.tE, parameters_1.G1, parameters_1.G2, constants_1.r, 10n);
const f = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
console.log(commit_polynomial(parameters_1.E, srs, f));
//# sourceMappingURL=KZG.js.map