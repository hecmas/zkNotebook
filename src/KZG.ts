import {
    EllipticCurveOverFp,
    EllipticCurveOverFq,
    PointOverFp,
    PointOverFq,
} from "./ellipticCurve";
import { PrimeField } from "./primeField";
import { E, tE, G1, G2 } from "./BN254/parameters";
import { r } from "./BN254/constants";
import { degree } from "./extensionField";

const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

// INSECURE: it should be obtained through a MPC protocol
/**
 * @input n: the upper bound of the polynomial degree. I.e. the polynomials that can be committed
 * under this srs have degree in [0, n-1].
 * @returns It outputs `[[1]_1,[s]_1,[s^2]_1,...,[s^{n-1}]_1,[1]_2,[s]_2]`, the srs used in the KZG PCS.
 */
function srs_mock(
    E: EllipticCurveOverFp,
    tE: EllipticCurveOverFq,
    G1: PointOverFp,
    G2: PointOverFq,
    r: bigint,
    n: bigint
): [PointOverFp[], PointOverFq[]] {
    const Fr = new PrimeField(r); // the scalar field of E
    const s = bigintRnd(r);

    let srs1: PointOverFp[] = [];
    for (let i = 0; i < n; i++) {
        const powerofs = Fr.exp(s, BigInt(i));
        srs1.push(E.escalarMul(G1, powerofs));
    }

    let srs2: PointOverFq[] = [];
    srs2.push(G2);
    srs2.push(tE.escalarMul(G2, s));

    return [srs1,srs2];
}

// Assume polynomial p(x) = a0 + a1·x + a2·x^2 + ... + ad·x^d 
// is given as an array of its coefficients [a0, a1, a2, ..., ad]
/**
 * @input pol: a polynomial [a0, a1, a2, ..., ad] of appropriate degree.
 * @returns It outputs the E point `[f(s)]_1 = a0[1]_1 + a1[s]_1 + ... + ad[s^d]_1`.
 */
function commit_polynomial(E: EllipticCurveOverFp, srs: [PointOverFp[], PointOverFq[]], pol: bigint[]) {
    const [srs1,] = srs;
    const d = degree(pol);
    if (d >= srs1.length) {
        throw new Error("The polynomial degree is too large");
    }
    
    let com: PointOverFp = E.zero;
    for (let i = 0; i < d; i++) {
        com = E.add(com, E.escalarMul(srs1[i], pol[i]));
    }

    return com;
}

// Let's implement the open protocol for KZG, which is a (non-)interactive protocol

class Prover {
    readonly E: EllipticCurveOverFp;
    readonly G: PointOverFp;
    readonly Fr: PrimeField;
    readonly w: bigint;
    readonly H: PointOverFp;
    messages: any[];
    verifier_challenges: bigint[];

    // Constructor
    constructor(E: EllipticCurveOverFp, G: PointOverFp, r: bigint) {
        const Fr = new PrimeField(r); // the scalar field of E
        const w: bigint = bigintRnd(r);
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
    compute_and_send_first_message(V: Verifier) {
        const x = bigintRnd(this.Fr.p);
        const A: PointOverFp = this.E.escalarMul(this.G, x);
        this.messages.push(x);
        // this.messages.push(A); // Prover does not need to store a
        V.receive_message(A);
    }

    // Computes and sends z = we + x (mod r)
    compute_and_send_second_message(V: Verifier) {
        const Fr = this.Fr;

        const x = this.messages[0];
        const e = this.verifier_challenges[0];
        const z = Fr.add(Fr.mul(this.w, e), x);
        V.receive_message(z);
    }

    receive_challenge(c: bigint) {
        this.verifier_challenges.push(c);
        // console.log(`Received challenge ${c}`);
    }
}

class Verifier {
    readonly E: EllipticCurveOverFp;
    readonly G: PointOverFp;
    readonly Fr: PrimeField;
    readonly H: PointOverFp;
    prover_messages: any[];
    challenges: bigint[];

    // Constructor
    constructor(
        E: EllipticCurveOverFp,
        G: PointOverFp,
        r: bigint,
        H: PointOverFp
    ) {
        const Fr = new PrimeField(r);
        this.E = E;
        this.G = G; // G is a generator of the group of points of E
        this.Fr = Fr;
        this.H = H; // Received from the prover before the protocol starts
        this.prover_messages = [];
        this.challenges = [];
    }

    receive_message(m: any) {
        this.prover_messages.push(m);
        // console.log(`Received message ${m}`);
    }

    compute_and_send_challenge(P: Prover) {
        const e = bigintRnd(this.Fr.p);
        this.challenges.push(e);
        P.receive_challenge(e);
    }

    // Checks that A + eH = zG over E
    verify(): boolean {
        const E = this.E;
        const G = this.G;
        const H = this.H;
        const Fr = this.Fr;

        const e: bigint = this.challenges[0];
        const A: PointOverFp = this.prover_messages[0];
        const z: bigint = this.prover_messages[1];

        const LHS = E.add(E.escalarMul(H, e), A);
        const RHS = E.escalarMul(G, z);
        const result = Fr.eq(LHS.x, RHS.x) && Fr.eq(LHS.y, RHS.y);
        if (result) {
            console.log("Verification succeeded");
            return true;
        } else {
            throw new Error("Verification failed");
        }
    }
}

// Main
const P = new Prover(E, G1, r);
const V = new Verifier(E, G1, r, P.H);

P.compute_and_send_first_message(V);
V.compute_and_send_challenge(P);
P.compute_and_send_second_message(V);
V.verify();



















const srs = srs_mock(E, tE, G1, G2, r, 10n);
const f = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
console.log(commit_polynomial(E, srs, f));