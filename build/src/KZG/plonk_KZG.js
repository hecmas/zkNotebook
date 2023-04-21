"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("../primeField");
const parameters_1 = require("../BN254/parameters");
const constants_1 = require("../BN254/constants");
const polynomials_1 = require("../polynomials");
const optimal_ate_pairing_1 = require("../BN254/optimal_ate_pairing");
const common_1 = require("./common");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
// TODO: It is very naively implemented, improve it!
class Prover {
    E;
    srs;
    pols1;
    pols2;
    Fr;
    RPr;
    messages;
    verifier_challenges;
    verbose;
    // Constructor
    constructor(E, r, srs, pols1, pols2, verbose = false) {
        const Fr = new primeField_1.PrimeField(r); // the scalar field of E
        const RPr = new polynomials_1.RingOfPolynomials(r); // the ring of polynomials over Fr
        this.E = E;
        this.Fr = Fr;
        this.RPr = RPr;
        this.srs = srs;
        this.pols1 = pols1;
        this.pols2 = pols2;
        this.messages = [[], []];
        this.verifier_challenges = [];
        this.verbose = verbose;
    }
    commit_and_send_initial_polynomials(V) {
        let polcoms1 = [];
        for (const pol of this.pols1) {
            const polcom = (0, common_1.commit_polynomial)(this.E, this.srs, pol);
            // this.messages.push(polcom);
            polcoms1.push(polcom);
        }
        V.receive_message(polcoms1);
        let polcoms2 = [];
        for (const pol of this.pols2) {
            const polcom = (0, common_1.commit_polynomial)(this.E, this.srs, pol);
            // this.messages.push(polcom);
            polcoms2.push(polcom);
        }
        V.receive_message(polcoms2);
    }
    // computes pol(z) = y for each pol in this.pols
    compute_and_send_evaluations(V) {
        const z1 = this.verifier_challenges[0];
        const z2 = this.verifier_challenges[1];
        let evals1 = [];
        for (const pol of this.pols1) {
            const y1 = this.RPr.eval(pol, z1);
            evals1.push(y1);
        }
        this.messages[0] = evals1;
        V.receive_message(evals1);
        let evals2 = [];
        for (const pol of this.pols2) {
            const y2 = this.RPr.eval(pol, z2);
            evals2.push(y2);
        }
        this.messages[1] = evals2;
        V.receive_message(evals2);
    }
    compute_and_send_proofs(V) {
        const z1 = this.verifier_challenges[0];
        const z2 = this.verifier_challenges[1];
        const gamma1 = this.verifier_challenges[2];
        const gamma2 = this.verifier_challenges[3];
        // q1 = sum_i gamma1^i · (pol1_i - y1_i)/(x - z1) = 1/(x - z1) · (sum_i gamma1^i · (pol1_i - y1_i))
        let numerator1 = this.RPr.zero;
        for (let i = 0; i < this.pols1.length; i++) {
            const pol = this.pols1[i];
            const y = this.messages[0][i];
            const exponent = this.Fr.exp(gamma1, BigInt(i));
            const numerator_i = this.RPr.mul([exponent], this.RPr.sub(pol, [y]));
            numerator1 = this.RPr.add(numerator1, numerator_i);
        }
        const denominator1 = this.RPr.sub([this.Fr.zero, this.Fr.one], [z1]);
        const q1 = this.RPr.div(numerator1, denominator1);
        // proof pi = [q(s)]_1
        const pi1 = (0, common_1.commit_polynomial)(this.E, this.srs, q1);
        V.receive_message(pi1);
        // q2 = sum_i gamma2^i · (pol2_i - y2_i)/(x - z2) = 1/(x - z2) · (sum_i gamma2^i · (pol2_i - y2_i))
        let numerator2 = this.RPr.zero;
        for (let i = 0; i < this.pols2.length; i++) {
            const pol = this.pols2[i];
            const y = this.messages[1][i];
            const exponent = this.Fr.exp(gamma2, BigInt(i));
            const numerator_i = this.RPr.mul([exponent], this.RPr.sub(pol, [y]));
            numerator2 = this.RPr.add(numerator2, numerator_i);
        }
        const denominator2 = this.RPr.sub([this.Fr.zero, this.Fr.one], [z2]);
        const q2 = this.RPr.div(numerator2, denominator2);
        // proof pi = [q(s)]_2
        const pi2 = (0, common_1.commit_polynomial)(this.E, this.srs, q2);
        V.receive_message(pi2);
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
    compute_and_send_two_challenges(P) {
        const c1 = bigintRnd(this.Fr.p);
        const c2 = bigintRnd(this.Fr.p);
        this.challenges.push(c1);
        this.challenges.push(c2);
        P.receive_challenge(c1);
        P.receive_challenge(c2);
    }
    // Computes [F(s)]_1 = sum_i gamma1^i · polcom1_i  + r · (sum_j gamma2^j · polcom2_j)
    //                 Y = sum_i gamma1^i · y1_i + r · (sum_j gamma2^j · y2_j)
    // Then, checks that:
    // e(-pi1 -r·pi2,[s]_2) · e([F(s)]_1 - [Y]_1 + z1·pi1 + r·z2·pi2,[1]_2) = 1
    verify() {
        const Fr = this.Fr;
        const E = this.E;
        const r = bigintRnd(Fr.p);
        const z1 = this.challenges[0];
        const z2 = this.challenges[1];
        const gamma1 = this.challenges[2];
        const gamma2 = this.challenges[3];
        const polcoms1 = this.prover_messages[0];
        const polcoms2 = this.prover_messages[1];
        const yis1 = this.prover_messages[2];
        const yis2 = this.prover_messages[3];
        const pi1 = this.prover_messages[4];
        const pi2 = this.prover_messages[5];
        let Fcom = E.zero;
        let Y = Fr.zero;
        for (let i = 0; i < polcoms2.length; i++) {
            const polcom = polcoms2[i];
            const yi = yis2[i];
            const exponent = Fr.exp(gamma2, BigInt(i));
            const Fcom_i = E.escalarMul(polcom, exponent);
            Fcom = E.add(Fcom, Fcom_i);
            Y = Fr.add(Y, Fr.mul(yi, exponent));
        }
        Fcom = E.escalarMul(Fcom, r);
        Y = Fr.mul(Y, r);
        for (let i = 0; i < polcoms1.length; i++) {
            const polcom = polcoms1[i];
            const yi = yis1[i];
            const exponent = Fr.exp(gamma1, BigInt(i));
            const Fcom_i = E.escalarMul(polcom, exponent);
            Fcom = E.add(Fcom, Fcom_i);
            Y = Fr.add(Y, Fr.mul(yi, exponent));
        }
        // e(-pi1 -r·pi2,[s]_2) · e([F(s)]_1 - [Y]_1 + z1·pi1 + r·z2·pi2,[1]_2) = 1
        const input11 = E.neg(E.add(E.escalarMul(pi2, r), pi1));
        const Ycom = E.escalarMul(this.srs[0], Y);
        const pi1pi2 = E.add(E.escalarMul(pi1, z1), E.escalarMul(pi2, Fr.mul(r, z2)));
        const input21 = E.add(E.sub(Fcom, Ycom), pi1pi2);
        const result = (0, optimal_ate_pairing_1.verify_pairing_identity)([input11, input21], [this.srs[2], this.srs[1]]);
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
const srs = (0, common_1.srs_mock)(parameters_1.E, parameters_1.tE, parameters_1.G1, parameters_1.G2, constants_1.r, 10n);
const pol1 = [10n, 2n, -3n, -4n];
const pol2 = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
const pol3 = [7n, 6n, 5n, 4n, 3n, 2n, 1n];
const pol4 = [99n];
const pol5 = [-3n, 67n, 1024n, 0n, -999n, 0n];
const P = new Prover(parameters_1.E, constants_1.r, srs, [pol1, pol2, pol3], [pol4, pol5]);
const V = new Verifier(parameters_1.E, parameters_1.tE, constants_1.r, srs);
P.commit_and_send_initial_polynomials(V);
V.compute_and_send_two_challenges(P);
P.compute_and_send_evaluations(V);
V.compute_and_send_two_challenges(P);
P.compute_and_send_proofs(V);
V.verify();
//# sourceMappingURL=plonk_KZG.js.map