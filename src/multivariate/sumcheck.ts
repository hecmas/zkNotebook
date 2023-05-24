import { PrimeField } from "../primeField";
import {
    ArrayMap,
    MultivariatePolynomialRing,
    count_number_of_variables,
    degree,
    degree_j,
} from "./multivariatePolynomialRing";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

// from LSB to MSB
function to_bits(n: bigint, l: number): bigint[] {
    let bits: bigint[] = [];
    for (let i = 0; i < l; i++) {
        bits.push(n & 1n);
        n >>= 1n;
    }
    const diff = l - bits.length;
    for (let i = 0; i < diff; i++) {
        bits.push(0n);
    }
    return bits;
}
// console.log(to_bits(4n, 6));

class Prover {
    readonly Fp: PrimeField;
    readonly MPRp: MultivariatePolynomialRing;
    readonly nvars: number;
    pols: ArrayMap[];
    verifier_challenges: bigint[];
    round: number;
    readonly S: bigint;
    readonly verbose: boolean;

    // Constructor
    constructor(p: bigint, pol: ArrayMap, verbose: boolean = false) {
        const MPRp = new MultivariatePolynomialRing(p); // the ring of polynomials over Fp
        const Fp = MPRp.Fp; // the prime field over which the polynomials are defined

        this.Fp = Fp;
        this.MPRp = MPRp;
        this.nvars = count_number_of_variables(pol);
        this.pols = [pol];
        this.verifier_challenges = [];
        this.round = 1;
        this.verbose = verbose;

        let S = 0n;
        for (let i = 0; i < 2 ** this.nvars; i++) {
            const input = to_bits(BigInt(i), this.nvars);
            const summand = MPRp.eval(pol, input);
            S = Fp.add(S, summand);
        }
        this.S = S;
    }

    compute_and_send_next_polynomial(V: Verifier) {
        const pol = this.pols[this.pols.length - 1];
        const pad = this.nvars - this.round;

        let g_j = new ArrayMap([[[], 0n]]);
        for (let i = 0; i < 2 ** pad; i++) {
            const input = to_bits(BigInt(i), pad);
            const summand = this.MPRp.eval_symbolic(pol, input);
            g_j = this.MPRp.add(g_j, summand);
        }

        // this.messages.push(polcom);
        V.receive_polynomial(g_j);
        this.round += 1;
    }

    receive_challenge(c: bigint) {
        this.verifier_challenges.push(c);
        this.prepare_next_polynomial(c);
        if (this.verbose) {
            console.log(
                `P received challenge r_${this.round - 1} = ${c} in round ${this.round - 1
                }`
            );
        }
    }

    // If the last polynomial was created as the sum over the univariate polynomial g_j(X1,X2,X3,X4),
    // then the next is created as the sum over the univariate polynomial g_{j+1}(X1,X2,X3) = g_j(X1,X2,X3,c)
    // where c is the verifier's challenge.
    prepare_next_polynomial(c: bigint) {
        const current_pol = this.pols[this.pols.length - 1];
        const nvar = count_number_of_variables(current_pol);
        const next_pol = this.MPRp.eval_symbolic(current_pol, [c], nvar - 1);
        this.pols.push(next_pol);
    }
}

class Verifier {
    readonly Fp: PrimeField;
    readonly MPRp: MultivariatePolynomialRing;
    readonly nvars: number;
    readonly pol: ArrayMap;
    readonly S: bigint;
    challenges: bigint[];
    prover_pols: ArrayMap[];
    round: number;
    readonly verbose: boolean;

    // Constructor
    constructor(p: bigint, pol: ArrayMap, S: bigint, verbose: boolean = false) {
        const MPRp = new MultivariatePolynomialRing(p); // the ring of polynomials over Fp
        const Fp = MPRp.Fp; // the prime field over which the polynomials are defined

        this.Fp = Fp;
        this.MPRp = MPRp;
        this.nvars = count_number_of_variables(pol);
        this.pol = pol;
        this.S = S;
        this.challenges = [];
        this.prover_pols = [];
        this.round = 1;
        this.verbose = verbose;

        if (this.verbose) {
            console.log(
                `Starting sumcheck protocol to prove that the sum of ${this.MPRp.toString(
                    this.pol
                )} over the ${this.nvars
                }-dimensionsal boolean hypercube evaluates to ${S}`
            );
        }
    }

    receive_polynomial(p: ArrayMap) {
        this.prover_pols.push(p);
        if (this.verbose) {
            console.log(
                `V received polynomial g_${
                    this.round
                }(X) = ${this.MPRp.toString(p, true)} in round ${this.round}`
            );
        }
    }

    compute_and_send_challenge(P: Prover) {
        const r: bigint = bigintRnd(this.Fp.p);
        this.challenges.push(r);
        P.receive_challenge(r);
        this.round += 1;
    }

    check_gj_is_correct() {
        const gj = this.prover_pols[this.prover_pols.length - 1];
        const deg_gj = degree(gj);
        const deg_j_g = degree_j(this.pol, this.nvars - (this.round - 1));
        if (deg_gj > deg_j_g) {
            throw new Error(
                `Prover sent a polynomial of degree ${deg_gj} in round ${this.round}, but the degree should be at most ${deg_j_g}`
            );
        }

        const sum = this.Fp.add(
            this.MPRp.eval(gj, [0n]),
            this.MPRp.eval(gj, [1n])
        );
        let result: bigint;
        if (this.round == 1) {
            result = this.S;
        } else {
            const challenge = this.challenges[this.challenges.length - 1];
            result = this.MPRp.eval(
                this.prover_pols[this.prover_pols.length - 2],
                [challenge]
            );
        }

        if (this.Fp.neq(sum, result)) {
            throw new Error(
                `Prover sent incorrect polynomial in round ${this.round} whose sum is ${sum} but should be ${result}`
            );
        }
    }

    check_last_polynomial_is_correct() {
        if (this.nvars - 1 !== this.challenges.length) {
            throw new Error(
                `Verifier has sent ${this.challenges.length} challenges but should have sent ${this.nvars}`
            );
        }

        const r: bigint = bigintRnd(this.Fp.p);
        this.challenges.push(r);
        const g_eval = this.MPRp.eval(this.pol, this.challenges.reverse());
        const gv_eval = this.MPRp.eval(
            this.prover_pols[this.prover_pols.length - 1],
            [r]
        );

        if (this.Fp.neq(g_eval, gv_eval)) {
            throw new Error(
                `Verifier sent incorrect final polynomial whose evaluation is ${gv_eval} but should be ${g_eval}`
            );
        } else {
            console.log("Verification succeeded");
            return true;
        }
    }
}

class SumCheckProtocol {
    readonly nvars: number;
    readonly P: Prover;
    readonly V: Verifier;
    round: number;
    readonly verbose: boolean;
    completed: boolean;

    // Constructor
    constructor(p: bigint, g: ArrayMap, verbose: boolean = false) {
        const nvars = count_number_of_variables(g);
        if (nvars < 1) {
            throw new Error(
                `I can't work with a polynomial of less than 1 variables.`
            );
        }

        this.nvars = nvars;
        this.P = new Prover(p, g, verbose);
        this.V = new Verifier(p, g, this.P.S, verbose);
        this.round = 1;
        this.verbose = verbose;
        this.completed = false;
    }

    next_round() {
        const P = this.P;
        const V = this.V;
        const completed = this.completed;

        if (!completed) {
            P.compute_and_send_next_polynomial(V);
            V.check_gj_is_correct();
            if (this.nvars === this.round) {
                const result = V.check_last_polynomial_is_correct();
                if (result) {
                    this.completed = true;
                } else {
                    throw new Error(`Verification failed`);
                }
            } else {
                this.V.compute_and_send_challenge(P);
                this.round += 1;
            }
        } else {
            throw new Error(`SumCheck has already finished.`);
        }
    }

    run_protocol() {
        while (!this.completed) {
            this.next_round();
        }
    }
}

// Main
const p = 97n;
const g = new ArrayMap();
g.set([3, 0, 0], 2n);
g.set([1, 0, 1], 1n);
g.set([0, 1, 1], 1n);
const SumCheck = new SumCheckProtocol(p, g, true);
SumCheck.run_protocol();
