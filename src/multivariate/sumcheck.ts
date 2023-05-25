import { PrimeField } from "../primeField";
import {
    ArrayMap,
    MultivariatePolynomialRing,
    count_number_of_variables,
    degree,
    degree_j,
} from "./multivariatePolynomialRing";
import { to_bits } from "./utils";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

class Prover {
    readonly Fp: PrimeField;
    readonly MPRp: MultivariatePolynomialRing;
    readonly nvars: number;
    pols: ArrayMap[];
    verifier_challenges: bigint[];
    round: number;
    // readonly S: bigint;
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

        // let S = 0n;
        // for (let i = 0; i < 2 ** this.nvars; i++) {
        //     const input = to_bits(BigInt(i), this.nvars);
        //     const summand = MPRp.eval(pol, input);
        //     S = Fp.add(S, summand);
        // }
        // this.S = S;
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
                `P received challenge r_${this.round - 1} = ${c} in round ${
                    this.round - 1
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

    check_gj_is_correct(): boolean {
        const gj = this.prover_pols[this.prover_pols.length - 1];
        const deg_gj = degree(gj);
        const deg_j_g = degree_j(this.pol, this.nvars - (this.round - 1));
        if (deg_gj > deg_j_g) {
            console.log(
                `Prover sent a polynomial of degree ${deg_gj} in round ${this.round}, but the degree should be at most ${deg_j_g}`
            );
            return false;
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
            console.log(
                `Prover sent incorrect polynomial in round ${this.round} whose sum is ${sum} but should be ${result}`
            );
            return false;
        }

        if (this.verbose) {
            console.log(`Polynomial g_${this.round}(X) = ${this.MPRp.toString(gj, true)} is correct`);
        }
        return true;
    }

    check_last_polynomial_is_correct(): boolean {
        if (this.nvars - 1 !== this.challenges.length) {
            console.log(
                `Verifier has sent ${this.challenges.length} challenges but should have sent ${this.nvars}`
            );
            return false;
        }

        const r: bigint = bigintRnd(this.Fp.p);
        this.challenges.push(r);
        const g_eval = this.MPRp.eval(this.pol, this.challenges.reverse());
        const gv_eval = this.MPRp.eval(
            this.prover_pols[this.prover_pols.length - 1],
            [r]
        );

        if (this.Fp.neq(g_eval, gv_eval)) {
            console.log(
                `Verifier sent incorrect final polynomial whose evaluation is ${gv_eval} but should be ${g_eval}`
            );
            return false;
        }

        return true;
    }
}

export class SumCheckProtocol {
    readonly nvars: number;
    readonly P: Prover;
    readonly V: Verifier;
    round: number;
    readonly verbose: boolean;
    completed: boolean;

    // Constructor
    constructor(p: bigint, g: ArrayMap, S: bigint, verbose: boolean = false) {
        const nvars = count_number_of_variables(g);
        if (nvars < 1) {
            throw new Error(
                `I can't work with polynomials of less than 1 variables.`
            );
        }

        this.nvars = nvars;
        this.P = new Prover(p, g, verbose);
        this.V = new Verifier(p, g, S, verbose);
        this.round = 1;
        this.verbose = verbose;
        this.completed = false;

        if (this.verbose) {
            console.log(
                `Starting the SumCheck protocol to prove the sum of evaluations of ${this.P.MPRp.toString(
                    g
                )} over the ${
                    this.nvars
                }-dimensional boolean hypercube is equal to ${S}.`
            );
        }
    }

    next_round(): boolean {
        const P = this.P;
        const V = this.V;
        const completed = this.completed;

        if (!completed) {
            P.compute_and_send_next_polynomial(V);
            const gjcorrect = V.check_gj_is_correct();
            if (!gjcorrect) {
                return false;
            }

            if (this.nvars === this.round) {
                const result = V.check_last_polynomial_is_correct();
                this.completed = true;
                return result && true;
            } else {
                this.V.compute_and_send_challenge(P);
                this.round += 1;
                return true;
            }
        } else {
            throw new Error(`SumCheck has already finished.`);
        }
    }

    run_protocol(): boolean {
        while (!this.completed) {
            const round_result = this.next_round();
            if (!round_result) {
                if (this.verbose) {
                    console.log(`SumCheck failed in round ${this.round}`);
                }

                return false;
            }
        }

        if (this.verbose) {
            console.log(`SumCheck succeeded.`);
        }

        return true;
    }
}

// Main
// const p = 97n;
// const g = new ArrayMap();
// g.set([3, 0, 0], 2n);
// g.set([1, 0, 1], 1n);
// g.set([0, 1, 1], 1n);
// const SumCheck = new SumCheckProtocol(p, g, 12n, true);
// const result = SumCheck.run_protocol();
