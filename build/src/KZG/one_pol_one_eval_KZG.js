"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("../primeField");
const parameters_1 = require("../BN254/parameters");
const constants_1 = require("../BN254/constants");
const polynomials_1 = require("../polynomials");
const optimal_ate_pairing_1 = require("../BN254/optimal_ate_pairing");
const common_1 = require("./common");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
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
        const polcom = (0, common_1.commit_polynomial)(this.E, this.srs, this.pol);
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
        const pi = (0, common_1.commit_polynomial)(this.E, this.srs, q);
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
const srs = (0, common_1.srs_mock)(parameters_1.E, parameters_1.tE, parameters_1.G1, parameters_1.G2, constants_1.r, 4n);
const pol = [10n, 2n, -3n, -4n];
const P = new Prover(parameters_1.E, constants_1.r, srs, pol);
const V = new Verifier(parameters_1.E, parameters_1.tE, constants_1.r, srs);
P.commit_and_send_initial_polynomial(V);
V.compute_and_send_challenge(P);
P.compute_and_send_evaluation_and_proof(V);
V.verify();
//# sourceMappingURL=one_pol_one_eval_KZG.js.map