import {
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    PointOverFp,
    PointOverFq,
} from "../ellipticCurve";
import { PrimeField } from "../primeField";
import { E, tE, G1, G2 } from "../BN254/parameters";
import { r } from "../BN254/constants";
import { RingOfPolynomials } from "../polynomials";
import { verify_pairing_identity } from "../BN254/optimal_ate_pairing";
import { commit_polynomial, srs_mock } from "./common";

const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

class Prover {
    readonly E: EllipticCurveOverFp;
    readonly srs: [PointOverFp[], PointOverFq[]];
    readonly pol: bigint[];
    readonly Fr: PrimeField;
    readonly RPr: RingOfPolynomials;
    // messages: any[];
    verifier_challenges: bigint[];
    readonly verbose: boolean;

    // Constructor
    constructor(
        E: EllipticCurveOverFp,
        r: bigint,
        srs: [PointOverFp[], PointOverFq[]],
        pol: bigint[],
        verbose: boolean = false
    ) {
        const Fr = new PrimeField(r); // the scalar field of E
        const RPr = new RingOfPolynomials(r); // the ring of polynomials over Fr

        this.E = E;
        this.Fr = Fr;
        this.RPr = RPr;
        this.srs = srs;
        this.pol = pol;
        // this.messages = [];
        this.verifier_challenges = [];
        this.verbose = verbose;
    }

    commit_and_send_initial_polynomial(V: Verifier) {
        const polcom = commit_polynomial(this.E, this.srs, this.pol);
        // this.messages.push(polcom);
        V.receive_message(polcom);
    }

    // Computes and sends z = we + x (mod r)
    compute_and_send_evaluation_and_proof(V: Verifier) {
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
        const z = bigintRnd(this.Fr.p);
        this.challenges.push(z);
        P.receive_challenge(z);
    }

    // Checks that e(pi,[s]_2-[z]_2) = e(polcom - [y]_1,[1]_2) <==> e(-pi,[s]_2-[z]_2) · e([pol(s)]_1 - [y]_1,[1]_2) = 1
    verify(): boolean {
        const E = this.E;

        const z: bigint = this.challenges[0];
        const polcom: PointOverFp = this.prover_messages[0];
        const y: bigint = this.prover_messages[1];
        const pi: PointOverFp = this.prover_messages[2];
        const npi = E.neg(pi);

        const zcom = tE.escalarMul(this.srs[1], z);
        const ycom = E.escalarMul(this.srs[0], y);

        const input12 = tE.sub(this.srs[2], zcom);
        const input21 = E.sub(polcom, ycom);

        const result = verify_pairing_identity(
            [npi, input21],
            [input12, this.srs[1]]
        );

        if (result) {
            console.log("Verification succeeded");
            return true;
        } else {
            throw new Error("Verification failed");
        }
    }
}

// Main
const srs = srs_mock(E, tE, G1, G2, r, 4n);
const pol = [10n, 2n, -3n, -4n];
const P = new Prover(E, r, srs, pol);
const V = new Verifier(E, tE, r, srs);

P.commit_and_send_initial_polynomial(V);
V.compute_and_send_challenge(P);
P.compute_and_send_evaluation_and_proof(V);
V.verify();
