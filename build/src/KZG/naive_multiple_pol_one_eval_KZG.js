"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const primeField_1 = require("../primeField");
const parameters_1 = require("../BN254/parameters");
const constants_1 = require("../BN254/constants");
const univariatePolynomialRing_1 = require("../univariatePolynomialRing");
const optimal_ate_pairing_1 = require("../BN254/optimal_ate_pairing");
const common_1 = require("./common");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
class Prover {
    E;
    srs;
    pols;
    Fr;
    RPr;
    messages;
    verifier_challenges;
    verbose;
    // Constructor
    constructor(E, r, srs, pols, verbose = false) {
        const Fr = new primeField_1.PrimeField(r); // the scalar field of E
        const RPr = new univariatePolynomialRing_1.UnivariatePolynomialRing(r); // the ring of polynomials over Fr
        this.E = E;
        this.Fr = Fr;
        this.RPr = RPr;
        this.srs = srs;
        this.pols = pols;
        this.messages = [];
        this.verifier_challenges = [];
        this.verbose = verbose;
    }
    commit_and_send_initial_polynomials(V) {
        let polcoms = [];
        for (const pol of this.pols) {
            const polcom = (0, common_1.commit_polynomial)(this.E, this.srs, pol);
            // this.messages.push(polcom);
            polcoms.push(polcom);
        }
        V.receive_message(polcoms);
    }
    // computes pol(z) = y for each pol in this.pols
    compute_and_send_evaluations(V) {
        const z = this.verifier_challenges[0];
        let evals = [];
        for (const pol of this.pols) {
            const y = this.RPr.eval(pol, z);
            this.messages.push(y);
            evals.push(y);
        }
        V.receive_message(evals);
    }
    // computes [(pol_ - y_i)/(x - z)]_1 for each pol in this.pols
    compute_and_send_proofs(V) {
        const z = this.verifier_challenges[0];
        const pis = [];
        for (let i = 0; i < this.pols.length; i++) {
            const pol = this.pols[i];
            const y = this.messages[i];
            const numerator = this.RPr.sub(pol, [y]);
            const denominator = this.RPr.sub([this.Fr.zero, this.Fr.one], [z]);
            const q = this.RPr.div(numerator, denominator);
            // proof pi = [q(s)]_1
            const pi = (0, common_1.commit_polynomial)(this.E, this.srs, q);
            pis.push(pi);
        }
        V.receive_message(pis);
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
        const c = bigintRnd(this.Fr.p);
        this.challenges.push(c);
        P.receive_challenge(c);
    }
}
// Main
const srs = (0, common_1.srs_mock)(parameters_1.E, parameters_1.tE, parameters_1.G1, parameters_1.G2, constants_1.r, 10n);
const pol1 = [10n, 2n, -3n, -4n];
const pol2 = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
// const pol3 = [7n, 6n, 5n, 4n, 3n, 2n, 1n];
// const pol4 = [99n];
// const pol5 = [-3n, 67n, 1024n, 0n, -999n, 0n]
const P = new Prover(parameters_1.E, constants_1.r, srs, [pol1, pol2]);
const V = new Verifier(parameters_1.E, parameters_1.tE, constants_1.r, srs);
P.commit_and_send_initial_polynomials(V);
V.compute_and_send_challenge(P);
P.compute_and_send_evaluations(V);
V.compute_and_send_challenge(P);
P.compute_and_send_proofs(V);
const z = V.challenges[0];
const gamma = V.challenges[1];
const polcoms = V.prover_messages[0];
const yis = V.prover_messages[1];
const pis = V.prover_messages[2];
const zcom = parameters_1.tE.escalarMul(V.srs[1], z);
const y1com = parameters_1.E.escalarMul(V.srs[0], yis[0]);
const y2com = parameters_1.E.escalarMul(V.srs[0], yis[1]);
const input11 = pis[0];
const input12 = parameters_1.tE.sub(V.srs[2], zcom);
const input21 = parameters_1.E.escalarMul(pis[1], gamma);
const input22 = parameters_1.tE.sub(V.srs[2], zcom);
const input31 = parameters_1.E.sub(polcoms[0], y1com);
const input32 = V.srs[1];
const input41 = parameters_1.E.escalarMul(parameters_1.E.sub(polcoms[1], y2com), gamma);
const input42 = V.srs[1];
console.log("inputs11", input11);
console.log("inputs12", input12);
console.log("inputs21", input21);
console.log("inputs22", input22);
console.log("inputs31", parameters_1.E.neg(input31));
console.log("inputs32", input32);
console.log("inputs41", parameters_1.E.neg(input41));
console.log("inputs42", input42);
const result = (0, optimal_ate_pairing_1.verify_pairing_identity)([input11, input21, parameters_1.E.neg(input31), parameters_1.E.neg(input41)], [input12, input22, input32, input42]);
console.log(result);
// V.verify();
//# sourceMappingURL=naive_multiple_pol_one_eval_KZG.js.map