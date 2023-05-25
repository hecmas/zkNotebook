"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multivariatePolynomialRing_1 = require("./multivariatePolynomialRing");
const misc_1 = require("./misc");
const sumcheck_1 = require("./sumcheck");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
class Prover {
    Fp;
    MPRp;
    nvars;
    pol;
    verifier_random_vector;
    ZC2SC_polynomial;
    round;
    verbose;
    // Constructor
    constructor(p, pol, verbose = false) {
        const MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p); // the ring of polynomials over Fp
        const Fp = MPRp.Fp; // the prime field over which the polynomials are defined
        this.Fp = Fp;
        this.MPRp = MPRp;
        this.nvars = (0, multivariatePolynomialRing_1.count_number_of_variables)(pol);
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
    receive_random_vector(r) {
        this.verifier_random_vector = r;
        if (this.verbose) {
            console.log(`P received random vector ${r} from V`);
        }
    }
    compute_and_send_ZC2SC_polynomial(V) {
        const MPRp = this.MPRp;
        const nvars = this.nvars;
        const r = this.verifier_random_vector;
        const f = this.pol;
        const eq = MPRp.eval_symbolic((0, misc_1.compute_eq_polynomial)(this.Fp.p, nvars), r, nvars);
        const fhat = MPRp.mul(f, eq);
        this.ZC2SC_polynomial = fhat;
        V.receive_ZC2SC_polynomial(fhat);
        // this.round += 1;
    }
}
class Verifier {
    Fp;
    MPRp;
    nvars;
    pol;
    random_vector;
    prover_ZC2SC_pol;
    round;
    verbose;
    // Constructor
    constructor(p, pol, verbose = false) {
        const MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p); // the ring of polynomials over Fp
        const Fp = MPRp.Fp; // the prime field over which the polynomials are defined
        this.Fp = Fp;
        this.MPRp = MPRp;
        this.nvars = (0, multivariatePolynomialRing_1.count_number_of_variables)(pol);
        this.pol = pol;
        this.random_vector;
        this.prover_ZC2SC_pol;
        this.round = 1;
        this.verbose = verbose;
    }
    compute_and_send_random_vector(P) {
        const r = [];
        for (let i = 0; i < this.nvars; i++) {
            r.push(bigintRnd(this.Fp.p));
        }
        this.random_vector = r;
        P.receive_random_vector(r);
        // this.round += 1;
    }
    receive_ZC2SC_polynomial(fhat) {
        this.prover_ZC2SC_pol = fhat;
        if (this.verbose) {
            console.log(`V received polynomial fhat(X) = ${this.MPRp.toString(fhat)} from P`);
        }
    }
}
class ZeroCheckProtocol {
    nvars;
    P;
    V;
    p;
    verbose;
    // Constructor
    constructor(p, f, verbose = false) {
        const nvars = (0, multivariatePolynomialRing_1.count_number_of_variables)(f);
        if (nvars < 1) {
            throw new Error(`I can't work with polynomials of less than 1 variable.`);
        }
        this.nvars = nvars;
        this.P = new Prover(p, f, verbose);
        this.V = new Verifier(p, f, verbose);
        this.p = p;
        this.verbose = verbose;
        if (this.verbose) {
            console.log(`Starting the ZeroCheck protocol to prove the evaluations of ${this.P.MPRp.toString(f)} over the ${this.nvars}-dimensional boolean hypercube are all zero.`);
        }
    }
    ZC2SC_reduction() {
        const P = this.P;
        const V = this.V;
        // Execute the reduction
        V.compute_and_send_random_vector(P);
        P.compute_and_send_ZC2SC_polynomial(V);
        const fhat = V.prover_ZC2SC_pol;
        return fhat;
    }
    run_sumcheck(fhat) {
        // Execute the SumCheck protocol on inputs (fhat,0)
        const SC = new sumcheck_1.SumCheckProtocol(this.p, fhat, 0n, this.verbose);
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
                console.log(`ZeroCheck succeeded.`);
            }
            else {
                console.log(`ZeroCheck failed.`);
            }
        }
        return result;
    }
}
// Main
const p = 97n;
const MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p);
const g = MPRp.zero;
// g.set([3, 0], 2n);
// g.set([1, 0], 1n);
// g.set([0, 1], 1n);
const ZC = new ZeroCheckProtocol(p, g, true);
const result = ZC.run_protocol();
//# sourceMappingURL=zerocheck.js.map