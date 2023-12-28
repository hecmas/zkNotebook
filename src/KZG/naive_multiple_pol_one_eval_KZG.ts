import {
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    PointOverFp,
    PointOverFq,
} from "../ellipticCurve";
import { PrimeField } from "../primeField";
import { E, tE, G1, G2 } from "../BN254/parameters";
import { r } from "../BN254/constants";
import { UnivariatePolynomialRing } from "../univariatePolynomialRing";
import { verify_pairing_identity } from "../BN254/optimal_ate_pairing";
import { commit_polynomial, srs_mock } from "./common";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

class Prover {
    readonly E: EllipticCurveOverFp;
    readonly srs: [PointOverFp[], PointOverFq[]];
    readonly pols: bigint[][];
    readonly Fr: PrimeField;
    readonly RPr: UnivariatePolynomialRing;
    messages: any[];
    verifier_challenges: bigint[];
    readonly verbose: boolean;

    // Constructor
    constructor(
        E: EllipticCurveOverFp,
        r: bigint,
        srs: [PointOverFp[], PointOverFq[]],
        pols: bigint[][],
        verbose: boolean = false
    ) {
        const Fr = new PrimeField(r); // the scalar field of E
        const RPr = new UnivariatePolynomialRing(r); // the ring of polynomials over Fr

        this.E = E;
        this.Fr = Fr;
        this.RPr = RPr;
        this.srs = srs;
        this.pols = pols;
        this.messages = [];
        this.verifier_challenges = [];
        this.verbose = verbose;
    }

    commit_and_send_initial_polynomials(V: Verifier) {
        let polcoms = [];
        for (const pol of this.pols) {
            const polcom = commit_polynomial(this.E, this.srs, pol);
            // this.messages.push(polcom);
            polcoms.push(polcom);
        }
        V.receive_message(polcoms);
    }

    // computes pol(z) = y for each pol in this.pols
    compute_and_send_evaluations(V: Verifier) {
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
    compute_and_send_proofs(V: Verifier) {
        const z = this.verifier_challenges[0];

        const pis = [];
        for (let i = 0; i < this.pols.length; i++) {
            const pol = this.pols[i];
            const y: bigint = this.messages[i];
            const numerator = this.RPr.sub(pol, [y]);
            const denominator = this.RPr.sub([this.Fr.zero, this.Fr.one], [z]);
            const q = this.RPr.div(numerator, denominator);

            // proof pi = [q(s)]_1
            const pi = commit_polynomial(this.E, this.srs, q);
            pis.push(pi);
        }

        V.receive_message(pis);
    }

    receive_challenge(c: bigint) {
        this.verifier_challenges.push(c);
        if (this.verbose) {
            console.log(`P received challenge ${c}`);
        }
    }
}

class Verifier {
    readonly E: EllipticCurveOverFp;
    readonly tE: EllipticCurveOverFq;
    readonly srs: [PointOverFp, PointOverFq, PointOverFq];
    readonly Fr: PrimeField;
    prover_messages: any[];
    challenges: bigint[];
    readonly verbose: boolean;

    // Constructor
    constructor(
        E: EllipticCurveOverFp,
        tE: EllipticCurveOverFq,
        r: bigint,
        srs: [PointOverFp[], PointOverFq[]],
        verbose: boolean = false
    ) {
        const Fr = new PrimeField(r); // the scalar field of E

        const [srs1, srs2] = srs;
        const srs_pruned: [PointOverFp, PointOverFq, PointOverFq] = [
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

    receive_message(m: any) {
        this.prover_messages.push(m);
        if (this.verbose) {
            console.log(`V received message ${m}`);
        }
    }

    compute_and_send_challenge(P: Prover) {
        const c = bigintRnd(this.Fr.p);
        this.challenges.push(c);
        P.receive_challenge(c);
    }

    // Computes [F(s)]_1 = sum_i gamma^i · polcom_i and Y = sum_i gamma^i · y_i
    // Then, checks that:
    // e(-pi,[s]_2-[z]_2) · e([F(s)]_1 - [Y]_1,[1]_2) = 1
    // verify(): boolean {
    //     const E = this.E;

    //     const z: bigint = this.challenges[0];
    //     const gamma: bigint = this.challenges[1];
    //     const polcoms: PointOverFp[] = this.prover_messages[0];
    //     const yis: bigint[] = this.prover_messages[1];
    //     const pis: PointOverFp = this.prover_messages[2];
    //     const npi = E.neg(pi);

    //     let Fcom: PointOverFp = E.zero;
    //     let Y: bigint = this.Fr.zero;
    //     for (let i = 0; i < polcoms.length; i++) {
    //         const polcom = polcoms[i];
    //         const yi = yis[i];
    //         const exponent = this.Fr.exp(gamma, BigInt(i));
    //         const Fcom_i = E.escalarMul(polcom, exponent);
    //         Fcom = E.add(Fcom, Fcom_i);
    //         Y = this.Fr.add(Y, this.Fr.mul(yi, exponent));
    //     }

    //     const zcom = tE.escalarMul(this.srs[1], z);
    //     const Ycom = E.escalarMul(this.srs[0], Y);

    //     const input12 = tE.sub(this.srs[2], zcom);
    //     const input21 = E.sub(Fcom, Ycom);

    //     const result = verify_pairing_identity(
    //         [npi, input21],
    //         [input12, this.srs[1]]
    //     );

    //     if (result) {
    //         console.log("Verification succeeded");
    //         return true;
    //     } else {
    //         throw new Error("Verification failed");
    //     }
    // }
}

// Main
const srs = srs_mock(E, tE, G1, G2, r, 10n);
const pol1 = [10n, 2n, -3n, -4n];
const pol2 = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
// const pol3 = [7n, 6n, 5n, 4n, 3n, 2n, 1n];
// const pol4 = [99n];
// const pol5 = [-3n, 67n, 1024n, 0n, -999n, 0n]
const P = new Prover(E, r, srs, [pol1, pol2]);
const V = new Verifier(E, tE, r, srs);

P.commit_and_send_initial_polynomials(V);
V.compute_and_send_challenge(P);
P.compute_and_send_evaluations(V);
V.compute_and_send_challenge(P);
P.compute_and_send_proofs(V);

const z: bigint = V.challenges[0];
const gamma: bigint = V.challenges[1];
const polcoms: PointOverFp[] = V.prover_messages[0];
const yis: bigint[] = V.prover_messages[1];
const pis: PointOverFp[] = V.prover_messages[2];

const zcom = tE.escalarMul(V.srs[1], z);
const y1com = E.escalarMul(V.srs[0], yis[0]);
const y2com = E.escalarMul(V.srs[0], yis[1]);

const input11 = pis[0];
const input12 = tE.sub(V.srs[2], zcom);
const input21 = E.escalarMul(pis[1], gamma);
const input22 = tE.sub(V.srs[2], zcom);
const input31 = E.sub(polcoms[0], y1com);
const input32 = V.srs[1];
const input41 = E.escalarMul(E.sub(polcoms[1], y2com), gamma);
const input42 = V.srs[1];
console.log("inputs11", input11);
console.log("inputs12", input12);
console.log("inputs21", input21);
console.log("inputs22", input22);
console.log("inputs31", E.neg(input31));
console.log("inputs32", input32);
console.log("inputs41", E.neg(input41));
console.log("inputs42", input42);

const result = verify_pairing_identity(
    [input11, input21, E.neg(input31), E.neg(input41)],
    [input12, input22, input32, input42]
);
console.log(result);

// V.verify();
