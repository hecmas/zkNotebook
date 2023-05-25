import { PrimeField } from "../primeField";
import {
    ArrayMap,
    MultivariatePolynomialRing,
    count_number_of_variables,
} from "./multivariatePolynomialRing";
import { compute_eq_polynomial } from "./misc";
import { SumCheckProtocol } from "./sumcheck";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

class Prover {
    readonly Fp: PrimeField;
    readonly MPRp: MultivariatePolynomialRing;
    readonly nvars: number;
    pol: ArrayMap;
    verifier_random_vector: bigint[];
    ZC2SC_polynomial: ArrayMap;
    round: number;
    readonly verbose: boolean;

    // Constructor
    constructor(p: bigint, pol: ArrayMap, verbose: boolean = false) {
        const MPRp = new MultivariatePolynomialRing(p); // the ring of polynomials over Fp
        const Fp = MPRp.Fp; // the prime field over which the polynomials are defined

        this.Fp = Fp;
        this.MPRp = MPRp;
        this.nvars = count_number_of_variables(pol);
        this.pol = pol;
        this.verifier_random_vector;
        this.ZC2SC_polynomial;
        this.round = 1;
        this.verbose = verbose;

        // for (let i = 0; i < 2 ** this.nvars; i++) {
        //     const input = to_bits(BigInt(i), this.nvars);
        //     const evaluation = MPRp.eval(pol, input);
        //     if (this.Fp.neq(evaluation, 0n)) {
        //         throw new Error('The polynomial is not zero at all points in the ${this.nvars}-dimensional hypercube, so the Prover is not being honest.');
        //     }
        // }
    }

    receive_random_vector(r: bigint[]) {
        this.verifier_random_vector = r;
        if (this.verbose) {
            console.log(`P received random vector ${r} from V`);
        }
    }

    compute_and_send_ZC2SC_polynomial(V: Verifier) {
        const MPRp = this.MPRp;
        const nvars = this.nvars;

        const r = this.verifier_random_vector;
        const f = this.pol;
        const eq = MPRp.eval_symbolic(compute_eq_polynomial(this.Fp.p,nvars),r, nvars);
        const fhat = MPRp.mul(f, eq);

        this.ZC2SC_polynomial = fhat;
        V.receive_ZC2SC_polynomial(fhat);
        // this.round += 1;
    }
}

class Verifier {
    readonly Fp: PrimeField;
    readonly MPRp: MultivariatePolynomialRing;
    readonly nvars: number;
    readonly pol: ArrayMap;
    random_vector: bigint[];
    prover_ZC2SC_pol: ArrayMap;
    round: number;
    readonly verbose: boolean;

    // Constructor
    constructor(p: bigint, pol: ArrayMap, verbose: boolean = false) {
        const MPRp = new MultivariatePolynomialRing(p); // the ring of polynomials over Fp
        const Fp = MPRp.Fp; // the prime field over which the polynomials are defined

        this.Fp = Fp;
        this.MPRp = MPRp;
        this.nvars = count_number_of_variables(pol);
        this.pol = pol;
        this.random_vector;
        this.prover_ZC2SC_pol;
        this.round = 1;
        this.verbose = verbose;
    }

    compute_and_send_random_vector(P: Prover) {
        const r: bigint[] = [];
        for (let i = 0; i < this.nvars; i++) {
            r.push(bigintRnd(this.Fp.p));
        }

        this.random_vector = r;
        P.receive_random_vector(r);
        // this.round += 1;
    }

    receive_ZC2SC_polynomial(fhat: ArrayMap) {
        this.prover_ZC2SC_pol = fhat;
        if (this.verbose) {
            console.log(
                `V received polynomial fhat(X) = ${this.MPRp.toString(fhat)} from P`
            );
        }
    }
}

class ZeroCheckProtocol {
    readonly nvars: number;
    readonly P: Prover;
    readonly V: Verifier;
    readonly p: bigint;
    readonly verbose: boolean;

    // Constructor
    constructor(p: bigint, f: ArrayMap, verbose: boolean = false) {
        const nvars = count_number_of_variables(f);
        if (nvars < 1) {
            throw new Error(
                `I can't work with polynomials of less than 1 variable.`
            );
        }

        this.nvars = nvars;
        this.P = new Prover(p, f, verbose);
        this.V = new Verifier(p, f, verbose);
        this.p = p;
        this.verbose = verbose;

        if (this.verbose) {
            console.log(
                `Starting the ZeroCheck protocol to prove the evaluations of ${this.P.MPRp.toString(
                    f
                )} over the ${this.nvars
                }-dimensional boolean hypercube are all zero.`
            );
        }
    }

    ZC2SC_reduction(): ArrayMap {
        const P = this.P;
        const V = this.V;

        // Execute the reduction
        V.compute_and_send_random_vector(P);
        P.compute_and_send_ZC2SC_polynomial(V);
        const fhat = V.prover_ZC2SC_pol;
        return fhat;
    }

    run_sumcheck(fhat: ArrayMap): boolean {
        // Execute the SumCheck protocol on inputs (fhat,0)
        const SC = new SumCheckProtocol(this.p, fhat, 0n, this.verbose);
        const result = SC.run_protocol();
        return result;
    }

    run_protocol() {
        // Execute the reduction
        const fhat = this.ZC2SC_reduction();

        // Execute the SumCheck protocol over (fhat,0)
        const result = this.run_sumcheck(fhat);

        // Print the result
        if (this.verbose) {
            if (result) {
                console.log(
                    `ZeroCheck succeeded.`
                );
            } else {
                console.log(
                    `ZeroCheck failed.`
                );
            }
        }

        return result;
    }
}

// Main
const p = 97n;
const MPRp = new MultivariatePolynomialRing(p);
const g = MPRp.zero;
// g.set([3, 0], 2n);
// g.set([1, 0], 1n);
// g.set([0, 1], 1n);
const ZC = new ZeroCheckProtocol(p, g, true);
const result = ZC.run_protocol();