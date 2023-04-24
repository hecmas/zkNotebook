import {
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    PointOverFp,
    PointOverFq,
} from "../ellipticCurve";
import { PrimeField } from "../primeField";
import { E, tE, G1, G2 } from "../BN254/parameters";
import { r } from "../BN254/constants";
import { RingOfPolynomials, degree } from "../polynomials";
import { verify_pairing_identity } from "../BN254/optimal_ate_pairing";
import { commit_polynomial, srs_mock } from "./common";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

function combine_polynomials(pols: bigint[][]): bigint[] {
    const n = pols.length;
    let maxdegree = 0;
    for (let i = 0; i < n; i++) {
        const d = degree(pols[i]);
        if (d > maxdegree) {
            maxdegree = d;
        }
    }

    let polsn = new Array<bigint>(n * (maxdegree + 1)).fill(0n);
    for (let i = 0; i < n; i++) {
        const d = degree(pols[i]);
        for (let j = 0; j <= d; j++) {
            polsn[i + n * j] = pols[i][j];
        }
    }

    return polsn;
}

// TODO: It is very naively implemented, improve it!

class Prover {
    readonly E: EllipticCurveOverFp;
    readonly srs: [PointOverFp[], PointOverFq[]];
    readonly pols1: bigint[][];
    readonly pols2: bigint[][];
    readonly Fr: PrimeField;
    readonly RPr: RingOfPolynomials;
    messages: [bigint[], bigint[], bigint[], bigint[]];
    verifier_challenges: bigint[];
    readonly verbose: boolean;

    // Constructor
    constructor(
        E: EllipticCurveOverFp,
        r: bigint,
        srs: [PointOverFp[], PointOverFq[]],
        pols1: bigint[][],
        pols2: bigint[][],
        verbose: boolean = false
    ) {
        const Fr = new PrimeField(r); // the scalar field of E
        const RPr = new RingOfPolynomials(r); // the ring of polynomials over Fr

        this.E = E;
        this.Fr = Fr;
        this.RPr = RPr;
        this.srs = srs;
        this.pols1 = pols1;
        this.pols2 = pols2;
        this.messages = [[], [], [], []];
        this.verifier_challenges = [];
        this.verbose = verbose;
    }

    combine_and_send_commitments_to_initial_polynomials(V: Verifier) {
        const C1 = combine_polynomials(this.pols1);
        const C2 = combine_polynomials(this.pols2);
        this.messages[0] = C1;
        this.messages[1] = C2;

        const C1com = commit_polynomial(this.E, this.srs, C1);
        const C2com = commit_polynomial(this.E, this.srs, C2);
        V.receive_message(C1com);
        V.receive_message(C2com);
    }

    // computes pol(z) = y for each pol in this.pols
    compute_and_send_evaluations(V: Verifier) {
        const z1 = this.verifier_challenges[0];
        const z2 = this.verifier_challenges[1];

        let evals1: bigint[] = [];
        for (const pol of this.pols1) {
            const y1 = this.RPr.eval(pol, z1);
            evals1.push(y1);
        }
        this.messages[2] = evals1;
        V.receive_message(evals1);

        let evals2: bigint[] = [];
        for (const pol of this.pols2) {
            const y2 = this.RPr.eval(pol, z2);
            evals2.push(y2);
        }
        this.messages[3] = evals2;
        V.receive_message(evals2);
    }

    compute_and_send_proofs(V: Verifier) {
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
            const numerator_i = this.RPr.mul(
                [exponent],
                this.RPr.sub(pol, [y])
            );
            numerator1 = this.RPr.add(numerator1, numerator_i);
        }

        const denominator1 = this.RPr.sub([this.Fr.zero, this.Fr.one], [z1]);
        const q1 = this.RPr.div(numerator1, denominator1);

        // proof pi = [q(s)]_1
        const pi1 = commit_polynomial(this.E, this.srs, q1);

        V.receive_message(pi1);

        // q2 = sum_i gamma2^i · (pol2_i - y2_i)/(x - z2) = 1/(x - z2) · (sum_i gamma2^i · (pol2_i - y2_i))
        let numerator2 = this.RPr.zero;
        for (let i = 0; i < this.pols2.length; i++) {
            const pol = this.pols2[i];
            const y: bigint = this.messages[1][i];
            const exponent = this.Fr.exp(gamma2, BigInt(i));
            const numerator_i = this.RPr.mul(
                [exponent],
                this.RPr.sub(pol, [y])
            );
            numerator2 = this.RPr.add(numerator2, numerator_i);
        }

        const denominator2 = this.RPr.sub([this.Fr.zero, this.Fr.one], [z2]);
        const q2 = this.RPr.div(numerator2, denominator2);

        // proof pi = [q(s)]_2
        const pi2 = commit_polynomial(this.E, this.srs, q2);

        V.receive_message(pi2);
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

    compute_and_send_two_challenges(P: Prover) {
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
    verify(): boolean {
        const Fr = this.Fr;
        const E = this.E;

        const r = bigintRnd(Fr.p);

        const z1: bigint = this.challenges[0];
        const z2: bigint = this.challenges[1];
        const gamma1: bigint = this.challenges[2];
        const gamma2: bigint = this.challenges[3];
        const polcoms1: PointOverFp[] = this.prover_messages[0];
        const polcoms2: PointOverFp[] = this.prover_messages[1];
        const yis1: bigint[] = this.prover_messages[2];
        const yis2: bigint[] = this.prover_messages[3];
        const pi1: PointOverFp = this.prover_messages[4];
        const pi2: PointOverFp = this.prover_messages[5];

        let Fcom: PointOverFp = E.zero;
        let Y: bigint = Fr.zero;
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
        const pi1pi2 = E.add(
            E.escalarMul(pi1, z1),
            E.escalarMul(pi2, Fr.mul(r, z2))
        );
        const input21 = E.add(E.sub(Fcom, Ycom), pi1pi2);

        const result = verify_pairing_identity(
            [input11, input21],
            [this.srs[2], this.srs[1]]
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
// const srs = srs_mock(E, tE, G1, G2, r, 10n);
// const pol1 = [10n, 2n, -3n, -4n];
// const pol2 = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
// const pol3 = [7n, 6n, 5n, 4n, 3n, 2n, 1n];
// const pol4 = [99n];
// const pol5 = [-3n, 67n, 1024n, 0n, -999n, 0n];
// const P = new Prover(E, r, srs, [pol1, pol2, pol3], [pol4, pol5]);
// const V = new Verifier(E, tE, r, srs);

// P.compute_and_send_commitments_to_initial_polynomials(V);
// V.compute_and_send_two_challenges(P);
// P.compute_and_send_evaluations(V);
// V.compute_and_send_two_challenges(P);
// P.compute_and_send_proofs(V);
// V.verify();
