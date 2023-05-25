"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = exports.compute_eq_polynomial = void 0;
const multivariatePolynomialRing_1 = require("./multivariatePolynomialRing");
const utils_1 = require("./utils");
function compute_eq_polynomial(p, nvars) {
    const MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p); // the ring of polynomials over Fp
    let eq = new multivariatePolynomialRing_1.ArrayMap([[[], 1n]]);
    for (let i = 0; i < nvars; i++) {
        // Xi·Yi
        const firstarray = new Array(2 * nvars).fill(0);
        firstarray[i] = 1;
        firstarray[nvars + i] = 1;
        const first = new multivariatePolynomialRing_1.ArrayMap([[firstarray, 1n]]);
        // 1 - Xi
        const zeroarray = new Array(2 * nvars).fill(0);
        const secondarray2 = new Array(2 * nvars).fill(0);
        secondarray2[i] = 1;
        const second = new multivariatePolynomialRing_1.ArrayMap([[zeroarray, 1n], [secondarray2, -1n]]);
        // 1 - Yi
        const thirdarray = new Array(2 * nvars).fill(0);
        thirdarray[nvars + i] = 1;
        const third = new multivariatePolynomialRing_1.ArrayMap([[zeroarray, 1n], [thirdarray, -1n]]);
        // Xi·Yi + (1 - Xi)·(1 - Yi)
        const factor = MPRp.add(first, MPRp.mul(second, third));
        eq = MPRp.mul(eq, factor);
    }
    return eq;
}
exports.compute_eq_polynomial = compute_eq_polynomial;
/**
 *
 * @param p
 * @param f a multivariate polynomial over `Fp[X1,...,Xn]` where the degree in each variable is at most `d`
 * @param g a multivariate polynomial over `Fp[X1,...,Xn]` where the degree in each variable is at most `d`
 * @returns The polynomial over `Fp[X1,...,Xn,Xn+1]` that is equal to `(1 - Xn+1)·f(X) + Xn+1·g(X)`
 */
function merge(p, f, g) {
    const nvarsf = (0, multivariatePolynomialRing_1.count_number_of_variables)(f);
    const nvarsg = (0, multivariatePolynomialRing_1.count_number_of_variables)(g);
    const nvars = nvarsf >= nvarsg ? nvarsf : nvarsg;
    const MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p);
    // 1 - Xn+1, Xn+1
    const zeroarray = new Array(nvars + 1).fill(0);
    const onearray = new Array(nvars + 1).fill(0);
    onearray[0] = 1;
    const firstpol = new multivariatePolynomialRing_1.ArrayMap([[zeroarray, 1n], [onearray, -1n]]);
    const secondpol = new multivariatePolynomialRing_1.ArrayMap([[onearray, 1n]]);
    // (1 - Xn+1)·f(X) + Xn+1·g(X)
    const factor1 = MPRp.mul(firstpol, MPRp.increase_nvars(f, 1));
    const factor2 = MPRp.mul(secondpol, MPRp.increase_nvars(g, 1));
    return MPRp.add(factor1, factor2);
}
exports.merge = merge;
/**
 *
 * @param p
 * @param f a function with domain `{0,1}^n`. One can also view it as an `ArrayMap` between `{0,1}^n` and `Fp`
 * @returns The unique multilinear polynomial `ftilde` satisfying `ftilde(x) = f(x)` for all `x` in `{0,1}^n`
 */
// TODO: Improve it
function multivariate_Lagrange_interpolation(p, f) {
    const nvars = (0, multivariatePolynomialRing_1.count_number_of_variables)(f);
    if (f.size !== 1 << nvars) {
        throw new Error(`The function f must be defined on the whole domain {0,1}^${nvars}`);
    }
    const MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p);
    let ftilde = new multivariatePolynomialRing_1.ArrayMap([[[], 0n]]);
    for (let i = 0; i < 2 ** nvars; i++) {
        const input = (0, utils_1.to_bits)(BigInt(i), nvars);
        // get f(w)
        const feval = f.get(input.map(x => Number(x)));
        // compute L_w(x)
        const eq = compute_eq_polynomial(p, nvars);
        const Lagrange_i = MPRp.eval_symbolic(eq, input, nvars);
        const summand = MPRp.scalar_mul(feval, Lagrange_i);
        ftilde = MPRp.add(ftilde, summand);
    }
    return ftilde;
}
// Tests
let p = 97n;
let MPRp = new multivariatePolynomialRing_1.MultivariatePolynomialRing(p);
let f = new multivariatePolynomialRing_1.ArrayMap();
f.set([3], 2n);
f.set([1], 1n);
f.set([0, 1], 1n);
let g = new multivariatePolynomialRing_1.ArrayMap();
g.set([0, 0, 3], 66n);
g.set([1], 20n);
g.set([0, 1], 13n);
let merge_pol = merge(p, f, g);
let nvars = (0, multivariatePolynomialRing_1.count_number_of_variables)(merge_pol);
console.log(MPRp.toString(MPRp.eval_symbolic(merge_pol, [0n])));
console.log(MPRp.toString(MPRp.eval_symbolic(merge_pol, [1n])));
// let h = compute_eq_polynomial(p, 2);
// console.log(MPRp.toString(h));
// p = 11n;
// MPRp = new MultivariatePolynomialRing(p);
// let f = new ArrayMap();
// f.set([0, 0], 1n);
// f.set([1, 0], 1n);
// f.set([0, 1], 2n);
// f.set([1, 1], 4n);
// let nvars = count_number_of_variables(f);
// let ftilde = multivariate_Lagrange_interpolation(p, f);
// for (let i = 0; i < 1 << nvars; i++) {
//     const input = to_bits(BigInt(i), 2);
//     if (f.get(input.map(x => Number(x))) !== MPRp.eval(ftilde,input)) {
//         throw new Error(`The interpolation is incorrect`);
//     }
// }
// p = 23n;
// MPRp = new MultivariatePolynomialRing(p);
// f = new ArrayMap();
// f.set([0, 0, 0], 10n);
// f.set([1, 0, 0], 2n);
// f.set([0, 1, 0], 5n);
// f.set([1, 1, 0], 17n);
// f.set([0, 0, 1], 6n);
// f.set([1, 0, 1], 0n);
// f.set([0, 1, 1], 4n);
// f.set([1, 1, 1], 1n);
// nvars = count_number_of_variables(f);
// ftilde = multivariate_Lagrange_interpolation(p, f);
// for (let i = 0; i < 1 << nvars; i++) {
//     const input = to_bits(BigInt(i), nvars);
//     if (f.get(input.map(x => Number(x))) !== MPRp.eval(ftilde,input)) {
//         throw new Error(`The interpolation is incorrect`);
//     }
// }
//# sourceMappingURL=misc.js.map