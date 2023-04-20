"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("./primeField");
const parameters_1 = require("./BN254/parameters");
const constants_1 = require("./BN254/constants");
const polynomials_1 = require("./polynomials");
const optimal_ate_pairing_1 = require("./BN254/optimal_ate_pairing");
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
    const [srs1] = srs;
    const d = (0, polynomials_1.degree)(pol);
    if (d >= srs1.length) {
        throw new Error("The polynomial degree is too large");
    }
    let com = E.zero;
    for (let i = 0; i <= d; i++) {
        com = E.add(com, E.escalarMul(srs1[i], pol[i]));
    }
    return com;
}
class Prover {
    E;
    srs;
    pol;
    Fr;
    RPr;
    // messages: any[];
    verifier_challenges;
    verbose;
    // Constructor
    constructor(E, r, srs, pol, verbose = false) {
        const Fr = new primeField_1.PrimeField(r); // the scalar field of E
        const RPr = new polynomials_1.RingOfPolynomials(r); // the ring of polynomials over Fr
        this.E = E;
        this.Fr = Fr;
        this.RPr = RPr;
        this.srs = srs;
        this.pol = pol;
        // this.messages = [];
        this.verifier_challenges = [];
        this.verbose = verbose;
    }
    commit_and_send_initial_polynomial(V) {
        const polcom = commit_polynomial(this.E, this.srs, this.pol);
        // this.messages.push(polcom);
        V.receive_message(polcom);
    }
    // Computes and sends z = we + x (mod r)
    compute_and_send_evaluation_and_proof(V) {
        // pol(z) = y
        const z = this.verifier_challenges[0];
        const y = this.RPr.eval(this.pol, z);
        // q = (pol - y)/(x - z)
        const numerator = this.RPr.sub(this.pol, [y]);
        const denominator = this.RPr.sub([this.Fr.zero, this.Fr.one], [z]);
        const q = this.RPr.div(numerator, denominator);
        // proof pi = [q(s)]_1
        const pi = commit_polynomial(this.E, this.srs, q);
        V.receive_message(y);
        V.receive_message(pi);
    }
    receive_challenge(c) {
        this.verifier_challenges.push(c);
        if (this.verbose) {
            console.log(`P received challenge ${c}`);
        }
    }
}
class Verifier {
    E;
    tE;
    srs;
    Fr;
    prover_messages;
    challenges;
    verbose;
    // Constructor
    constructor(E, tE, r, srs, verbose = false) {
        const Fr = new primeField_1.PrimeField(r); // the scalar field of E
        const [srs1, srs2] = srs;
        const srs_pruned = [
            srs1[0],
            srs2[0],
            srs2[1],
        ];
        this.E = E;
        this.tE = tE;
        this.Fr = Fr;
        this.srs = srs_pruned; // The verifier only needs [1]_1, [1]_2, [s]_2
        this.prover_messages = [];
        this.challenges = [];
        this.verbose = verbose;
    }
    receive_message(m) {
        this.prover_messages.push(m);
        if (this.verbose) {
            console.log(`V received message ${m}`);
        }
    }
    compute_and_send_challenge(P) {
        const z = bigintRnd(this.Fr.p);
        this.challenges.push(z);
        P.receive_challenge(z);
    }
    // Checks that e(pi,[s]_2-[z]_2) = e(polcom - [y]_1,[1]_2) <==> e(-pi,[s]_2-[z]_2) · e([pol(s)]_1 - [y]_1,[1]_2) = 1
    verify() {
        const E = this.E;
        const z = this.challenges[0];
        const polcom = this.prover_messages[0];
        const y = this.prover_messages[1];
        const pi = this.prover_messages[2];
        const npi = E.neg(pi);
        const zcom = parameters_1.tE.escalarMul(this.srs[1], z);
        const ycom = E.escalarMul(this.srs[0], y);
        const input12 = parameters_1.tE.sub(this.srs[2], zcom);
        const input21 = E.sub(polcom, ycom);
        const result = (0, optimal_ate_pairing_1.verify_pairing_identity)([npi, input21], [input12, this.srs[1]]);
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
const srs = srs_mock(parameters_1.E, parameters_1.tE, parameters_1.G1, parameters_1.G2, constants_1.r, 4n);
const pol = [10n, 2n, -3n, -4n];
const P = new Prover(parameters_1.E, constants_1.r, srs, pol);
const V = new Verifier(parameters_1.E, parameters_1.tE, constants_1.r, srs);
P.commit_and_send_initial_polynomial(V);
V.compute_and_send_challenge(P);
P.compute_and_send_evaluation_and_proof(V);
V.verify();
//# sourceMappingURL=KZG.js.map